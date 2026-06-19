// Generate shareable Google Calendar link for an event

import { CalifyEvent } from '../../types/event';

function formatDateForGoogleCalendar(dateString: string, isAllDay: boolean): string {
  const date = new Date(dateString);

  if (isAllDay) {
    // All-day events use YYYYMMDD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  } else {
    // Timed events use YYYYMMDDTHHMMSSZ format (UTC)
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

function formatRecurrenceForGoogleCalendar(event: CalifyEvent): string {
  if (!event.recurrence) return '';

  const { frequency, interval, count, until, byDay } = event.recurrence;
  let rrule = `RRULE:FREQ=${frequency}`;

  if (interval && interval > 1) rrule += `;INTERVAL=${interval}`;
  if (count) rrule += `;COUNT=${count}`;
  if (until) {
    const untilDate = new Date(until);
    const untilStr = untilDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    rrule += `;UNTIL=${untilStr}`;
  }
  if (byDay && byDay.length > 0) rrule += `;BYDAY=${byDay.join(',')}`;

  return rrule;
}

// Generate ONE link covering all the given events. Google Calendar has no
// URL that adds multiple events at once (action=TEMPLATE is single-event
// only), so the closest single link is the calendar itself, opened at the
// date range containing the events: day view if they share a day, week view
// if they fall within 7 days, month view otherwise.
export function generateCalendarViewLink(events: CalifyEvent[]): string {
  const starts = events
    .map(e => new Date(e.startDate))
    .sort((a, b) => a.getTime() - b.getTime());
  const first = starts[0];
  const last = starts[starts.length - 1];

  const year = first.getFullYear();
  const month = first.getMonth() + 1;
  const day = first.getDate();

  const sameDay = first.toDateString() === last.toDateString();
  const withinWeek = last.getTime() - first.getTime() <= 6 * 24 * 60 * 60 * 1000;

  if (sameDay) {
    return `https://calendar.google.com/calendar/r/day/${year}/${month}/${day}`;
  }
  if (withinWeek) {
    return `https://calendar.google.com/calendar/r/week/${year}/${month}/${day}`;
  }
  return `https://calendar.google.com/calendar/r/month/${year}/${month}`;
}

export function generateGoogleCalendarLink(event: CalifyEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title
  });

  // Format dates
  const startDate = formatDateForGoogleCalendar(event.startDate, event.isAllDay);
  const endDate = formatDateForGoogleCalendar(event.endDate, event.isAllDay);
  params.append('dates', `${startDate}/${endDate}`);

  // Add optional fields
  if (event.description) {
    params.append('details', event.description);
  }

  if (event.location) {
    params.append('location', event.location);
  }

  // Add recurrence
  if (event.recurrence) {
    params.append('recur', formatRecurrenceForGoogleCalendar(event));
  }

  return `${baseUrl}?${params.toString()}`;
}
