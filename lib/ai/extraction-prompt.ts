// Shared extraction prompt for AI providers

export const EXTRACTION_PROMPT = `Extract up to 5 calendar events from image. Current: ${new Date().toISOString()}

For each event provide:
- title (max 50 chars)
- startDate, endDate (ISO 8601)
- timezone (default: America/Los_Angeles)
- isAllDay (true/false)
- description, location, recurrence, reminders: set to null
- confidence: all values 0.7

Keep responses SHORT. Max 5 events.`;
