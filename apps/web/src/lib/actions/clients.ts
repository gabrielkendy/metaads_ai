"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClientSchema, updateClientSchema } from "@base-trafego/shared/schemas";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/helpers";

export async function createClientAction(formData: FormData) {
  await requireAdmin();

  const raw = {
    slug: formData.get("slug") as string,
    name: formData.get("name") as string,
    legal_name: formData.get("legal_name") as string,
    cnpj: formData.get("cnpj") as string,
    industry: formData.get("industry") as string,
    description: formData.get("description") as string,
    website_url: formData.get("website_url") as string,
    logo_url: formData.get("logo_url") as string,
    brand_primary_color: (formData.get("brand_primary_color") as string) || "#3D5AFE",
    brand_secondary_color: (formData.get("brand_secondary_color") as string) || "#0a0a0a",
    plan: (formData.get("plan") as never) || "pro",
    status: (formData.get("status") as never) || "onboarding",
    monthly_budget_limit: formData.get("monthly_budget_limit")
      ? Number(formData.get("monthly_budget_limit"))
      : undefined,
    monthly_budget_soft_cap: formData.get("monthly_budget_soft_cap")
      ? Number(formData.get("monthly_budget_soft_cap"))
      : undefined,
    requires_approval_above: formData.get("requires_approval_above")
      ? Number(formData.get("requires_approval_above"))
      : 1000,
    auto_approve_creatives: formData.get("auto_approve_creatives") === "on",
    max_meta_accounts: formData.get("max_meta_accounts")
      ? Number(formData.get("max_meta_accounts"))
      : 1,
    internal_notes: formData.get("internal_notes") as string,
  };

  const parsed = createClientSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Validação falhou" };
  }

  const sb = createAdminClient();
  const { data, error } = await sb.from("clients").insert(parsed.data).select().single();

  if (error) {
    return { ok: false, error: error.message };
  }

  // Cria agent_config padrão
  await sb.from("agent_configs").insert({ client_id: data.id });

  // Audit log
  await sb.from("audit_logs").insert({
    actor_type: "user",
    action: "client.created",
    resource_type: "client",
    resource_id: data.id,
    client_id: data.id,
    after_data: data as never,
  });

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${data.id}`);
}

export async function updateClientAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { ok: false, error: "ID ausente" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateClientSchema.partial().safeParse({ ...raw, id });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Validação falhou" };
  }

  const sb = createAdminClient();
  const { error } = await sb
    .from("clients")
    .update(parsed.data as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/clients/${id}`);
  return { ok: true };
}

export async function deleteClientAction(id: string) {
  await requireAdmin();
  const sb = createAdminClient();
  const { error } = await sb.from("clients").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function inviteClientUserAction(formData: FormData) {
  await requireAdmin();
  const client_id = formData.get("client_id") as string;
  const email = formData.get("email") as string;
  const role = (formData.get("role") as never) ?? "client_admin";

  if (!client_id || !email) {
    return { ok: false, error: "Campos obrigatórios faltando" };
  }

  const sb = createAdminClient();

  // Manda magic link convidando
  const { data: invite, error: inviteErr } = await sb.auth.admin.inviteUserByEmail(email, {
    data: { invited_to_client: client_id },
  });

  if (inviteErr) return { ok: false, error: inviteErr.message };
  if (!invite.user) return { ok: false, error: "Falha ao criar usuário" };

  // Vincula
  await sb.from("client_users").insert({
    client_id,
    user_id: invite.user.id,
    role,
  });

  // Atualiza profile.role se cliente_admin/viewer
  await sb.from("profiles").update({ role }).eq("id", invite.user.id);

  revalidatePath(`/admin/clients/${client_id}`);
  return { ok: true };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
