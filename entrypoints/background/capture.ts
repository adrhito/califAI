// Screen capture utilities
import { cropImage } from '../../lib/utils/image-crop';
import { getSettings } from '../../lib/storage/settings';

export async function captureVisibleTab(): Promise<string> {
  // Try to get the active tab in the current window first (for browser action popup)
  let tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  // If no tab found or the current window is a popup, get the active tab from the last focused normal window
  if (!tabs || tabs.length === 0 || !tabs[0].id) {
    tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  }

  const tab = tabs[0];

  if (!tab || !tab.id || !tab.windowId) {
    throw new Error('No active tab found');
  }

  // Capture visible area as JPEG at high quality (will be optimized later based on provider)
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'jpeg',
    quality: 85
  });

  return dataUrl;
}

export async function captureSelection(): Promise<{ imageDataUrl: string; shouldReopenPopup: boolean }> {
  // Get active tab
  let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || tabs.length === 0 || !tabs[0].id) {
    tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  }

  const tab = tabs[0];
  if (!tab || !tab.id || !tab.windowId) {
    throw new Error('No active tab found');
  }

  // Ensure content script is loaded by trying to ping it first
  let contentScriptReady = false;
  try {
    console.log('Checking if content script is ready...');
    await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
    contentScriptReady = true;
    console.log('Content script is ready');
  } catch (error) {
    console.log('Content script not loaded, will inject manually');
  }

  // If content script not loaded, inject it
  if (!contentScriptReady) {
    try {
      console.log('Injecting content script...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-scripts/content.js']
      });
      // Wait for script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Content script injected successfully');
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw new Error('Failed to inject selection overlay. Please refresh the page and try again.');
    }
  }

  // Send message to content script to start selection
  let response;
  try {
    console.log('Sending START_SELECTION message to content script...');
    response = await chrome.tabs.sendMessage(tab.id, { type: 'START_SELECTION' });
    console.log('Received response:', response);
  } catch (error) {
    console.error('Failed to send message to content script:', error);
    throw new Error('Failed to communicate with page. Please refresh and try again.');
  }

  if (!response.success) {
    console.log('Selection failed or cancelled:', response.error);
    throw new Error(response.error || 'Selection cancelled');
  }

  const { coords } = response;
  console.log('Selection coordinates:', coords);
  console.log('Device pixel ratio:', coords.dpr, 'Browser zoom:', coords.zoom);

  // Capture full screen - REOPEN POPUP RIGHT AFTER THIS
  console.log('Capturing visible tab...');
  const fullDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'jpeg',
    quality: 85
  });
  console.log('Full screen captured, size:', fullDataUrl.length, 'bytes');

  // Crop to selection with device pixel ratio and zoom, downscaling to the
  // provider's target width in the same pass so the extraction step doesn't
  // need to decode and re-encode the image again
  const settings = await getSettings();
  const maxWidth = (settings.provider || 'gemini') === 'gemini' ? 768 : 1280;

  console.log('Cropping image to selection with DPR:', coords.dpr, 'Zoom:', coords.zoom, 'maxWidth:', maxWidth);
  const croppedDataUrl = await cropImage(fullDataUrl, coords, coords.dpr, coords.zoom, {
    maxWidth,
    quality: 0.7
  });
  console.log('Image cropped, size:', croppedDataUrl.length, 'bytes');

  return { imageDataUrl: croppedDataUrl, shouldReopenPopup: true };
}

export function dataUrlToBase64(dataUrl: string): string {
  // Remove data:image/jpeg;base64, prefix
  return dataUrl.split(',')[1];
}
