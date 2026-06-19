// Typed Chrome messaging protocol

import { CalifyEvent, GoogleCalendar } from '../../types/event';
import { ExtractionResult } from '../ai/extraction';

// Message types from popup to service worker
export type BackgroundMessage =
  | { type: 'CAPTURE_AND_EXTRACT'; useSelection?: boolean }
  | { type: 'GET_CALENDARS' }
  | { type: 'CREATE_EVENT'; event: CalifyEvent; calendarId: string }
  | { type: 'CREATE_EVENTS'; events: CalifyEvent[]; calendarId: string }
  | { type: 'AUTHORIZE_GOOGLE' }
  | { type: 'CHECK_GOOGLE_AUTH' }
  | { type: 'GET_USER_INFO' }
  | { type: 'REVOKE_AUTH' }
  | { type: 'UPDATE_ICON'; primaryColor: string; secondaryColor: string };

// Response types from service worker to popup
export type BackgroundResponse<T extends BackgroundMessage['type']> =
  T extends 'CAPTURE_AND_EXTRACT' ? ExtractionResult :
  T extends 'GET_CALENDARS' ? { calendars: GoogleCalendar[] } :
  T extends 'CREATE_EVENT' ? { eventId: string; eventUrl: string } :
  T extends 'CREATE_EVENTS' ? { results: Array<{ eventId: string; eventUrl: string; title: string }> } :
  T extends 'AUTHORIZE_GOOGLE' ? { success: boolean } :
  T extends 'CHECK_GOOGLE_AUTH' ? { authorized: boolean } :
  T extends 'GET_USER_INFO' ? { email: string; name: string } | null :
  T extends 'REVOKE_AUTH' ? { success: boolean } :
  T extends 'UPDATE_ICON' ? { success: boolean } :
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
