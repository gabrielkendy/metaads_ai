import { z } from "zod";

export const granularitySchema = z.enum(["hour", "day", "week", "month"]);
export type Granularity = z.infer<typeof granularitySchema>;

export const dateRangeSchema = z
  .object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  })
  .refine((d) => new Date(d.end) >= new Date(d.start), {
    message: "Data final deve ser após a inicial",
  });

export const periodPresetSchema = z.enum([
  "today",
  "yesterday",
  "last_7_days",
  "last_14_days",
  "last_30_days",
  "this_month",
  "last_month",
  "this_quarter",
  "last_quarter",
  "ytd",
  "custom",
]);
export type PeriodPreset = z.infer<typeof periodPresetSchema>;

export const getPerformanceSchema = z.object({
  client_id: z.string().uuid(),
  period: periodPresetSchema.default("last_7_days"),
  custom_range: dateRangeSchema.optional(),
  granularity: granularitySchema.default("day"),
  breakdown: z
    .enum(["age", "gender", "placement", "device", "country", "campaign", "ad_set", "ad", "none"])
    .default("none"),
  campaign_id: z.string().uuid().optional(),
  ad_id: z.string().uuid().optional(),
});

export const performanceSnapshotSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  campaign_id: z.string().uuid().nullable(),
  ad_set_id: z.string().uuid().nullable(),
  ad_id: z.string().uuid().nullable(),
  period_start: z.string(),
  period_end: z.string(),
  granularity: granularitySchema,
  impressions: z.number().int(),
  reach: z.number().int(),
  clicks: z.number().int(),
  spend: z.number(),
  conversions: z.number().int(),
  conversion_value: z.number(),
  ctr: z.number().nullable(),
  cpc: z.number().nullable(),
  cpm: z.number().nullable(),
  cpa: z.number().nullable(),
  roas: z.number().nullable(),
  frequency: z.number().nullable(),
  breakdown_dimension: z.string().nullable(),
  breakdown_value: z.string().nullable(),
  raw_data: z.unknown().nullable(),
  created_at: z.string(),
});

export type PerformanceSnapshot = z.infer<typeof performanceSnapshotSchema>;
export type GetPerformanceInput = z.infer<typeof getPerformanceSchema>;

export const aggregatedMetricsSchema = z.object({
  impressions: z.number().int(),
  reach: z.number().int(),
  clicks: z.number().int(),
  spend: z.number(),
  conversions: z.number().int(),
  conversion_value: z.number(),
  ctr: z.number(),
  cpc: z.number(),
  cpm: z.number(),
  cpa: z.number(),
  roas: z.number(),
  frequency: z.number(),
});

export type AggregatedMetrics = z.infer<typeof aggregatedMetricsSchema>;
