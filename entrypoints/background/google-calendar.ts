// Google Calendar API calls

import { CalifyEvent, GoogleCalendar } from '../../types/event';
import { getAuthToken, removeAuthToken } from './google-auth';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

async function makeAuthenticatedRequest<T>(
  url: string,
  options: RequestInit = {},
  retry: boolean = true
): Promise<T> {
  const token = await getAuthToken(false);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Handle 401 Unauthorized - token expired
  if (response.status === 401 && retry) {
    await removeAuthToken(token);
    return makeAuthenticatedRequest<T>(url, options, false);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  return response.json();
}

export async function listCalendars(): Promise<GoogleCalendar[]> {
  const data = await makeAuthenticatedRequest<{ items: any[] }>(
    `${CALENDAR_API_BASE}/users/me/calendarList`
  );

  return data.items.map(cal => ({
    id: cal.id,
    summary: cal.summary,
    backgroundColor: cal.backgroundColor,
    primary: cal.primary
  }));
}

function convertToGoogleCalendarEvent(event: CalifyEvent): GoogleCalendarEvent {
  const googleEvent: GoogleCalendarEvent = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: event.isAllDay
      ? { date: event.startDate.split('T')[0] }
      : { dateTime: event.startDate, timeZone: event.timezone },
    end: event.isAllDay
      ? { date: event.endDate.split('T')[0] }
      : { dateTime: event.endDate, timeZone: event.timezone }
  };

  // Add recurrence rules
  if (event.recurrence) {
    const { frequency, interval, count, until, byDay } = event.recurrence;
    let rrule = `RRULE:FREQ=${frequency}`;
    if (interval) rrule += `;INTERVAL=${interval}`;
    if (count) rrule += `;COUNT=${count}`;
    if (until) rrule += `;UNTIL=${until.replace(/[-:]/g, '')}`;
    if (byDay) rrule += `;BYDAY=${byDay.join(',')}`;
    googleEvent.recurrence = [rrule];
  }

  // Add reminders
  if (event.reminders && event.reminders.length > 0) {
    googleEvent.reminders = {
      useDefault: false,
      overrides: event.reminders
    };
  }

  return googleEvent;
}

export async function createEvent(
  event: CalifyEvent,
  calendarId: string = 'primary'
): Promise<{ eventId: string; eventUrl: string }> {
  const googleEvent = convertToGoogleCalendarEvent(event);

  const data = await makeAuthenticatedRequest<{ id: string; htmlLink: string }>(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      body: JSON.stringify(googleEvent)
    }
  );

  return {
    eventId: data.id,
    eventUrl: data.htmlLink
  };
}
