import { z } from 'zod';

export const EventSchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  event_type_id: z.string().uuid().nullable(),
  custom_name: z.string().max(100).nullable(),
  points: z.number().int(),
  note: z.string().max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  created_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});

export type Event = z.infer<typeof EventSchema>;

export const CreateEventSchema = z.object({
  child_id: z.string().uuid(),
  event_type_id: z.string().uuid().nullable().optional(),
  custom_name: z.string().max(100).nullable().optional(),
  points: z.number().int(),
  note: z.string().max(500).default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateEvent = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = z.object({
  event_type_id: z.string().uuid().nullable().optional(),
  custom_name: z.string().max(100).nullable().optional(),
  points: z.number().int().optional(),
  note: z.string().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type UpdateEvent = z.infer<typeof UpdateEventSchema>;
