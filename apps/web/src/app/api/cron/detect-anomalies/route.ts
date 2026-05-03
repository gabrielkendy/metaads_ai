import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITS } from "@base-trafego/shared/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const env = getServerEnv();
  if (!env.CRON_SECRET) return true;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${env.CRON_SECRET}`;
}

interface SnapshotRow {
  client_id: string;
  ad_id: string | null;
  campaign_id: string | null;
  ctr: number | null;
  cpm: number | null;
  frequency: number | null;
  spend: number;
  period_start: string;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return new Response("Unauthorized", { status: 401 });

  const sb = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

  const { data: snapshots } = await sb
    .from("performance_snapshots")
    .select("client_id, ad_id, campaign_id, ctr, cpm, frequency, spend, period_start")
    .eq("granularity", "day")
    .gte("period_start", sevenDaysAgo);

  if (!snapshots?.length) return NextResponse.json({ created_alerts: 0 });

  const byClient = (snapshots as SnapshotRow[]).reduce(
    (acc, s) => {
      acc[s.client_id] ??= [];
      acc[s.client_id].push(s);
      return acc;
    },
    {} as Record<string, SnapshotRow[]>,
  );

  const alertsCreated: string[] = [];

  for (const [clientId, rows] of Object.entries(byClient)) {
    const sortedByDate = rows.sort(
      (a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime(),
    );
    const half = Math.floor(sortedByDate.length / 2);
    const firstHalf = sortedByDate.slice(0, half);
    const secondHalf = sortedByDate.slice(half);

    const avgCTR1 = avg(firstHalf.map((r) => r.ctr ?? 0));
    const avgCTR2 = avg(secondHalf.map((r) => r.ctr ?? 0));
    const avgCPM1 = avg(firstHalf.map((r) => r.cpm ?? 0));
    const avgCPM2 = avg(secondHalf.map((r) => r.cpm ?? 0));

    if (avgCTR1 > 0 && avgCTR2 / avgCTR1 < 1 - LIMITS.ctrDropThreshold) {
      const { data } = await sb.rpc("create_alert", {
        p_client_id: clientId,
        p_type: "ctr_drop",
        p_severity: "warning",
        p_title: "CTR caiu significativamente",
        p_message: `CTR caiu ${(((avgCTR1 - avgCTR2) / avgCTR1) * 100).toFixed(1)}% comparando primeira metade vs segunda do período.`,
        p_data: { avg_ctr_first: avgCTR1, avg_ctr_recent: avgCTR2 } as never,
      });
      if (data) alertsCreated.push(data);
    }

    if (avgCPM1 > 0 && avgCPM2 / avgCPM1 > 1 + LIMITS.cpmIncreaseThreshold) {
      const { data } = await sb.rpc("create_alert", {
        p_client_id: clientId,
        p_type: "cpm_high",
        p_severity: "warning",
        p_title: "CPM acima da média histórica",
        p_message: `CPM aumentou ${(((avgCPM2 - avgCPM1) / avgCPM1) * 100).toFixed(1)}%.`,
        p_data: { avg_cpm_first: avgCPM1, avg_cpm_recent: avgCPM2 } as never,
      });
      if (data) alertsCreated.push(data);
    }

    // Fadiga
    const fatigued = rows.filter((r) => (r.frequency ?? 0) > LIMITS.fatigueFrequencyThreshold);
    if (fatigued.length) {
      const { data } = await sb.rpc("create_alert", {
        p_client_id: clientId,
        p_type: "creative_fatigue",
        p_severity: "warning",
        p_title: `${fatigued.length} criativo(s) com fadiga detectada`,
        p_message: "Frequency > 5 — sugiro pausar e criar variações.",
        p_data: { count: fatigued.length, ad_ids: fatigued.map((f) => f.ad_id) } as never,
      });
      if (data) alertsCreated.push(data);
    }
  }

  return NextResponse.json({ created_alerts: alertsCreated.length });
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}
