import type { Metadata } from "next";
import { Wallet, Eye, MousePointer2, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { MetricCard } from "@/components/glass/metric-card";
import { ClientHomeChart } from "@/components/cliente/home-chart";
import { TopCreatives } from "@/components/cliente/top-creatives";
import { LiveActivity } from "@/components/cliente/live-activity";
import { createClient } from "@/lib/supabase/server";
import { requireClientAccess } from "@/lib/auth/helpers";
import { formatBRL, formatCompact, formatNumber } from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Visão Geral" };
export const dynamic = "force-dynamic";

export default async function ClientHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireClientAccess(slug);
  const supabase = await createClient();

  const today = new Date();
  const startToday = new Date(today);
  startToday.setHours(0, 0, 0, 0);
  const start7d = new Date();
  start7d.setDate(start7d.getDate() - 7);

  const [{ data: today_perf }, { data: week_perf }] = await Promise.all([
    supabase.rpc("client_performance_summary", {
      p_client_id: ctx.client.id,
      p_start: startToday.toISOString(),
      p_end: today.toISOString(),
    }),
    supabase.rpc("client_performance_summary", {
      p_client_id: ctx.client.id,
      p_start: start7d.toISOString(),
      p_end: today.toISOString(),
    }),
  ]);

  const t = today_perf?.[0];
  const w = week_perf?.[0];

  const { data: snapshots } = await supabase
    .from("performance_snapshots")
    .select("period_start, spend, conversion_value")
    .eq("client_id", ctx.client.id)
    .eq("granularity", "day")
    .gte("period_start", start7d.toISOString())
    .order("period_start", { ascending: true });

  const chartData =
    snapshots?.reduce((acc: Record<string, { date: string; spend: number; revenue: number }>, s) => {
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
        <p className="text-label mb-1">Olá, {ctx.client.name}</p>
        <h1 className="text-h1">Seu desempenho hoje</h1>
        <p className="text-body text-text-secondary mt-1">
          Atualizando em tempo real conforme suas campanhas rodam.
        </p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Investido hoje"
          value={formatBRL(t?.spend ?? 0)}
          icon={Wallet}
        />
        <MetricCard
          label="Impressões"
          value={formatCompact(t?.impressions ?? 0)}
          icon={Eye}
        />
        <MetricCard
          label="Cliques"
          value={formatNumber(t?.clicks ?? 0)}
          icon={MousePointer2}
        />
        <MetricCard
          label="ROAS hoje"
          value={`${(t?.roas ?? 0).toFixed(2)}x`}
          icon={TrendingUp}
        />
      </div>

      {/* Chart 7d */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-h3">Últimos 7 dias</h2>
            <p className="text-body-sm text-text-secondary">
              Investimento vs retorno por dia
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 hidden md:grid">
            <div>
              <p className="text-label">Investido</p>
              <p className="text-metric-sm">{formatBRL(w?.spend ?? 0)}</p>
            </div>
            <div>
              <p className="text-label">Retorno</p>
              <p className="text-metric-sm">
                {formatBRL(w?.conversion_value ?? 0)}
              </p>
            </div>
          </div>
        </div>
        <ClientHomeChart data={Object.values(chartData)} />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopCreatives clientId={ctx.client.id} />
        <LiveActivity clientId={ctx.client.id} />
      </div>
    </div>
  );
}
