// Message handlers for service worker

import { BackgroundMessage, MessageResponse } from './types';
import { captureVisibleTab, captureSelection } from '../../entrypoints/background/capture';
import { checkAuthStatus, authorizeUser, getUserInfo, revokeAuth } from '../../entrypoints/background/google-auth';
import { listCalendars, createEvent } from '../../entrypoints/background/google-calendar';
import { extractEventsFromImage } from '../ai/extraction';

export async function handleMessage(
  message: BackgroundMessage
): Promise<MessageResponse<BackgroundMessage['type']>> {
  try {
    switch (message.type) {
      case 'CAPTURE_AND_EXTRACT': {
        console.log('Starting capture, useSelection:', message.useSelection);

        if (message.useSelection) {
          // Selection mode: capture, reopen popup, then process
          let captureResult;
          let imageDataUrl;

          try {
            captureResult = await captureSelection();
            imageDataUrl = captureResult.imageDataUrl;
            console.log('Image captured, size:', imageDataUrl.length, 'bytes');
          } catch (selectionError) {
            // Selection failed (cancelled, too small, etc.)
            console.error('Selection capture failed:', selectionError);
            const errorMsg = selectionError instanceof Error ? selectionError.message : 'Selection failed';

            // Store error for popup to display
            await chrome.storage.session.set({
              processingCapture: false,
              captureComplete: true,
              captureError: errorMsg
            });

            // Try to reopen popup to show error
            let popupReopened = false;
            try {
              await chrome.action.openPopup();
              popupReopened = true;
              console.log('Popup reopened to show selection error');
            } catch (popupError) {
              console.log('Could not reopen popup, showing notification instead');
            }

            // If popup couldn't reopen, show notification
            if (!popupReopened) {
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon-128.png',
                title: 'CalifAI - Selection Failed',
                message: errorMsg + ' Click the extension icon.',
                priority: 2
              });
            }

            throw selectionError;
          }

          // Store that we're processing (timestamped so the popup can detect
          // a flag left behind by a killed service worker)
          await chrome.storage.session.set({
            processingCapture: true,
            processingStartedAt: Date.now()
          });

          // Reopen popup immediately after capture with retry
          let popupOpened = false;
          for (let i = 0; i < 3; i++) {
            try {
              await chrome.action.openPopup();
              popupOpened = true;
              console.log('Popup reopened successfully');
              break;
            } catch (e) {
              console.log(`Popup open attempt ${i + 1} failed:`, e);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          // If popup couldn't open, notify user
          if (!popupOpened) {
            console.log('Could not auto-open popup, showing notification');
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon-128.png',
              title: 'CalifAI - Processing',
              message: 'Processing your capture. Click the extension icon to view results.',
              priority: 2
            });
          }

          // Continue processing in background with error handling
          try {
            console.log('Starting extraction from image...');
            const extraction = await extractEventsFromImage(imageDataUrl);

            console.log('Extraction complete, events found:', extraction.events?.length || 0);

            if (extraction.events?.length > 0) {
              console.log('Event titles:', extraction.events.map(e => e.title).join(', '));
            }

            // Store final result
            console.log('Storing extraction result in session storage...');
            await chrome.storage.session.set({
              processingCapture: false,
              captureComplete: true,
              captureResult: extraction
            });
            console.log('Result stored successfully');

            // Notify user that processing is complete
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon-128.png',
              title: 'CalifAI - Ready',
              message: `Found ${extraction.events?.length || 0} event(s). Click the extension icon to review.`,
              priority: 2
            });

            return {
              success: true,
              data: extraction
            };
          } catch (extractionError) {
            // Store error so popup can display it
            console.error('Extraction failed:', extractionError);
            console.error('Error stack:', extractionError instanceof Error ? extractionError.stack : 'No stack trace');

            const errorMessage = extractionError instanceof Error ? extractionError.message : 'Failed to process capture';
            console.log('Storing error in session storage:', errorMessage);

            await chrome.storage.session.set({
              processingCapture: false,
              captureComplete: true,
              captureError: errorMessage
            });

            // Notify user of error
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon-128.png',
              title: 'CalifAI - Error',
              message: 'Processing failed. Click the extension icon to see details.',
              priority: 2
            });

            throw extractionError;
          }
        } else {
          // Full screen mode: normal flow
          const imageDataUrl = await captureVisibleTab();
          console.log('Image captured, size:', imageDataUrl.length, 'bytes');

          const extraction = await extractEventsFromImage(imageDataUrl);
          console.log('Extraction complete, events found:', extraction.events?.length || 0);

          return {
            success: true,
            data: extraction
          };
        }
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

      case 'GET_USER_INFO': {
        const userInfo = await getUserInfo();
        return {
          success: true,
          data: userInfo
        };
      }

      case 'REVOKE_AUTH': {
        await revokeAuth();
        return {
          success: true,
          data: { success: true }
        };
      }

      case 'UPDATE_ICON': {
        // The icon ImageData will be generated in the options page and stored
        // Here we just acknowledge and trigger a reload if needed
        return {
          success: true,
          data: { success: true }
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
    const code = (error as any)?.code;
    return {
      success: false,
      error: {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        // Retrying won't help auth errors - the user needs to reconnect
        retryable: code !== 'AUTH_REQUIRED'
      }
    };
  }
}
