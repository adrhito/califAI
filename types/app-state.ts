// App state types for popup views

import { CalifyEvent } from './event';

export type AppView =
  | 'setup'           // First launch - need API key + Google auth
  | 'home'            // Ready to capture
  | 'loading'         // Capturing + extracting
  | 'event-selection' // Multiple events found
  | 'review'          // Single event or post-selection review
  | 'edit'            // User editing event
  | 'importing'       // Creating Google Calendar event
  | 'success'         // Event created successfully
  | 'error';          // Error occurred

export interface AppState {
  view: AppView;
  events: CalifyEvent[];
  selectedEventIndex: number | null;
  currentEvent: CalifyEvent | null;
  error: {
    message: string;
    code?: string;
    retryable: boolean;
  } | null;
  loading: {
    message: string;
    progress?: number;
  } | null;
  createdEventUrl?: string;
  capturedImage?: string; // Base64 data URL (only during loading)
}

export const initialAppState: AppState = {
  view: 'home',
  events: [],
  selectedEventIndex: null,
  currentEvent: null,
  error: null,
  loading: null
};
