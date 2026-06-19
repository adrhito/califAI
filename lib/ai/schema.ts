// Zod schemas for AI response validation

import { z } from 'zod';

export const RecurrenceRuleSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().positive().optional(),
  count: z.number().int().positive().optional(),
  until: z.string().optional(),
  byDay: z.array(z.string()).optional()
});

export const ReminderSchema = z.object({
  method: z.enum(['email', 'popup']),
  minutes: z.number().int().nonnegative()
});

// Helper to clean AI-generated text fields
function cleanTextField(text: string | null | undefined): string | undefined {
  if (!text) return undefined;

  const cleaned = text.trim();
  if (!cleaned) return undefined;

  // Filter out explanatory text patterns
  const invalidPatterns = [
    /\(.*?(no|not|none|null|n\/a|implied|district-wide).*?\)/i,
    /\(.*?(given|mentioned|specified|provided).*?\)/i,
    /no (specific )?location/i,
    /location.*?null/i,
    /null/i
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(cleaned)) {
      return undefined;
    }
  }

  return cleaned;
}

export const CalifyEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  startDate: z.string(), // ISO datetime
  endDate: z.string(),   // ISO datetime
  isAllDay: z.boolean(),
  recurrence: RecurrenceRuleSchema.nullable().optional(),
  reminders: z.array(ReminderSchema).nullable().optional()
}).transform(obj => ({
  ...obj,
  description: cleanTextField(obj.description),
  location: cleanTextField(obj.location),
  recurrence: obj.recurrence || undefined,
  reminders: obj.reminders || undefined
}));

export const AIExtractionResponseSchema = z.object({
  events: z.array(CalifyEventSchema),
  reasoning: z.string().optional()
});

export type AIExtractionResponse = z.infer<typeof AIExtractionResponseSchema>;
