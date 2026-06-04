// Local OCR provider using Tesseract.js - completely free and private
// NOTE: This runs in the popup, not the service worker, because Tesseract needs Web Workers

import { AIProvider } from './types';
import { AIExtractionResponse, CalifyEventSchema } from './schema';
import * as chrono from 'chrono-node';

export class LocalProvider implements AIProvider {
  name = 'local';

  async extractEvents(imageBase64: string, _apiKey: string): Promise<AIExtractionResponse> {
    // NOTE: This should NOT be called from the service worker anymore!
    // Local extraction now happens in popup context via local-extraction.ts
    // This is kept for backward compatibility but will throw a helpful error
    throw new Error(
      'Local provider cannot run in service worker context. ' +
      'Please use CAPTURE_TAB message and run local extraction in popup.'
    );
  }

  private extractEventsFromText(text: string, parsedDates: any[]): any[] {
    const events = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Try to find event titles near dates
    for (const dateMatch of parsedDates) {
      const dateText = dateMatch.text;
      const startDate = dateMatch.start.date();

      // Calculate end date (default to 1 hour later)
      let endDate = new Date(startDate);
      if (dateMatch.end) {
        endDate = dateMatch.end.date();
      } else {
        endDate.setHours(endDate.getHours() + 1);
      }

      // Find the line containing this date
      const dateLineIndex = lines.findIndex(line =>
        line.toLowerCase().includes(dateText.toLowerCase())
      );

      // Look for title in nearby lines
      let title = 'Extracted Event';
      let description = '';
      let location = '';

      if (dateLineIndex !== -1) {
        // Check previous line for title
        if (dateLineIndex > 0) {
          const prevLine = lines[dateLineIndex - 1].trim();
          if (prevLine && !this.isDateLine(prevLine)) {
            title = this.cleanTitle(prevLine);
          }
        }

        // Check same line for title (before date)
        const sameLine = lines[dateLineIndex];
        const beforeDate = sameLine.substring(0, sameLine.indexOf(dateText)).trim();
        if (beforeDate && !this.isDateLine(beforeDate)) {
          title = this.cleanTitle(beforeDate);
        }

        // Look for location indicators
        for (let i = Math.max(0, dateLineIndex - 2); i <= Math.min(lines.length - 1, dateLineIndex + 2); i++) {
          const line = lines[i].toLowerCase();
          if (line.includes('location:') || line.includes('where:') || line.includes('venue:') || line.includes('@')) {
            location = lines[i].split(/location:|where:|venue:|@/i)[1]?.trim() || '';
            break;
          }
        }

        // Collect description from nearby lines
        const contextLines = [];
        for (let i = Math.max(0, dateLineIndex - 1); i <= Math.min(lines.length - 1, dateLineIndex + 3); i++) {
          if (i !== dateLineIndex && lines[i].trim() !== title) {
            contextLines.push(lines[i].trim());
          }
        }
        description = contextLines.join(' ').substring(0, 200);
      }

      // Determine timezone (default to system timezone)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Check if it's an all-day event (no specific time mentioned)
      const hasTime = dateMatch.start.knownValues.hour !== undefined;

      const event = {
        title,
        description: description || null,
        location: location || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timezone,
        isAllDay: !hasTime,
        recurrence: null,
        reminders: null,
        confidence: {
          overall: 0.6,
          title: 0.5,
          date: 0.8,
          time: hasTime ? 0.7 : 0.3,
          location: location ? 0.6 : 0.3
        }
      };

      // Validate with schema
      try {
        const validated = CalifyEventSchema.parse(event);
        events.push(validated);
      } catch (error) {
        console.warn('Event validation failed:', error);
      }
    }

    return events;
  }

  private isDateLine(text: string): boolean {
    // Check if line is primarily a date/time
    const dateWords = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december',
                       'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                       'am', 'pm', 'pst', 'est', 'cst', 'mst'];

    const lowerText = text.toLowerCase();
    const wordCount = text.split(/\s+/).length;
    const dateWordCount = dateWords.filter(word => lowerText.includes(word)).length;

    return dateWordCount >= 2 || (wordCount <= 5 && dateWordCount >= 1);
  }

  private cleanTitle(text: string): string {
    // Remove common prefixes and clean up
    return text
      .replace(/^(event|meeting|call|conference|webinar):/i, '')
      .replace(/^[-•*]\s*/, '')
      .trim()
      .substring(0, 100);
  }
}
