"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type UserRole } from "@base-trafego/shared/constants";

export async function sendMessage(clientId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) return { ok: false, error: "Profile não encontrado" };

  // Permissão
  if (!ADMIN_ROLES.includes(profile.role as UserRole)) {
    const { data: link } = await supabase
      .from("client_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("client_id", clientId)
      .single();
    if (!link) return { ok: false, error: "Sem acesso ao cliente" };
  }

  const sb = createAdminClient();
  const { error } = await sb.from("messages").insert({
    client_id: clientId,
    sender_id: user.id,
    sender_role: profile.role,
    content,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
