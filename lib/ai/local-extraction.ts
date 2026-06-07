// Local OCR extraction - runs in popup context where Web Workers are available
// NOTE: This must run in popup, not service worker, because Tesseract needs Web Workers

import { AIExtractionResponse, CalifyEventSchema } from './schema';
import * as chrono from 'chrono-node';
import Tesseract from 'tesseract.js';

export async function extractEventsLocally(imageDataUrl: string): Promise<AIExtractionResponse> {
  try {
    console.log('Starting local OCR extraction in popup...');

    // Note: Tesseract.js has CSP issues in Chrome extensions
    // The workerBlobURL option may help bypass importScripts restrictions
    console.log('Creating OCR worker with blob URL...');

    const worker = await Tesseract.createWorker('eng', 1, {
      workerBlobURL: true,  // Create blob URL to bypass CSP restrictions
      logger: m => console.log('OCR progress:', m),
    });

    console.log('Running OCR...');
    const { data: { text } } = await worker.recognize(imageDataUrl);

    console.log('Terminating worker...');
    await worker.terminate();

    console.log('Extracted text:', text);

    if (!text || text.trim().length === 0) {
      return {
        events: [],
        reasoning: 'No text found in image'
      };
    }

    // Parse dates and times using Chrono
    const parsedDates = chrono.parse(text);
    console.log('Found dates:', parsedDates);

    if (parsedDates.length === 0) {
      return {
        events: [],
        reasoning: 'No dates found in extracted text'
      };
    }

    // Extract events from parsed data
    const events = extractEventsFromText(text, parsedDates);

    return {
      events,
      reasoning: `Extracted ${events.length} event(s) from OCR text`
    };
  } catch (error) {
    console.error('Local extraction error:', error);
    throw new Error(`Local OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractEventsFromText(text: string, parsedDates: any[]): any[] {
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
        if (prevLine && !isDateLine(prevLine)) {
          title = cleanTitle(prevLine);
        }
      }

      // Check same line for title (before date)
      const sameLine = lines[dateLineIndex];
      const beforeDate = sameLine.substring(0, sameLine.indexOf(dateText)).trim();
      if (beforeDate && !isDateLine(beforeDate)) {
        title = cleanTitle(beforeDate);
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

function isDateLine(text: string): boolean {
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

function cleanTitle(text: string): string {
  // Remove common prefixes and clean up
  return text
    .replace(/^(event|meeting|call|conference|webinar):/i, '')
    .replace(/^[-•*]\s*/, '')
    .trim()
    .substring(0, 100);
}
