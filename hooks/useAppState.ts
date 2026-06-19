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
  setSelectedEventIndices: (indices: number[]) => void;
  setEditingEventIndex: (index: number | null) => void;
  setError: (error: AppState['error']) => void;
  setNotice: (notice: string | null) => void;
  setLoading: (loading: AppState['loading']) => void;
  setCreatedEventUrl: (url: string) => void;
  setCreatedEventUrls: (urls: string[]) => void;
  goBack: () => void;
  goHome: () => void;
  reset: () => void;
  // Hydrate from storage
  hydrate: () => Promise<void>;
}

export const useAppState = create<AppStateStore>((set, get) => ({
  ...initialAppState,

  setView: (view) => {
    const currentView = get().view;
    const history = get().viewHistory;

    // Don't add 'loading' or 'edit' to navigation history
    // Edit is a modal-like view that shouldn't be in back navigation
    if (currentView !== view && currentView !== 'loading' && currentView !== 'edit') {
      set({ view, viewHistory: [...history, currentView] });
    } else {
      set({ view });
    }
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

  setSelectedEventIndices: (selectedEventIndices) => {
    set({ selectedEventIndices });
    saveAppState(get());
  },

  setEditingEventIndex: (editingEventIndex) => {
    set({ editingEventIndex });
    saveAppState(get());
  },

  setError: (error) => {
    set({ error });
    saveAppState(get());
  },

  setNotice: (notice) => {
    set({ notice });
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

  setCreatedEventUrls: (urls) => {
    set({ createdEventUrls: urls });
    saveAppState(get());
  },

  goBack: () => {
    const history = get().viewHistory;
    if (history.length > 0) {
      const previousView = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      set({ view: previousView, viewHistory: newHistory });
      saveAppState(get());
    } else {
      // No history, go to home
      set({ view: 'home' });
      saveAppState(get());
    }
  },

  goHome: () => {
    set({ view: 'home', viewHistory: [] });
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
