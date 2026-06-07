// chrome.storage.local abstraction for settings

import { STORAGE_KEYS } from './keys';
import { Reminder } from '../../types/event';

export interface Settings {
  apiKey?: string;
  provider?: 'openai' | 'gemini'; // Removed local provider due to CSP issues
  defaultCalendar?: string;
  defaultReminders?: Reminder[];
  defaultTimezone?: string;
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.API_KEY,
    STORAGE_KEYS.PROVIDER,
    STORAGE_KEYS.DEFAULT_CALENDAR,
    STORAGE_KEYS.DEFAULT_REMINDERS,
    STORAGE_KEYS.DEFAULT_TIMEZONE
  ]);

  return {
    apiKey: result[STORAGE_KEYS.API_KEY],
    provider: result[STORAGE_KEYS.PROVIDER] || 'gemini',  // Default to free Gemini
    defaultCalendar: result[STORAGE_KEYS.DEFAULT_CALENDAR],
    defaultReminders: result[STORAGE_KEYS.DEFAULT_REMINDERS],
    defaultTimezone: result[STORAGE_KEYS.DEFAULT_TIMEZONE]
  };
}

export async function saveSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K]
): Promise<void> {
  const storageKey = {
    apiKey: STORAGE_KEYS.API_KEY,
    provider: STORAGE_KEYS.PROVIDER,
    defaultCalendar: STORAGE_KEYS.DEFAULT_CALENDAR,
    defaultReminders: STORAGE_KEYS.DEFAULT_REMINDERS,
    defaultTimezone: STORAGE_KEYS.DEFAULT_TIMEZONE
  }[key];

  await chrome.storage.local.set({ [storageKey]: value });
}

export async function clearSettings(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEYS.API_KEY,
    STORAGE_KEYS.PROVIDER,
    STORAGE_KEYS.DEFAULT_CALENDAR,
    STORAGE_KEYS.DEFAULT_REMINDERS,
    STORAGE_KEYS.DEFAULT_TIMEZONE
  ]);
}
