// Screen capture utilities

export async function captureVisibleTab(): Promise<string> {
  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    throw new Error('No active tab found');
  }

  // Capture visible area as JPEG (smaller file size for API calls)
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'jpeg',
    quality: 85
  });

  return dataUrl;
}

export function dataUrlToBase64(dataUrl: string): string {
  // Remove data:image/jpeg;base64, prefix
  return dataUrl.split(',')[1];
}
