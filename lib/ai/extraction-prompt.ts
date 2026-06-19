// Shared extraction prompt for AI providers
//
// The static body is kept byte-identical across requests and the current
// date (day granularity) is appended at the END, so Gemini's implicit
// prompt caching can reuse the long static prefix between captures.

const EXTRACTION_PROMPT_BODY = `Extract ALL calendar events from the provided content.

CRITICAL RULES:
- Extract EVERY event found, even if there are 50+ events in a list or schedule
- description: Extract ANY additional details, notes, or context about the event. Look for speaker names, topics, session details, room numbers, or any descriptive text. If truly nothing descriptive exists, set to empty string "".
- location: Extract SPECIFIC locations, addresses, room numbers, or venue names. If no location mentioned, set to empty string "".
- recurrence: DETECT recurring events and extract the recurrence pattern (see RECURRING EVENTS section below)
- NO hallucination - only extract data that is actually present in the content

MULTI-LINE EVENT BLOCKS (CRITICAL):
An event is often written as one header line (title/date/time) followed by one or more indented or sub-lines giving its location and/or description - NOT separate events. If a line has no date/time of its own and simply elaborates on the event directly above it (a room name, headcount, dietary notes, agenda details, etc.), fold it into that event's location/description instead of creating a new event.
Example - this is ONE event, NOT two:
  "Entrepreneurship Wed. June 17 Lunch 11:30-1:00
    Woolworth
    14 students, several vegetarian, no allergies - devil's pizza"
Output: { "title": "Entrepreneurship Lunch", "startDate": "2026-06-17T11:30:00", "endDate": "2026-06-17T13:00:00", "location": "Woolworth", "description": "14 students, several vegetarian, no allergies - devil's pizza", "isAllDay": false }
Only start a new event when a new line introduces its own date/time (or is clearly a distinct title for a different occasion).

HANDLING MISSING END TIMES (CRITICAL - READ CAREFULLY):
1. If the event shows ONLY a start time with NO end time mentioned:
   - ALWAYS add exactly 1 hour to the start time for the end time
   - Example: "2:00 PM Meeting" → start: 14:00:00, end: 15:00:00
   - Example: "9:30 AM Session" → start: 09:30:00, end: 10:30:00

2. If the event shows only a date with no times:
   - Set as all-day event (00:00:00 to 00:00:00, isAllDay: true)

3. If the event shows both start AND end times:
   - Use the exact times provided

4. NEVER guess or hallucinate end times - follow the 1-hour rule strictly

RECURRING EVENTS (CRITICAL):
Only mark an event as recurring if there is an EXPLICIT indication that it repeats on an ongoing basis. Look for:
- Explicit repetition words: "every day", "daily", "every week", "weekly", "every Monday", "every Mondays and Wednesdays", "weekdays", "weekends", "every month", "monthly", "annually", "every year"
- Explicit frequency: "twice a week", "every other week", "bi-weekly", "first Monday of each month"
- Explicit ongoing duration/count: "until [date]", "for 8 weeks", "10 sessions", "through December"

DO NOT mark an event as recurring just because it lists multiple days of the week or has separate entries per weekday. Naming the days something happens on is NOT the same as saying it repeats - each day is its own one-time event unless the text explicitly says it repeats (e.g. with "every", "weekly", a session count, or an end date for the pattern).
Example - this is THREE separate one-time events, NOT recurring:
  "Woolworth room reservation Mon and Tues
  Lunches on Mon and Tues
  Mon: phys/math
  Tues: bio/chem"
Here "Mon" and "Tues" each refer to a specific single date that week - extract one event for Monday and one for Tuesday, both with recurrence: null. Only use WEEKLY/byDay recurrence when the text explicitly says the pattern continues beyond the dates shown (e.g. "every Monday and Wednesday", "Tuesdays and Thursdays going forward").

If recurring event detected, extract recurrence pattern:
- frequency: "DAILY", "WEEKLY", "MONTHLY", or "YEARLY"
- interval: 1 for "every", 2 for "every other", 3 for "every third", etc.
- count: total number of occurrences if specified (e.g., "8 sessions" = count: 8)
- until: ISO date when recurrence ends (e.g., "until Dec 31" = "2026-12-31")
- byDay: for weekly events, array of days ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]

EXAMPLES OF RECURRING EVENTS (explicit repetition stated):
"Team Standup every Monday at 9 AM" → frequency: "WEEKLY", byDay: ["MO"]
"Yoga class every Tuesday and Thursday 6 PM" → frequency: "WEEKLY", byDay: ["TU", "TH"]
"Monthly review first Friday of month" → frequency: "MONTHLY", interval: 1
"Board meeting every other week through June" → frequency: "WEEKLY", interval: 2, until: "2026-06-30"
"Daily workout 7 AM for 30 days" → frequency: "DAILY", count: 30

EXAMPLES OF NON-RECURRING EVENTS (days named, but no repetition stated - each is its own one-time event):
"Mon: phys/math, Tues: bio/chem" → TWO one-time events, recurrence: null for both
"Yoga class Tuesday and Thursday this week, 6 PM" → TWO one-time events, recurrence: null for both

If NO recurrence indicators found, set recurrence to null.

For each event provide:
- title (concise, under 80 chars)
- startDate, endDate (ISO 8601 format, e.g., "2026-01-01T10:00:00") - BOTH REQUIRED
- isAllDay (true ONLY if no specific time is given, or explicitly stated)
- description: actual description text only, or "" if none
- location: specific location/address only, or "" if none
- recurrence: see RECURRING EVENTS section (null if not recurring)
- reminders: null (not supported yet)

EXAMPLES:

Input: "Team Meeting 2:00 PM - Discuss Q1 goals"
Output: {
  "title": "Team Meeting",
  "startDate": "2026-01-15T14:00:00",
  "endDate": "2026-01-15T15:00:00",  // Added 1 hour (no end time given)
  "description": "Discuss Q1 goals",
  "isAllDay": false
}

Input: "3:30 PM - Keynote by Dr. Smith, Room 301"
Output: {
  "title": "Keynote by Dr. Smith",
  "startDate": "2026-01-15T15:30:00",
  "endDate": "2026-01-15T16:30:00",  // Added 1 hour (no end time given)
  "description": "Keynote by Dr. Smith",
  "location": "Room 301",
  "isAllDay": false
}

Input: "Conference Jan 15"
Output: {
  "title": "Conference",
  "startDate": "2026-01-15T00:00:00",
  "endDate": "2026-01-15T00:00:00",
  "isAllDay": true
}

Input: "Team Standup every Monday 9:00 AM"
Output: {
  "title": "Team Standup",
  "startDate": "2026-01-20T09:00:00",  // Next Monday
  "endDate": "2026-01-20T10:00:00",
  "description": "",
  "location": "",
  "isAllDay": false,
  "recurrence": {
    "frequency": "WEEKLY",
    "interval": 1,
    "byDay": ["MO"]
  }
}

Input: "Yoga class Tuesdays & Thursdays 6 PM, 8 sessions"
Output: {
  "title": "Yoga class",
  "startDate": "2026-01-21T18:00:00",  // Next Tuesday
  "endDate": "2026-01-21T19:00:00",
  "description": "",
  "location": "",
  "isAllDay": false,
  "recurrence": {
    "frequency": "WEEKLY",
    "interval": 1,
    "byDay": ["TU", "TH"],
    "count": 8
  }
}

Return ONLY valid JSON in this exact format:
{
  "events": [
    {
      "title": "Event Title",
      "startDate": "2026-01-01T10:00:00",
      "endDate": "2026-01-01T11:00:00",
      "isAllDay": false,
      "description": "",
      "location": "",
      "recurrence": null,
      "reminders": null
    }
  ]
}`;

export function getExtractionPrompt(): string {
  // Day granularity is enough for resolving relative dates ("next Monday")
  // and keeps the prompt stable within a day for prompt caching
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const date = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  return `${EXTRACTION_PROMPT_BODY}\n\nCurrent date: ${weekday}, ${date}`;
}
