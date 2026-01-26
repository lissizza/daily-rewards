import { z } from 'zod';

export const EventSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  eventTypeId: z.string().uuid().nullable(),
  customName: z.string().max(100).nullable(),
  points: z.number().int(),
  note: z.string().max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  createdAt: z.date(),
});

export type Event = z.infer<typeof EventSchema>;

export const CreateEventSchema = EventSchema.omit({ id: true, createdAt: true });
export type CreateEvent = z.infer<typeof CreateEventSchema>;
