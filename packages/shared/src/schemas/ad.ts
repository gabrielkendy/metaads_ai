import { z } from "zod";
import { META_CTA_TYPES } from "../constants";

export const AdStatus = z.enum([
  "pending_approval",
  "approved",
  "active",
  "paused",
  "rejected",
  "archived",
]);
export type AdStatusType = z.infer<typeof AdStatus>;

export const ctaTypeSchema = z.enum(META_CTA_TYPES);

export const createCreativeSchema = z.object({
  client_id: z.string().uuid(),
  ad_set_id: z.string().uuid().optional(),
  name: z.string().min(3).max(120),
  headline: z.string().min(3).max(40).describe("Título principal"),
  body: z.string().min(10).max(125).describe("Texto principal"),
  cta_type: ctaTypeSchema.default("LEARN_MORE"),
  link_url: z.string().url("URL inválida"),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  reasoning: z.string().min(10),
});

export const duplicateCreativeSchema = z.object({
  source_ad_id: z.string().uuid(),
  modifications: z.object({
    name: z.string().min(3).max(120).optional(),
    headline: z.string().min(3).max(40).optional(),
    body: z.string().min(10).max(125).optional(),
    cta_type: ctaTypeSchema.optional(),
    link_url: z.string().url().optional(),
    image_url: z.string().url().optional(),
  }),
  reasoning: z.string().min(10),
});

export const pauseAdSchema = z.object({
  ad_id: z.string().uuid(),
  reason: z.string().min(5),
});

export const approveCreativeSchema = z.object({
  ad_id: z.string().uuid(),
  approved: z.boolean(),
  feedback: z.string().optional(),
});

export const adSchema = z.object({
  id: z.string().uuid(),
  ad_set_id: z.string().uuid(),
  client_id: z.string().uuid(),
  meta_ad_id: z.string(),
  meta_creative_id: z.string().nullable(),
  name: z.string(),
  status: AdStatus,
  headline: z.string().nullable(),
  body: z.string().nullable(),
  cta_type: z.string().nullable(),
  link_url: z.string().nullable(),
  image_url: z.string().nullable(),
  video_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  approved_by_client: z.boolean(),
  approved_by_client_at: z.string().nullable(),
  approved_by_client_user: z.string().uuid().nullable(),
  last_synced_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Ad = z.infer<typeof adSchema>;
export type CreateCreativeInput = z.infer<typeof createCreativeSchema>;
export type ApproveCreativeInput = z.infer<typeof approveCreativeSchema>;
