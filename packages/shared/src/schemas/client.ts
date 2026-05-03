import { z } from "zod";

export const ClientStatus = z.enum(["active", "paused", "churned", "onboarding"]);
export type ClientStatusType = z.infer<typeof ClientStatus>;

export const PlanTier = z.enum(["starter", "pro", "premium", "custom"]);
export type PlanTierType = z.infer<typeof PlanTier>;

export const slugSchema = z
  .string()
  .min(2, "Slug muito curto")
  .max(48, "Slug muito longo")
  .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífen");

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Cor hexadecimal inválida (#RRGGBB)");

export const cnpjSchema = z
  .string()
  .regex(
    /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/,
    "CNPJ inválido. Use formato 00.000.000/0000-00",
  )
  .optional()
  .or(z.literal(""));

// ─── Create / Update ─────────────────────────────────────────────────
export const createClientSchema = z.object({
  slug: slugSchema,
  name: z.string().min(2).max(120),
  legal_name: z.string().max(180).optional().or(z.literal("")),
  cnpj: cnpjSchema,
  industry: z.string().max(60).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  website_url: z.string().url("URL inválida").optional().or(z.literal("")),
  logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  brand_primary_color: hexColorSchema.default("#3D5AFE"),
  brand_secondary_color: hexColorSchema.default("#0a0a0a"),
  status: ClientStatus.default("onboarding"),
  plan: PlanTier.default("pro"),
  monthly_budget_limit: z.number().positive().optional(),
  monthly_budget_soft_cap: z.number().positive().optional(),
  max_meta_accounts: z.number().int().positive().default(1),
  requires_approval_above: z.number().nonnegative().default(1000),
  auto_approve_creatives: z.boolean().default(false),
  internal_notes: z.string().max(2000).optional().or(z.literal("")),
});

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid(),
});

export const clientSchema = createClientSchema.extend({
  id: z.string().uuid(),
  onboarding_completed: z.boolean(),
  onboarding_step: z.number().int(),
  contracted_at: z.string().nullable(),
  churned_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Client = z.infer<typeof clientSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ─── Convite de cliente ──────────────────────────────────────────────
export const inviteClientUserSchema = z.object({
  client_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["client_admin", "client_viewer"]).default("client_admin"),
  send_email: z.boolean().default(true),
});

export type InviteClientUserInput = z.infer<typeof inviteClientUserSchema>;
