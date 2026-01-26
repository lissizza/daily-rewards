import { z } from 'zod';

export const RoleSchema = z.enum(['admin', 'child']);
export type Role = z.infer<typeof RoleSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  login: z.string().min(3).max(50).nullable(),
  name: z.string().min(1).max(100),
  avatar_url: z.string().url().nullable().optional(),
  role: RoleSchema,
  parent_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const CreateChildSchema = z.object({
  login: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
});

export type CreateChild = z.infer<typeof CreateChildSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
});

export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
