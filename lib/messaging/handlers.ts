// Message handlers for service worker

import { BackgroundMessage, MessageResponse } from './types';
import { captureVisibleTab } from '../../entrypoints/background/capture';
import { checkAuthStatus, authorizeUser } from '../../entrypoints/background/google-auth';
import { listCalendars, createEvent } from '../../entrypoints/background/google-calendar';
import { extractEventsFromImage } from '../ai/extraction';

export async function handleMessage(
  message: BackgroundMessage
): Promise<MessageResponse<BackgroundMessage['type']>> {
  try {
    switch (message.type) {
      case 'CAPTURE_AND_EXTRACT': {
        const imageDataUrl = await captureVisibleTab();
        const extraction = await extractEventsFromImage(imageDataUrl);
        return {
          success: true,
          data: extraction
        };
      }

      case 'CAPTURE_TAB': {
        const imageDataUrl = await captureVisibleTab();
        return {
          success: true,
          data: { imageDataUrl }
        };
      }

      case 'GET_CALENDARS': {
        const calendars = await listCalendars();
        return {
          success: true,
          data: { calendars }
        };
      }

      case 'CREATE_EVENT': {
        const result = await createEvent(message.event, message.calendarId);
        return {
          success: true,
          data: result
        };
      }

      case 'CREATE_EVENTS': {
        const results = [];
        for (const event of message.events) {
          const result = await createEvent(event, message.calendarId);
          results.push({
            eventId: result.eventId,
            eventUrl: result.eventUrl,
            title: event.title
          });
        }
        return {
          success: true,
          data: { results }
        };
      }

      case 'AUTHORIZE_GOOGLE': {
        const success = await authorizeUser();
        return {
          success: true,
          data: { success }
        };
      }

      case 'CHECK_GOOGLE_AUTH': {
        const authorized = await checkAuthStatus();
        return {
          success: true,
          data: { authorized }
        };
      }

      default:
        return {
          success: false,
          error: {
            error: 'Unknown message type',
            retryable: false
          }
        };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        retryable: true
      }
    };
  }
}
