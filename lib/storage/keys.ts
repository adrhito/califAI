// Storage key constants

export const STORAGE_KEYS = {
  // chrome.storage.local - persistent
  GEMINI_API_KEY: 'geminiApiKey',
  OPENAI_API_KEY: 'openaiApiKey',
  PROVIDER: 'provider',
  GEMINI_MODEL: 'geminiModel',
  EXTRACTION_MODE: 'extractionMode',
  DEFAULT_CALENDAR: 'defaultCalendar',
  DEFAULT_REMINDERS: 'defaultReminders',
  DEFAULT_TIMEZONE: 'defaultTimezone',
  DEFAULT_EVENT_COLOR: 'defaultEventColor',
  COLOR_PRIMARY: 'colorPrimary',
  COLOR_SECONDARY: 'colorSecondary',
  INVERT_COLORS: 'invertColors',
  TIME_FORMAT: 'timeFormat',
  DATE_FORMAT: 'dateFormat',

  // chrome.storage.local - Google OAuth token (managed by google-auth.ts)
  GOOGLE_ACCESS_TOKEN: 'googleAccessToken',
  GOOGLE_TOKEN_EXPIRES_AT: 'googleTokenExpiresAt',
  GOOGLE_LOGIN_HINT: 'googleLoginHint',

  // chrome.storage.session - cleared on browser close
  APP_STATE: 'appState',
  CAPTURED_EVENTS: 'capturedEvents'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
