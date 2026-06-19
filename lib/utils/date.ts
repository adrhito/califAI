// Date utilities

import { format } from 'date-fns';

export function formatDateForInput(isoString: string): string {
  return format(new Date(isoString), 'yyyy-MM-dd');
}

export function formatTimeForInput(isoString: string): string {
  return format(new Date(isoString), 'HH:mm');
}

export function formatDateForDisplay(isoString: string, dateFormat: 'US' | 'ISO' = 'US'): string {
  const date = new Date(isoString);
  return dateFormat === 'US'
    ? format(date, 'MM/dd/yyyy')
    : format(date, 'yyyy-MM-dd');
}

export function formatTimeForDisplay(isoString: string, timeFormat: '12h' | '24h' = '12h'): string {
  const date = new Date(isoString);
  return timeFormat === '12h'
    ? format(date, 'h:mm a')
    : format(date, 'HH:mm');
}

export function formatDateTimeForDisplay(
  isoString: string,
  dateFormat: 'US' | 'ISO' = 'US',
  timeFormat: '12h' | '24h' = '12h'
): string {
  return `${formatDateForDisplay(isoString, dateFormat)} ${formatTimeForDisplay(isoString, timeFormat)}`;
}

export function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
