// Service worker entry point

import { handleMessage } from '../../lib/messaging/handlers';
import { BackgroundMessage } from '../../lib/messaging/types';

export default defineBackground(() => {
  console.log('CalifAI service worker started');

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
