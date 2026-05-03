import { z } from "zod";

export const ApprovalStatus = z.enum(["pending", "approved", "rejected", "expired"]);
export type ApprovalStatusType = z.infer<typeof ApprovalStatus>;

export const ApprovalType = z.enum([
  "create_campaign",
  "pause_campaign",
  "budget_change",
  "creative_launch",
  "targeting_change",
  "account_action",
]);
export type ApprovalTypeType = z.infer<typeof ApprovalType>;

export const requestApprovalSchema = z.object({
  client_id: z.string().uuid(),
  type: ApprovalType,
  title: z.string().min(5).max(180),
  description: z.string().max(2000).optional(),
  payload: z.record(z.unknown()),
  estimated_impact: z
    .object({
      monthly_budget: z.number().optional(),
      audience_size: z.number().optional(),
      platforms: z.array(z.string()).optional(),
    })
    .partial()
    .optional(),
  claude_reasoning: z.string().min(10),
  claude_action_id: z.string().uuid().optional(),
  expires_in_hours: z.number().int().positive().default(24),
});

export const decideApprovalSchema = z.object({
  approval_id: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export const approvalSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  type: ApprovalType,
  status: ApprovalStatus,
  title: z.string(),
  description: z.string().nullable(),
  payload: z.record(z.unknown()),
  estimated_impact: z.record(z.unknown()).nullable(),
  claude_reasoning: z.string().nullable(),
  claude_action_id: z.string().uuid().nullable(),
  approved_by: z.string().uuid().nullable(),
  approved_at: z.string().nullable(),
  rejected_by: z.string().uuid().nullable(),
  rejected_at: z.string().nullable(),
  rejection_reason: z.string().nullable(),
  expires_at: z.string().nullable(),
  created_at: z.string(),
});

export type Approval = z.infer<typeof approvalSchema>;
export type RequestApprovalInput = z.infer<typeof requestApprovalSchema>;
export type DecideApprovalInput = z.infer<typeof decideApprovalSchema>;
