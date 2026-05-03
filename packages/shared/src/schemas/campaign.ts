import { z } from "zod";
import {
  META_BILLING_EVENTS,
  META_CAMPAIGN_OBJECTIVES,
  META_OPTIMIZATION_GOALS,
} from "../constants";

export const CampaignStatus = z.enum([
  "draft",
  "pending_approval",
  "active",
  "paused",
  "completed",
  "archived",
]);
export type CampaignStatusType = z.infer<typeof CampaignStatus>;

export const campaignObjectiveSchema = z.enum(META_CAMPAIGN_OBJECTIVES);
export const optimizationGoalSchema = z.enum(META_OPTIMIZATION_GOALS);
export const billingEventSchema = z.enum(META_BILLING_EVENTS);

export const targetingSchema = z.object({
  geo_locations: z
    .array(
      z.object({
        type: z.enum(["country", "region", "city"]).default("city"),
        key: z.string(),
        name: z.string().optional(),
      }),
    )
    .optional(),
  age_min: z.number().int().min(13).max(65).optional(),
  age_max: z.number().int().min(13).max(65).optional(),
  genders: z.array(z.enum(["male", "female", "all"])).optional(),
  interests: z.array(z.string()).optional(),
  behaviors: z.array(z.string()).optional(),
  custom_audiences: z.array(z.string()).optional(),
  exclude_custom_audiences: z.array(z.string()).optional(),
  device_platforms: z.array(z.enum(["mobile", "desktop"])).optional(),
  publisher_platforms: z
    .array(z.enum(["facebook", "instagram", "audience_network", "messenger"]))
    .optional(),
});
export type Targeting = z.infer<typeof targetingSchema>;

export const createCampaignSchema = z.object({
  client_id: z.string().uuid().describe("UUID do cliente na plataforma BASE"),
  name: z.string().min(3).max(120).describe("Nome da campanha"),
  objective: campaignObjectiveSchema.describe("Objetivo de campanha do Meta"),
  daily_budget: z
    .number()
    .positive()
    .describe("Orçamento diário em BRL (será convertido pra centavos)"),
  lifetime_budget: z.number().positive().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  targeting: targetingSchema.optional(),
  reasoning: z
    .string()
    .min(10)
    .describe("Por que está criando essa campanha. Importante pra auditoria."),
});

export const updateCampaignSchema = z.object({
  campaign_id: z.string().uuid(),
  name: z.string().min(3).max(120).optional(),
  daily_budget: z.number().positive().optional(),
  lifetime_budget: z.number().positive().optional(),
  status: CampaignStatus.optional(),
  end_date: z.string().datetime().optional().nullable(),
  reasoning: z.string().min(10),
});

export const pauseCampaignSchema = z.object({
  campaign_id: z.string().uuid(),
  reason: z.string().min(5),
});

export const campaignSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  meta_account_id: z.string().uuid(),
  meta_campaign_id: z.string(),
  name: z.string(),
  objective: z.string(),
  status: CampaignStatus,
  daily_budget: z.number().nullable(),
  lifetime_budget: z.number().nullable(),
  total_spent: z.number(),
  targeting: targetingSchema.partial().passthrough().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  created_by_claude: z.boolean(),
  last_synced_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Campaign = z.infer<typeof campaignSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

// ─── Ad Set ──────────────────────────────────────────────────────────
export const createAdSetSchema = z.object({
  campaign_id: z.string().uuid(),
  name: z.string().min(3).max(120),
  daily_budget: z.number().positive().optional(),
  lifetime_budget: z.number().positive().optional(),
  optimization_goal: optimizationGoalSchema,
  billing_event: billingEventSchema,
  targeting: targetingSchema,
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  reasoning: z.string().min(10),
});

export type CreateAdSetInput = z.infer<typeof createAdSetSchema>;
