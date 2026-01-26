import { z } from 'zod';

export const EventTypeSchema = z.object({
  id: z.string().uuid(),
  admin_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  default_points: z.number().int(),
  is_deduction: z.boolean(),
  icon: z.string().nullable().optional(),
  sort_order: z.number().int(),
  created_at: z.string().datetime(),
});

export type EventType = z.infer<typeof EventTypeSchema>;

export const CreateEventTypeSchema = z.object({
  name: z.string().min(1).max(100),
  default_points: z.number().int().default(0),
  is_deduction: z.boolean().default(false),
  icon: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

export type CreateEventType = z.infer<typeof CreateEventTypeSchema>;

export const UpdateEventTypeSchema = CreateEventTypeSchema.partial();
export type UpdateEventType = z.infer<typeof UpdateEventTypeSchema>;
