import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, type UserRole } from "@base-trafego/shared/constants";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return profile;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || !ADMIN_ROLES.includes(profile.role as UserRole)) {
    redirect("/login");
  }
  return profile;
}

export async function requireClientAccess(clientSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Admin tem acesso a todos
  if (profile && ADMIN_ROLES.includes(profile.role as UserRole)) {
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("slug", clientSlug)
      .single();
    if (!client) redirect("/admin/clients");
    const { data: fullProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return { user, profile: fullProfile, client };
  }

  // Verifica se user tem vinculo com o client
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", clientSlug)
    .single();
  if (!client) redirect("/auth/error?reason=client_not_found");

  const { data: link } = await supabase
    .from("client_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("client_id", client.id)
    .single();

  if (!link) redirect("/auth/error?reason=no_client_access");

  const { data: fullProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile: fullProfile, client, clientRole: link.role };
}

export function isAdmin(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole);
}
