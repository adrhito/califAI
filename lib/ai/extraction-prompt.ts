// Shared extraction prompt for AI providers

export const EXTRACTION_PROMPT = `You are an expert at extracting calendar event information from screenshots.

Analyze the provided image and extract ALL calendar events visible. For each event, provide:

1. **Title**: The event name/title
2. **Description**: Any additional details about the event (optional)
3. **Location**: Physical or virtual location (optional)
4. **Start Date/Time**: ISO 8601 format (e.g., "2024-03-15T14:00:00")
5. **End Date/Time**: ISO 8601 format
6. **Timezone**: IANA timezone (e.g., "America/New_York"). If not specified, use "America/Los_Angeles"
7. **Is All Day**: Boolean indicating if it's an all-day event
8. **Recurrence**: If the event repeats, provide the recurrence rule (optional)
9. **Reminders**: Any reminders mentioned (optional)
10. **Confidence**: Rate your confidence (0-1) for overall, title, date, time, and location

**Important Guidelines:**
- Extract dates and times carefully. If only a date is shown, assume it starts at 9:00 AM local time
- If end time is not specified, assume 1 hour duration
- Look for context clues: day names, relative dates ("tomorrow", "next week"), etc.
- If you see multiple events, extract all of them
- Be conservative with confidence scores - only mark high confidence if information is clear
- For all-day events, use dates without times (e.g., "2024-03-15")
- Current date/time context: ${new Date().toISOString()}

Return your response as a JSON object with this exact structure:
{
  "events": [
    {
      "title": "Event Title",
      "description": "Optional description",
      "location": "Optional location",
      "startDate": "2024-03-15T14:00:00",
      "endDate": "2024-03-15T15:00:00",
      "timezone": "America/New_York",
      "isAllDay": false,
      "recurrence": {
        "frequency": "WEEKLY",
        "interval": 1,
        "byDay": ["MO", "WE", "FR"]
      },
      "reminders": [
        {
          "method": "popup",
          "minutes": 15
        }
      ],
      "confidence": {
        "overall": 0.9,
        "title": 0.95,
        "date": 0.9,
        "time": 0.85,
        "location": 0.8
      }
    }
  ],
  "reasoning": "Optional: Brief explanation of your extraction"
}

If no events are found, return {"events": [], "reasoning": "No calendar events detected in the image"}`;
