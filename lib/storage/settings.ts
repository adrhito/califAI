// chrome.storage.local abstraction for settings

import { STORAGE_KEYS } from './keys';
import { Reminder } from '../../types/event';

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

export interface Settings {
  geminiApiKey?: string;
  openaiApiKey?: string;
  provider?: 'openai' | 'gemini';
  geminiModel?: GeminiModel;
  extractionMode?: 'vision' | 'ocr';
  defaultCalendar?: string;
  defaultReminders?: Reminder[];
  defaultTimezone?: string;
  defaultEventColor?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  invertColors?: boolean;
  timeFormat?: '12h' | '24h';
  dateFormat?: 'US' | 'ISO';
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.GEMINI_API_KEY,
    STORAGE_KEYS.OPENAI_API_KEY,
    STORAGE_KEYS.PROVIDER,
    STORAGE_KEYS.GEMINI_MODEL,
    STORAGE_KEYS.EXTRACTION_MODE,
    STORAGE_KEYS.DEFAULT_CALENDAR,
    STORAGE_KEYS.DEFAULT_REMINDERS,
    STORAGE_KEYS.DEFAULT_TIMEZONE,
    STORAGE_KEYS.DEFAULT_EVENT_COLOR,
    STORAGE_KEYS.COLOR_PRIMARY,
    STORAGE_KEYS.COLOR_SECONDARY,
    STORAGE_KEYS.INVERT_COLORS,
    STORAGE_KEYS.TIME_FORMAT,
    STORAGE_KEYS.DATE_FORMAT
  ]);

  return {
    geminiApiKey: result[STORAGE_KEYS.GEMINI_API_KEY],
    openaiApiKey: result[STORAGE_KEYS.OPENAI_API_KEY],
    provider: result[STORAGE_KEYS.PROVIDER] || 'gemini',  // Default to free Gemini
    geminiModel: result[STORAGE_KEYS.GEMINI_MODEL] || 'gemini-2.5-flash',
    extractionMode: result[STORAGE_KEYS.EXTRACTION_MODE] || 'vision',  // Default to vision (OCR broken in service workers)
    defaultCalendar: result[STORAGE_KEYS.DEFAULT_CALENDAR],
    defaultReminders: result[STORAGE_KEYS.DEFAULT_REMINDERS],
    defaultTimezone: result[STORAGE_KEYS.DEFAULT_TIMEZONE],
    defaultEventColor: result[STORAGE_KEYS.DEFAULT_EVENT_COLOR],
    colorPrimary: result[STORAGE_KEYS.COLOR_PRIMARY] || '#FFDFB0',
    colorSecondary: result[STORAGE_KEYS.COLOR_SECONDARY] || '#7D2E3D',
    invertColors: result[STORAGE_KEYS.INVERT_COLORS] || false,
    timeFormat: result[STORAGE_KEYS.TIME_FORMAT] || '12h',
    dateFormat: result[STORAGE_KEYS.DATE_FORMAT] || 'US'
  };
}

export async function saveSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K]
): Promise<void> {
  const storageKey = {
    geminiApiKey: STORAGE_KEYS.GEMINI_API_KEY,
    openaiApiKey: STORAGE_KEYS.OPENAI_API_KEY,
    provider: STORAGE_KEYS.PROVIDER,
    geminiModel: STORAGE_KEYS.GEMINI_MODEL,
    extractionMode: STORAGE_KEYS.EXTRACTION_MODE,
    defaultCalendar: STORAGE_KEYS.DEFAULT_CALENDAR,
    defaultReminders: STORAGE_KEYS.DEFAULT_REMINDERS,
    defaultTimezone: STORAGE_KEYS.DEFAULT_TIMEZONE,
    defaultEventColor: STORAGE_KEYS.DEFAULT_EVENT_COLOR,
    colorPrimary: STORAGE_KEYS.COLOR_PRIMARY,
    colorSecondary: STORAGE_KEYS.COLOR_SECONDARY,
    invertColors: STORAGE_KEYS.INVERT_COLORS,
    timeFormat: STORAGE_KEYS.TIME_FORMAT,
    dateFormat: STORAGE_KEYS.DATE_FORMAT
  }[key];

  await chrome.storage.local.set({ [storageKey]: value });
}

export async function clearSettings(): Promise<void> {
  await chrome.storage.local.remove([
    STORAGE_KEYS.GEMINI_API_KEY,
    STORAGE_KEYS.OPENAI_API_KEY,
    STORAGE_KEYS.PROVIDER,
    STORAGE_KEYS.EXTRACTION_MODE,
    STORAGE_KEYS.DEFAULT_CALENDAR,
    STORAGE_KEYS.DEFAULT_REMINDERS,
    STORAGE_KEYS.DEFAULT_TIMEZONE,
    STORAGE_KEYS.DEFAULT_EVENT_COLOR,
    STORAGE_KEYS.COLOR_PRIMARY,
    STORAGE_KEYS.COLOR_SECONDARY,
    STORAGE_KEYS.INVERT_COLORS,
    STORAGE_KEYS.TIME_FORMAT,
    STORAGE_KEYS.DATE_FORMAT
  ]);
}
