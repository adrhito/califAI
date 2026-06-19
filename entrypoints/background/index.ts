// Service worker entry point

import { handleMessage } from '../../lib/messaging/handlers';
import { BackgroundMessage } from '../../lib/messaging/types';
import { applyIconColors } from '../../lib/utils/icon-generator';
import { getSettings } from '../../lib/storage/settings';

// chrome.action.setIcon is not persistent, so the user's custom icon colors
// must be re-applied every time the service worker starts
async function applyIconFromSettings() {
  try {
    const settings = await getSettings();
    await applyIconColors(settings.colorPrimary || '#FFDFB0', settings.colorSecondary || '#7D2E3D');
  } catch (error) {
    console.error('Failed to apply icon colors:', error);
  }
}

export default defineBackground(() => {
  console.log('CalifAI service worker started');

  applyIconFromSettings();

  // Re-apply whenever the user changes their theme colors in settings
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.colorPrimary || changes.colorSecondary)) {
      applyIconFromSettings();
    }
  });

  chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
    handleMessage(message)
      .then(response => sendResponse(response))
      .catch(error => {
        sendResponse({
          success: false,
          error: {
            error: error instanceof Error ? error.message : 'Unknown error',
            retryable: false
          }
        });
      });

    return true; // Indicates async response
  });
});
