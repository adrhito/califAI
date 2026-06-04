// Zustand store with chrome.storage.session persistence

import { create } from 'zustand';
import { AppState, initialAppState, AppView } from '../types/app-state';
import { CalifyEvent } from '../types/event';
import { getAppState, saveAppState } from '../lib/storage/session';

interface AppStateStore extends AppState {
  // Actions
  setView: (view: AppView) => void;
  setEvents: (events: CalifyEvent[]) => void;
  setCurrentEvent: (event: CalifyEvent | null) => void;
  setSelectedEventIndex: (index: number | null) => void;
  setError: (error: AppState['error']) => void;
  setLoading: (loading: AppState['loading']) => void;
  setCreatedEventUrl: (url: string) => void;
  reset: () => void;
  // Hydrate from storage
  hydrate: () => Promise<void>;
}

export const useAppState = create<AppStateStore>((set, get) => ({
  ...initialAppState,

  setView: (view) => {
    set({ view });
    saveAppState(get());
  },

  setEvents: (events) => {
    set({ events });
    saveAppState(get());
  },

  setCurrentEvent: (currentEvent) => {
    set({ currentEvent });
    saveAppState(get());
  },

  setSelectedEventIndex: (selectedEventIndex) => {
    set({ selectedEventIndex });
    saveAppState(get());
  },

  setError: (error) => {
    set({ error });
    saveAppState(get());
  },

  setLoading: (loading) => {
    set({ loading });
    saveAppState(get());
  },

  setCreatedEventUrl: (url) => {
    set({ createdEventUrl: url });
    saveAppState(get());
  },

  reset: () => {
    set(initialAppState);
    saveAppState(initialAppState);
  },

  hydrate: async () => {
    const state = await getAppState();
    set(state);
  }
}));
