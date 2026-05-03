import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/meta/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const META_API_BASE = (v = "v22.0") => `https://graph.facebook.com/${v}`;

function isAuthorized(request: Request) {
  const env = getServerEnv();
  if (!env.CRON_SECRET) return true; // permite em dev
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const env = getServerEnv();
  const sb = createAdminClient();

  // Pega contas Meta ativas
  const { data: accounts } = await sb
    .from("meta_accounts")
    .select("id, client_id, meta_account_id, access_token_encrypted")
    .eq("is_active", true);

  if (!accounts?.length) {
    return NextResponse.json({ synced: 0, message: "Nenhuma conta Meta ativa" });
  }

  const results: Array<{ account_id: string; ok: boolean; error?: string }> = [];

  for (const acc of accounts) {
    try {
      let token: string;
      try {
        token = decryptToken(acc.access_token_encrypted);
      } catch {
        // Token não decriptografável (modo dev sem encryption key consistente)
        results.push({ account_id: acc.id, ok: false, error: "decrypt_failed" });
        continue;
      }

      const insightsUrl = new URL(
        `${META_API_BASE(env.META_API_VERSION)}/act_${acc.meta_account_id}/insights`,
      );
      insightsUrl.searchParams.set("access_token", token);
      insightsUrl.searchParams.set("date_preset", "today");
      insightsUrl.searchParams.set(
        "fields",
        "impressions,reach,clicks,spend,ctr,cpc,cpm,frequency,actions,action_values",
      );
      insightsUrl.searchParams.set("level", "campaign");
      insightsUrl.searchParams.set("limit", "100");

      const res = await fetch(insightsUrl, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        results.push({ account_id: acc.id, ok: false, error: `HTTP ${res.status}` });
        continue;
      }

      const json = (await res.json()) as { data: Array<Record<string, string>> };

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      // Persiste rollup do dia (granularidade day) — última versão sobrescreve
      for (const row of json.data ?? []) {
        await sb.from("performance_snapshots").insert({
          client_id: acc.client_id,
          period_start: startOfDay.toISOString(),
          period_end: now.toISOString(),
          granularity: "day",
          impressions: Number(row.impressions ?? 0),
          reach: Number(row.reach ?? 0),
          clicks: Number(row.clicks ?? 0),
          spend: Number(row.spend ?? 0),
          conversions: Number(
            (row as { actions?: Array<{ action_type: string; value: string }> }).actions?.find(
              (a) => a.action_type === "purchase",
            )?.value ?? 0,
          ),
          conversion_value: Number(
            (row as { action_values?: Array<{ action_type: string; value: string }> }).action_values?.find(
              (a) => a.action_type === "purchase",
            )?.value ?? 0,
          ),
          ctr: row.ctr ? Number(row.ctr) : null,
          cpc: row.cpc ? Number(row.cpc) : null,
          cpm: row.cpm ? Number(row.cpm) : null,
          frequency: row.frequency ? Number(row.frequency) : null,
          raw_data: row as never,
        });
      }

      await sb
        .from("meta_accounts")
        .update({ last_synced_at: now.toISOString(), sync_error: null })
        .eq("id", acc.id);

      results.push({ account_id: acc.id, ok: true });
    } catch (e) {
      const message = (e as Error).message;
      await sb
        .from("meta_accounts")
        .update({ sync_error: message })
        .eq("id", acc.id);
      results.push({ account_id: acc.id, ok: false, error: message });
    }
  }

  await sb.from("audit_logs").insert({
    actor_type: "cron",
    action: "meta.sync_run",
    resource_type: "system",
    metadata: { results } as never,
  });

  return NextResponse.json({ synced: results.length, results });
}
