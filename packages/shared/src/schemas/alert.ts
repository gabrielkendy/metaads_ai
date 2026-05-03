import { z } from "zod";

export const AlertSeverity = z.enum(["info", "warning", "error", "critical"]);
export type AlertSeverityType = z.infer<typeof AlertSeverity>;

export const AlertType = z.enum([
  "ctr_drop",
  "cpm_high",
  "budget_low",
  "creative_fatigue",
  "audience_overlap",
  "account_suspended",
  "token_expired",
  "custom",
]);
export type AlertTypeType = z.infer<typeof AlertType>;

export const AlertStatus = z.enum(["active", "acknowledged", "resolved", "dismissed"]);
export type AlertStatusType = z.infer<typeof AlertStatus>;

export const createAlertSchema = z.object({
  client_id: z.string().uuid(),
  type: AlertType,
  severity: AlertSeverity.default("warning"),
  title: z.string().min(3).max(140),
  message: z.string().min(10).max(1000),
  campaign_id: z.string().uuid().optional(),
  ad_id: z.string().uuid().optional(),
  data: z.record(z.unknown()).optional(),
});

export const resolveAlertSchema = z.object({
  alert_id: z.string().uuid(),
  resolution_notes: z.string().min(5).max(500).optional(),
});

export const alertSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  campaign_id: z.string().uuid().nullable(),
  ad_id: z.string().uuid().nullable(),
  type: AlertType,
  severity: AlertSeverity,
  status: AlertStatus,
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).nullable(),
  acknowledged_by: z.string().uuid().nullable(),
  acknowledged_at: z.string().nullable(),
  resolved_by: z.string().uuid().nullable(),
  resolved_at: z.string().nullable(),
  resolution_notes: z.string().nullable(),
  auto_resolved: z.boolean(),
  created_at: z.string(),
});

export type Alert = z.infer<typeof alertSchema>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
