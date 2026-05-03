import type { Metadata } from "next";
import { Wallet, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { MetricCard } from "@/components/glass/metric-card";
import { EmptyState } from "@/components/glass/empty-state";
import { ClientHomeChart } from "@/components/cliente/home-chart";
import { createClient } from "@/lib/supabase/server";
import { requireClientAccess } from "@/lib/auth/helpers";
import { formatBRL } from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Investimento" };
export const dynamic = "force-dynamic";

export default async function InvestimentoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireClientAccess(slug);
  const supabase = await createClient();

  const start30d = new Date();
  start30d.setDate(start30d.getDate() - 30);

  const [{ data: monthly }, { data: byCampaign }] = await Promise.all([
    supabase.rpc("client_performance_summary", {
      p_client_id: ctx.client.id,
      p_start: start30d.toISOString(),
      p_end: new Date().toISOString(),
    }),
    supabase
      .from("performance_snapshots")
      .select("campaign_id, spend, conversion_value, campaign:campaigns(name)")
      .eq("client_id", ctx.client.id)
      .eq("granularity", "day")
      .gte("period_start", start30d.toISOString()),
  ]);

  const m = monthly?.[0];
  const byCampaignMap: Record<string, { name: string; spend: number; revenue: number }> = {};
  for (const row of byCampaign ?? []) {
    if (!row.campaign_id) continue;
    const k = row.campaign_id;
    if (!byCampaignMap[k]) {
      byCampaignMap[k] = {
        name: (row.campaign as never as { name: string } | null)?.name ?? "Campanha",
        spend: 0,
        revenue: 0,
      };
    }
    byCampaignMap[k].spend += row.spend ?? 0;
    byCampaignMap[k].revenue += row.conversion_value ?? 0;
  }
  const breakdown = Object.values(byCampaignMap).sort((a, b) => b.spend - a.spend);

  const { data: dailySnapshots } = await supabase
    .from("performance_snapshots")
    .select("period_start, spend, conversion_value")
    .eq("client_id", ctx.client.id)
    .eq("granularity", "day")
    .gte("period_start", start30d.toISOString())
    .order("period_start");

  const chartData =
    dailySnapshots?.reduce((acc: Record<string, { date: string; spend: number; revenue: number }>, s) => {
      const date = new Date(s.period_start).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      if (!acc[date]) acc[date] = { date, spend: 0, revenue: 0 };
      acc[date].spend += s.spend ?? 0;
      acc[date].revenue += s.conversion_value ?? 0;
      return acc;
    }, {}) ?? {};

  return (
    <div className="space-y-8">
      <div>
        <p className="text-label mb-1">Financeiro</p>
        <h1 className="text-h1">Investimento</h1>
        <p className="text-body text-text-secondary mt-1">
          Onde seu dinheiro está sendo aplicado — últimos 30 dias.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Investido (30d)"
          value={formatBRL(m?.spend ?? 0)}
          icon={Wallet}
        />
        <MetricCard
          label="Retorno (30d)"
          value={formatBRL(m?.conversion_value ?? 0)}
          icon={TrendingUp}
        />
        <MetricCard
          label="ROAS médio"
          value={`${(m?.roas ?? 0).toFixed(2)}x`}
        />
        <MetricCard
          label="Limite mensal"
          value={
            ctx.client.monthly_budget_limit
              ? formatBRL(ctx.client.monthly_budget_limit)
              : "—"
          }
        />
      </div>

      <GlassCard className="p-6">
        <h2 className="text-h3 mb-4">Curva de investimento (30d)</h2>
        <ClientHomeChart data={Object.values(chartData)} />
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-h3 mb-4">Por campanha</h2>
        {breakdown.length > 0 ? (
          <div className="space-y-3">
            {breakdown.map((c, i) => {
              const max = Math.max(...breakdown.map((x) => x.spend));
              const pct = max > 0 ? (c.spend / max) * 100 : 0;
              return (
                <div key={c.name + i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-body-sm font-medium truncate">{c.name}</span>
                    <span className="text-body-sm font-mono text-text-secondary">
                      {formatBRL(c.spend)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-glass-light overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Sem dados"
            description="Quando suas campanhas começarem a investir, o detalhamento aparece aqui."
          />
        )}
      </GlassCard>
    </div>
  );
}
