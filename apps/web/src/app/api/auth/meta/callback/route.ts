import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/helpers";
import {
  encryptToken,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  listAdAccounts,
} from "@/lib/meta/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorMsg = url.searchParams.get("error_description");

  const cookieStore = await cookies();
  const stored = cookieStore.get("meta_oauth_state")?.value;
  cookieStore.delete("meta_oauth_state");

  if (errorMsg) {
    return NextResponse.redirect(
      `${publicEnv.NEXT_PUBLIC_APP_URL}/admin/clients?meta_error=${encodeURIComponent(errorMsg)}`,
    );
  }
  if (!code || !state || !stored || !stored.startsWith(`${state}|`)) {
    return NextResponse.redirect(
      `${publicEnv.NEXT_PUBLIC_APP_URL}/admin/clients?meta_error=invalid_state`,
    );
  }

  const clientId = stored.split("|")[1];
  const redirectUri = `${publicEnv.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;

  try {
    const short = await exchangeCodeForToken({ code, redirectUri });
    const long = await exchangeForLongLivedToken(short.access_token);
    const accounts = await listAdAccounts(long.access_token);

    const sb = createAdminClient();
    for (const acc of accounts) {
      const accountId = String(acc.account_id ?? acc.id ?? "");
      if (!accountId) continue;
      const business = (acc.business as { id?: string } | null)?.id ?? "";
      const balanceRaw = Number(acc.balance ?? 0);
      const balance = balanceRaw > 0 ? balanceRaw / 100 : 0;
      await sb
        .from("meta_accounts")
        .upsert(
          {
            client_id: clientId,
            meta_business_id: business,
            meta_account_id: accountId,
            meta_account_name: (acc.name as string) ?? null,
            access_token_encrypted: encryptToken(long.access_token),
            token_expires_at: long.expires_in
              ? new Date(Date.now() + long.expires_in * 1000).toISOString()
              : null,
            scopes: ["ads_management", "ads_read", "business_management"],
            currency: (acc.currency as string) ?? "BRL",
            current_balance: balance,
            is_active: true,
            is_primary: false,
          },
          { onConflict: "client_id,meta_account_id" },
        );
    }

    // Marca primeira como primary se nenhuma estiver marcada
    const { data: existing } = await sb
      .from("meta_accounts")
      .select("id, is_primary")
      .eq("client_id", clientId);
    if (existing && !existing.some((e) => e.is_primary)) {
      await sb
        .from("meta_accounts")
        .update({ is_primary: true })
        .eq("id", existing[0].id);
    }

    // Marca onboarding como concluído (parcialmente)
    await sb
      .from("clients")
      .update({ onboarding_step: 2, status: "active" })
      .eq("id", clientId);

    return NextResponse.redirect(
      `${publicEnv.NEXT_PUBLIC_APP_URL}/admin/clients/${clientId}?meta_connected=1`,
    );
  } catch (e) {
    return NextResponse.redirect(
      `${publicEnv.NEXT_PUBLIC_APP_URL}/admin/clients/${clientId}?meta_error=${encodeURIComponent(
        (e as Error).message,
      )}`,
    );
  }
}
