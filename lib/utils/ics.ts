// Generate a single .ics file containing all events.
//
// Google Calendar has no link that adds multiple events at once, so a
// one-file iCalendar export is the only way to hand a whole set of events
// to someone else in a single artifact. Recipients can import it into
// Google Calendar (Settings -> Import & export), Outlook, or Apple Calendar.

import { CalifyEvent } from '../../types/event';

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Timed events as UTC instants (YYYYMMDDTHHMMSSZ)
function formatUtc(dateString: string): string {
  return new Date(dateString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// All-day events as date-only values (YYYYMMDD)
function formatDateOnly(dateString: string, addDays: number = 0): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + addDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatRrule(event: CalifyEvent): string | null {
  if (!event.recurrence) return null;

  const { frequency, interval, count, until, byDay } = event.recurrence;
  let rrule = `RRULE:FREQ=${frequency}`;
  if (interval && interval > 1) rrule += `;INTERVAL=${interval}`;
  if (count) rrule += `;COUNT=${count}`;
  if (until) {
    const untilStr = new Date(until).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    rrule += `;UNTIL=${untilStr}`;
  }
  if (byDay && byDay.length > 0) rrule += `;BYDAY=${byDay.join(',')}`;
  return rrule;
}

export function generateIcsContent(events: CalifyEvent[]): string {
  const dtstamp = formatUtc(new Date().toISOString());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CalifAI//Calendar Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach((event, index) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${dtstamp}-${index}@califai`);
    lines.push(`DTSTAMP:${dtstamp}`);

    if (event.isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(event.startDate)}`);
      // DTEND is exclusive for all-day events, so add one day
      lines.push(`DTEND;VALUE=DATE:${formatDateOnly(event.endDate, 1)}`);
    } else {
      lines.push(`DTSTART:${formatUtc(event.startDate)}`);
      lines.push(`DTEND:${formatUtc(event.endDate)}`);
    }

    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }

    const rrule = formatRrule(event);
    if (rrule) {
      lines.push(rrule);
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function downloadIcsFile(events: CalifyEvent[], filename: string = 'califai-events.ics'): void {
  const blob = new Blob([generateIcsContent(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
