"use server";

import { revalidatePath } from "next/cache";
import { decideApprovalSchema } from "@base-trafego/shared/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/helpers";

export async function decideApproval(
  approvalId: string,
  decision: "approve" | "reject",
  reason?: string,
) {
  const profile = await requireAdmin();
  const parsed = decideApprovalSchema.safeParse({
    approval_id: approvalId,
    decision,
    reason,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const sb = createAdminClient();

  const { data: approval } = await sb
    .from("approvals")
    .select("*")
    .eq("id", approvalId)
    .single();

  if (!approval) return { ok: false, error: "Aprovação não encontrada" };
  if (approval.status !== "pending") {
    return { ok: false, error: `Aprovação já está em status ${approval.status}` };
  }

  const updates =
    decision === "approve"
      ? {
          status: "approved" as const,
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
        }
      : {
          status: "rejected" as const,
          rejected_by: profile.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason ?? null,
        };

  const { error } = await sb.from("approvals").update(updates).eq("id", approvalId);
  if (error) return { ok: false, error: error.message };

  // Atualiza claude_action vinculada
  if (approval.claude_action_id) {
    await sb
      .from("claude_actions")
      .update({
        status: decision === "approve" ? "in_progress" : "cancelled",
      })
      .eq("id", approval.claude_action_id);
  }

  // Audit
  await sb.from("audit_logs").insert({
    actor_type: "user",
    actor_id: profile.id,
    actor_email: profile.email,
    action: `approval.${decision === "approve" ? "approved" : "rejected"}`,
    resource_type: "approval",
    resource_id: approvalId,
    client_id: approval.client_id,
    after_data: updates as never,
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  return { ok: true };
}
