import { z } from "zod";

export const reportTypeSchema = z.enum(["weekly", "monthly", "custom", "executive"]);
export const reportFormatSchema = z.enum(["pdf", "csv", "web_link"]);

export const generateReportSchema = z.object({
  client_id: z.string().uuid(),
  type: reportTypeSchema.default("weekly"),
  format: reportFormatSchema.default("pdf"),
  period_start: z.string(),
  period_end: z.string(),
  include_creatives: z.boolean().default(true),
  include_audience_breakdown: z.boolean().default(true),
  include_recommendations: z.boolean().default(true),
});

export const reportSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  title: z.string(),
  type: z.string(),
  format: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  file_url: z.string().nullable(),
  file_size_bytes: z.number().nullable(),
  share_token: z.string().nullable(),
  share_token_expires_at: z.string().nullable(),
  data_snapshot: z.unknown().nullable(),
  generated_by: z.string().uuid().nullable(),
  generated_by_claude: z.boolean(),
  view_count: z.number().int(),
  last_viewed_at: z.string().nullable(),
  created_at: z.string(),
});

export type Report = z.infer<typeof reportSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
