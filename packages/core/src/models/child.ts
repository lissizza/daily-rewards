import { z } from 'zod';

export const ChildSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  avatar: z.string().optional(),
  createdAt: z.date(),
});

export type Child = z.infer<typeof ChildSchema>;

export const CreateChildSchema = ChildSchema.omit({ id: true, createdAt: true });
export type CreateChild = z.infer<typeof CreateChildSchema>;
