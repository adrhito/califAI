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
  timezone: string; // IANA timezone
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
  reminders?: Reminder[];
  calendarId?: string;
  confidence?: {
    overall: number; // 0-1
    title: number;
    date: number;
    time: number;
    location: number;
  };
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
}
