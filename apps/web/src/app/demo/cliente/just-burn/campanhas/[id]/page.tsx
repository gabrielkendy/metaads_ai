import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Calendar, Wallet } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { MetricCard } from "@/components/glass/metric-card";
import { StatusPill } from "@/components/glass/status-pill";
import { AreaChart } from "@/components/charts/area-chart";
import { AdSetSection } from "@/components/campaign/ad-set-section";
import { getCampaignById, getCampaignTimeseries } from "@/lib/demo/campaigns";
import {
  formatBRL,
  formatCompact,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Demo · Detalhe de campanha" };

const OBJ: Record<string, string> = {
  OUTCOME_SALES: "Vendas",
  OUTCOME_LEADS: "Leads",
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_ENGAGEMENT: "Engajamento",
};

export default async function DemoCampaignDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = getCampaignById(id);
  if (!campaign) notFound();

  const series = getCampaignTimeseries(id, 14);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/demo/cliente/just-burn/campanhas"
          className="inline-flex items-center gap-1.5 text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar pras campanhas
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <StatusPill
            variant={
              campaign.status === "active"
                ? "active"
                : campaign.status === "paused"
                  ? "paused"
                  : campaign.status === "pending_approval"
                    ? "pending"
                    : "info"
            }
          >
            {campaign.status.replace(/_/g, " ")}
          </StatusPill>
          <StatusPill variant="info">{OBJ[campaign.objective] ?? campaign.objective}</StatusPill>
          {campaign.created_by_claude && (
            <StatusPill variant="neutral">
              <Bot className="w-3 h-3" /> Criada por Claude
            </StatusPill>
          )}
        </div>
        <h1 className="text-h1 mb-2">{campaign.name}</h1>
        {campaign.notes && (
          <p className="text-body text-text-secondary max-w-3xl">{campaign.notes}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-[11px] font-mono text-text-tertiary flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Início {formatDate(campaign.start_date, "long")}
          </span>
          {campaign.end_date && (
            <span className="flex items-center gap-1">
              · Fim {formatDate(campaign.end_date, "long")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Daily{" "}
            {formatBRL(campaign.daily_budget, { maximumFractionDigits: 0 })}
          </span>
          <span>· Criada {formatRelative(campaign.created_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Investido total"
          value={formatBRL(campaign.metrics.spend)}
          hint={`${formatBRL(campaign.daily_budget)}/dia`}
        />
        <MetricCard
          label="ROAS"
          value={campaign.metrics.roas > 0 ? `${campaign.metrics.roas.toFixed(2)}x` : "—"}
          hint={`Retorno: ${formatBRL(campaign.metrics.conversion_value)}`}
        />
        <MetricCard
          label="Conversões"
          value={formatNumber(campaign.metrics.conversions)}
          hint={`CPA: ${campaign.metrics.cpa > 0 ? formatBRL(campaign.metrics.cpa) : "—"}`}
        />
        <MetricCard
          label="Impressões / Cliques"
          value={`${formatCompact(campaign.metrics.impressions)} / ${formatCompact(campaign.metrics.clicks)}`}
          hint={`CTR ${formatPercent(campaign.metrics.ctr, { alreadyPercent: true, decimals: 2 })}`}
        />
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-h3">Performance · últimos 14 dias</h2>
            <p className="text-body-sm text-text-secondary">Investimento × retorno por dia</p>
          </div>
        </div>
        <AreaChart
          data={series}
          format="brl0"
          series={[
            { key: "spend", label: "Investido", color: "#FF4D00" },
            { key: "revenue", label: "Retorno", color: "#4ADE80" },
          ]}
        />
      </GlassCard>

      {campaign.ad_sets.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-h2">
              Estrutura ({campaign.ad_sets.length} ad set
              {campaign.ad_sets.length > 1 ? "s" : ""},{" "}
              {campaign.ad_sets.reduce((acc, a) => acc + a.ads.length, 0)} anúncios)
            </h2>
            <GlassButton variant="glass" size="sm" disabled>
              Solicitar variação
            </GlassButton>
          </div>
          {campaign.ad_sets.map((adSet) => (
            <AdSetSection key={adSet.id} adSet={adSet} />
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 text-center">
          <h3 className="text-h4 mb-1">Sem ad sets ainda</h3>
          <p className="text-body-sm text-text-secondary">
            {campaign.status === "pending_approval"
              ? "Esta campanha está aguardando sua aprovação. Após aprovar, Claude monta os ad sets e criativos."
              : "Esta campanha foi pausada antes de ter ad sets ativos."}
          </p>
        </GlassCard>
      )}
    </div>
  );
}
