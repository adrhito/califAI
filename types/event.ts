// Core event types for calendar events

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  count?: number;
  until?: string; // ISO date
  byDay?: string[]; // e.g., ['MO', 'WE', 'FR']
}

export interface Reminder {
  method: 'email' | 'popup';
  minutes: number;
}

export interface CalifyEvent {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO datetime
  endDate: string; // ISO datetime
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
  reminders?: Reminder[];
  calendarId?: string;
  colorId?: string; // Google Calendar color ID (1-11)
}

// Google Calendar event colors
export const CALENDAR_COLORS = [
  { id: '1', name: 'Lavender', hex: '#a4bdfc' },
  { id: '2', name: 'Sage', hex: '#7ae7bf' },
  { id: '3', name: 'Grape', hex: '#dbadff' },
  { id: '4', name: 'Flamingo', hex: '#ff887c' },
  { id: '5', name: 'Banana', hex: '#fbd75b' },
  { id: '6', name: 'Tangerine', hex: '#ffb878' },
  { id: '7', name: 'Peacock', hex: '#46d6db' },
  { id: '8', name: 'Graphite', hex: '#e1e1e1' },
  { id: '9', name: 'Blueberry', hex: '#5484ed' },
  { id: '10', name: 'Basil', hex: '#51b749' },
  { id: '11', name: 'Tomato', hex: '#dc2127' },
] as const;

export interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
}
