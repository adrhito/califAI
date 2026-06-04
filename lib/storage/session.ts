// chrome.storage.session abstraction for temporary state

import { STORAGE_KEYS } from './keys';
import { AppState, initialAppState } from '../../types/app-state';
import { CalifyEvent } from '../../types/event';

export async function getAppState(): Promise<AppState> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.APP_STATE);
  return result[STORAGE_KEYS.APP_STATE] || initialAppState;
}

export async function saveAppState(state: AppState): Promise<void> {
  await chrome.storage.session.set({ [STORAGE_KEYS.APP_STATE]: state });
}

export async function clearAppState(): Promise<void> {
  await chrome.storage.session.remove(STORAGE_KEYS.APP_STATE);
}

export async function getCapturedEvents(): Promise<CalifyEvent[]> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.CAPTURED_EVENTS);
  return result[STORAGE_KEYS.CAPTURED_EVENTS] || [];
}

export async function saveCapturedEvents(events: CalifyEvent[]): Promise<void> {
  await chrome.storage.session.set({ [STORAGE_KEYS.CAPTURED_EVENTS]: events });
}

export async function clearCapturedEvents(): Promise<void> {
  await chrome.storage.session.remove(STORAGE_KEYS.CAPTURED_EVENTS);
}
