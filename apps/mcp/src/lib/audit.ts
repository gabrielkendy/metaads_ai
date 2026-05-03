import { supabase } from "./supabase.js";
import { logger } from "./logger.js";

export interface AuditEntry {
  actorType: "claude" | "user" | "system" | "cron";
  actorId?: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  clientId?: string;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: Record<string, unknown>;
}

export async function auditLog(entry: AuditEntry) {
  try {
    await supabase.from("audit_logs").insert({
      actor_type: entry.actorType,
      actor_id: entry.actorId ?? null,
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      client_id: entry.clientId ?? null,
      before_data: entry.beforeData ?? null,
      after_data: entry.afterData ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (e) {
    logger.error("Failed to write audit log", { error: e, entry });
  }
}

export interface ClaudeActionEntry {
  clientId?: string;
  actionType: string;
  toolName: string;
  status?: "pending" | "in_progress" | "success" | "failed" | "cancelled";
  inputPayload: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  reasoning?: string;
  errorMessage?: string;
  approvalId?: string;
}

export async function logClaudeAction(entry: ClaudeActionEntry) {
  const { data, error } = await supabase
    .from("claude_actions")
    .insert({
      client_id: entry.clientId ?? null,
      action_type: entry.actionType,
      tool_name: entry.toolName,
      status: entry.status ?? "pending",
      input_payload: entry.inputPayload,
      output_payload: entry.outputPayload ?? null,
      reasoning: entry.reasoning ?? null,
      error_message: entry.errorMessage ?? null,
      approval_id: entry.approvalId ?? null,
    })
    .select()
    .single();
  if (error) {
    logger.error("Failed to log claude action", { error });
    return null;
  }
  return data;
}

export async function updateClaudeAction(
  id: string,
  updates: Partial<{
    status: "pending" | "in_progress" | "success" | "failed" | "cancelled";
    output_payload: unknown;
    error_message: string;
    completed_at: string;
    duration_ms: number;
  }>,
) {
  await supabase.from("claude_actions").update(updates).eq("id", id);
}
