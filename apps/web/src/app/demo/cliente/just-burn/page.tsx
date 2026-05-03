import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  Eye,
  MousePointer2,
  TrendingUp,
  ImageIcon,
  Activity,
  Bot,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { MetricCard } from "@/components/glass/metric-card";
import { StatusPill } from "@/components/glass/status-pill";
import { AreaChart } from "@/components/charts/area-chart";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { formatBRL, formatCompact, formatNumber, formatRelative } from "@base-trafego/shared/utils";
import { demoChartData, demoPerformanceJB, demoClaudeActions } from "@/lib/demo/mock-data";
import { getCampaignsBySlug } from "@/lib/demo/campaigns";

export const metadata: Metadata = { title: "Demo · Just Burn Club" };

export default function DemoClienteHome() {
  const todayPerf = {
    spend: 412.36,
    impressions: 18230,
    clicks: 547,
    roas: 4.2,
  };
  const campaigns = getCampaignsBySlug("just-burn");
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const topCampaigns = [...activeCampaigns]
    .sort((a, b) => b.metrics.roas - a.metrics.roas)
    .slice(0, 2);
  const recentActions = demoClaudeActions
    .filter((a) => a.client?.name === "Just Burn Club")
    .slice(0, 5);
  const allAds = activeCampaigns.flatMap((c) => c.ad_sets.flatMap((a) => a.ads));
  const topCreatives = [...allAds].sort((a, b) => b.metrics.roas - a.metrics.roas).slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-label mb-1">Olá, Just Burn Club · demo</p>
        <h1 className="text-h1">Seu desempenho hoje</h1>
        <p className="text-body text-text-secondary mt-1">
          Atualizando em tempo real conforme suas campanhas rodam.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Investido hoje"
          value={formatBRL(todayPerf.spend)}
          icon={Wallet}
          delta={{ value: 8.4, period: "vs ontem" }}
        />
        <MetricCard
          label="Impressões"
          value={formatCompact(todayPerf.impressions)}
          icon={Eye}
          delta={{ value: 12.1, period: "vs ontem" }}
        />
        <MetricCard
          label="Cliques"
          value={formatNumber(todayPerf.clicks)}
          icon={MousePointer2}
          delta={{ value: 5.8, period: "vs ontem" }}
        />
        <MetricCard
          label="ROAS hoje"
          value={`${todayPerf.roas.toFixed(2)}x`}
          icon={TrendingUp}
          delta={{ value: 3.2, period: "vs ontem" }}
        />
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-h3">Últimos 7 dias</h2>
            <p className="text-body-sm text-text-secondary">
              Investimento vs retorno por dia
            </p>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-6">
            <div>
              <p className="text-label">Investido</p>
              <p className="text-metric-sm">{formatBRL(demoPerformanceJB.spend)}</p>
            </div>
            <div>
              <p className="text-label">Retorno</p>
              <p className="text-metric-sm">{formatBRL(demoPerformanceJB.conversion_value)}</p>
            </div>
          </div>
        </div>
        <AreaChart
          data={demoChartData}
          format="brl0"
          series={[
            { key: "spend", label: "Investido", color: "#FF4D00" },
            { key: "revenue", label: "Retorno", color: "#4ADE80" },
          ]}
        />
      </GlassCard>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-brand-500" />
            <h2 className="text-h3">Suas campanhas em destaque</h2>
            <StatusPill variant="active" pulse>
              {activeCampaigns.length} ativas
            </StatusPill>
          </div>
          <Link
            href="/demo/cliente/just-burn/campanhas"
            className="text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
          >
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {topCampaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              href={`/demo/cliente/just-burn/campanhas/${c.id}`}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <h2 className="text-h4">Top criativos</h2>
            </div>
          </div>
          <ul className="space-y-2">
            {topCreatives.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-glass-light hover:bg-glass-medium transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-glass-medium border border-border-default overflow-hidden flex items-center justify-center shrink-0">
                  {c.thumbnail_url ? (
                    // biome-ignore lint/a11y/useAltText: thumb
                    <img src={c.thumbnail_url} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-text-tertiary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium truncate">{c.name}</p>
                  {c.headline && (
                    <p className="text-[11px] text-text-tertiary truncate">{c.headline}</p>
                  )}
                </div>
                <StatusPill variant="active">{c.status}</StatusPill>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-500" />
              <h2 className="text-h4">Atividade ao vivo</h2>
              <StatusPill variant="info" pulse>
                ao vivo
              </StatusPill>
            </div>
          </div>
          <ul className="space-y-2">
            {recentActions.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-glass-light"
              >
                <Bot className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-medium">
                    {it.tool_name === "create_creative" && "Novo criativo gerado"}
                    {it.tool_name === "pause_ad" && "Anúncio pausado"}
                    {it.tool_name === "create_alert" && "Alerta criado"}
                    {it.tool_name === "get_performance" && "Análise gerada"}
                    {it.tool_name === "update_campaign" && "Campanha ajustada"}
                  </p>
                  {it.reasoning && (
                    <p className="text-[11px] text-text-tertiary truncate">{it.reasoning}</p>
                  )}
                </div>
                <span className="text-[11px] font-mono text-text-tertiary shrink-0">
                  {formatRelative(it.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
