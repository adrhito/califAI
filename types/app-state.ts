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
  viewHistory: AppView[]; // Navigation history for back button
  events: CalifyEvent[];
  selectedEventIndex: number | null;
  selectedEventIndices: number[]; // For multi-select
  editingEventIndex: number | null; // Which event is being edited (for multi-select)
  currentEvent: CalifyEvent | null;
  error: {
    message: string;
    code?: string;
    retryable: boolean;
  } | null;
  // Transient informational banner (e.g. "Added 3 events") - unlike error,
  // it doesn't interrupt the current view
  notice: string | null;
  loading: {
    message: string;
    progress?: number;
  } | null;
  createdEventUrl?: string;
  createdEventUrls: string[]; // For multiple events
  capturedImage?: string; // Base64 data URL (only during loading)
}

export const initialAppState: AppState = {
  view: 'home',
  viewHistory: [],
  events: [],
  selectedEventIndex: null,
  selectedEventIndices: [],
  editingEventIndex: null,
  currentEvent: null,
  error: null,
  notice: null,
  loading: null,
  createdEventUrls: []
};
