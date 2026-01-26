import { z } from 'zod';

export const EventTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  defaultPoints: z.number().int(),
  isDeduction: z.boolean(),
  isSystem: z.boolean(),
  icon: z.string().optional(),
  order: z.number().int(),
});

export type EventType = z.infer<typeof EventTypeSchema>;

export const CreateEventTypeSchema = EventTypeSchema.omit({ id: true });
export type CreateEventType = z.infer<typeof CreateEventTypeSchema>;
