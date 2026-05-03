import { z } from "zod";

export const userRoleSchema = z.enum(["super_admin", "admin", "client_admin", "client_viewer"]);
export type UserRoleType = z.infer<typeof userRoleSchema>;

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  is_active: z.boolean(),
  preferences: z.record(z.unknown()),
  metadata: z.record(z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
  last_seen_at: z.string().nullable(),
});

export type Profile = z.infer<typeof profileSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  redirect_to: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  preferences: z.record(z.unknown()).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
