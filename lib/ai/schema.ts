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

export const ConfidenceSchema = z.object({
  overall: z.number().min(0).max(1),
  title: z.number().min(0).max(1),
  date: z.number().min(0).max(1),
  time: z.number().min(0).max(1),
  location: z.number().min(0).max(1)
});

export const CalifyEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string(), // ISO datetime
  endDate: z.string(),   // ISO datetime
  timezone: z.string(),
  isAllDay: z.boolean(),
  recurrence: RecurrenceRuleSchema.optional(),
  reminders: z.array(ReminderSchema).optional(),
  confidence: ConfidenceSchema.optional()
});

export const AIExtractionResponseSchema = z.object({
  events: z.array(CalifyEventSchema),
  reasoning: z.string().optional()
});

export type AIExtractionResponse = z.infer<typeof AIExtractionResponseSchema>;
