// Storage key constants

export const STORAGE_KEYS = {
  // chrome.storage.local - persistent
  API_KEY: 'apiKey',
  PROVIDER: 'provider',
  DEFAULT_CALENDAR: 'defaultCalendar',
  DEFAULT_REMINDERS: 'defaultReminders',
  DEFAULT_TIMEZONE: 'defaultTimezone',

  // chrome.storage.session - cleared on browser close
  APP_STATE: 'appState',
  CAPTURED_EVENTS: 'capturedEvents'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
