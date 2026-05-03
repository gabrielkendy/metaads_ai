"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  redirect_to: z.string().optional(),
});

export async function loginWithMagicLink(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    redirect_to: formData.get("redirect_to") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Validação falhou",
    };
  }

  const supabase = await createClient();
  const redirectPath = parsed.data.redirect_to || "/admin";
  const emailRedirectTo = `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?redirect_to=${encodeURIComponent(redirectPath)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    message: "Link mágico enviado. Verifique seu email.",
  };
}

export async function loginWithGoogle(redirectTo?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?redirect_to=${encodeURIComponent(redirectTo ?? "/admin")}`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (data.url) redirect(data.url);
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
