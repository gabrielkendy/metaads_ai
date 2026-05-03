"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/helpers";

export async function approveCreativeAction(
  adId: string,
  approved: boolean,
  feedback?: string,
) {
  const user = await requireUser();
  const supabase = await createServerClient();
  const sb = createAdminClient();

  // Confirma vínculo do user com o client desse ad
  const { data: ad } = await supabase.from("ads").select("id, client_id, name").eq("id", adId).single();
  if (!ad) return { ok: false, error: "Anúncio não encontrado" };

  const { data: link } = await supabase
    .from("client_users")
    .select("id")
    .eq("user_id", user.id)
    .eq("client_id", ad.client_id)
    .single();

  // Admin tem acesso direto
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile && ["admin", "super_admin"].includes(profile.role);
  if (!link && !isAdmin) {
    return { ok: false, error: "Sem permissão" };
  }

  const { error } = await sb
    .from("ads")
    .update({
      status: approved ? "approved" : "rejected",
      approved_by_client: approved,
      approved_by_client_at: approved ? new Date().toISOString() : null,
      approved_by_client_user: approved ? user.id : null,
    })
    .eq("id", adId);

  if (error) return { ok: false, error: error.message };

  // Audit
  await sb.from("audit_logs").insert({
    actor_type: "user",
    actor_id: user.id,
    actor_email: user.email,
    action: approved ? "creative.approved" : "creative.rejected",
    resource_type: "ad",
    resource_id: adId,
    client_id: ad.client_id,
    metadata: feedback ? { feedback } : {},
  });

  // Notificar admins (Realtime + central)
  const { data: admins } = await sb.from("profiles").select("id").in("role", ["admin", "super_admin"]);
  if (admins?.length) {
    await sb.from("notifications").insert(
      admins.map((a) => ({
        user_id: a.id,
        client_id: ad.client_id,
        channel: "in_app" as const,
        type: "creative",
        title: approved ? "Criativo aprovado pelo cliente" : "Criativo rejeitado pelo cliente",
        message: `${ad.name} ${approved ? "foi aprovado" : "foi rejeitado"}${feedback ? ` — feedback: ${feedback}` : ""}`,
      })),
    );
  }

  revalidatePath("/admin/clients");
  revalidatePath("/cliente", "layout");
  return { ok: true };
}
