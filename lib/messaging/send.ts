// Send messages to service worker with type safety

import { BackgroundMessage, MessageResponse } from './types';

export async function sendToBackground<T extends BackgroundMessage['type']>(
  message: Extract<BackgroundMessage, { type: T }>
): Promise<MessageResponse<T>> {
  try {
    const response = await chrome.runtime.sendMessage(message);
    return response;
  } catch (error) {
    return {
      success: false,
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: false
      }
    };
  }
}
