// Typed Chrome messaging protocol

import { CalifyEvent, GoogleCalendar } from '../../types/event';
import { AIExtractionResponse } from '../ai/schema';

// Message types from popup to service worker
export type BackgroundMessage =
  | { type: 'CAPTURE_AND_EXTRACT' }
  | { type: 'CAPTURE_TAB' } // Just capture, no extraction (for local provider)
  | { type: 'GET_CALENDARS' }
  | { type: 'CREATE_EVENT'; event: CalifyEvent; calendarId: string }
  | { type: 'CREATE_EVENTS'; events: CalifyEvent[]; calendarId: string }
  | { type: 'AUTHORIZE_GOOGLE' }
  | { type: 'CHECK_GOOGLE_AUTH' };

// Response types from service worker to popup
export type BackgroundResponse<T extends BackgroundMessage['type']> =
  T extends 'CAPTURE_AND_EXTRACT' ? AIExtractionResponse :
  T extends 'CAPTURE_TAB' ? { imageDataUrl: string } :
  T extends 'GET_CALENDARS' ? { calendars: GoogleCalendar[] } :
  T extends 'CREATE_EVENT' ? { eventId: string; eventUrl: string } :
  T extends 'CREATE_EVENTS' ? { results: Array<{ eventId: string; eventUrl: string; title: string }> } :
  T extends 'AUTHORIZE_GOOGLE' ? { success: boolean } :
  T extends 'CHECK_GOOGLE_AUTH' ? { authorized: boolean } :
  never;

// Error response
export interface MessageError {
  error: string;
  code?: string;
  retryable?: boolean;
}

// Combined response type
export type MessageResponse<T extends BackgroundMessage['type']> =
  | { success: true; data: BackgroundResponse<T> }
  | { success: false; error: MessageError };
