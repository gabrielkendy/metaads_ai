import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { MetricCard } from "@/components/glass/metric-card";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { getCampaignsBySlug } from "@/lib/demo/campaigns";
import { formatBRL, formatNumber, formatPercent } from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Demo · Campanhas" };

export default function DemoCampanhas() {
  const campaigns = getCampaignsBySlug("just-burn");
  const active = campaigns.filter((c) => c.status === "active");
  const paused = campaigns.filter((c) => c.status === "paused" || c.status === "completed");
  const drafts = campaigns.filter((c) => c.status === "draft" || c.status === "pending_approval");

  const totals = active.reduce(
    (acc, c) => ({
      spend: acc.spend + c.metrics.spend,
      revenue: acc.revenue + c.metrics.conversion_value,
      conversions: acc.conversions + c.metrics.conversions,
      impressions: acc.impressions + c.metrics.impressions,
      clicks: acc.clicks + c.metrics.clicks,
    }),
    { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 },
  );
  const avgRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-label mb-1">Operação · demo</p>
        <h1 className="text-h1">Suas campanhas</h1>
        <p className="text-body text-text-secondary mt-1">
          Visão completa de cada campanha rodando na sua conta — texto, criativo, ROAS e
          performance individual.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard label="Investido total" value={formatBRL(totals.spend)} />
        <MetricCard label="Retorno total" value={formatBRL(totals.revenue)} />
        <MetricCard label="ROAS médio" value={`${avgRoas.toFixed(2)}x`} />
        <MetricCard label="Conversões" value={formatNumber(totals.conversions)} />
      </div>

      {active.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-success-text rounded-full" />
            <h2 className="text-h3">Em andamento</h2>
            <span className="text-body-sm text-text-tertiary">{active.length}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {active.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                href={`/demo/cliente/just-burn/campanhas/${c.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {drafts.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-warning-text rounded-full" />
            <h2 className="text-h3">Aguardando início</h2>
            <span className="text-body-sm text-text-tertiary">{drafts.length}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {drafts.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                href={`/demo/cliente/just-burn/campanhas/${c.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {paused.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-text-muted rounded-full" />
            <h2 className="text-h3">Pausadas / encerradas</h2>
            <span className="text-body-sm text-text-tertiary">{paused.length}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {paused.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                href={`/demo/cliente/just-burn/campanhas/${c.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {campaigns.length === 0 && (
        <GlassCard className="p-10 text-center">
          <Megaphone className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <h3 className="text-h4 mb-1">Sem campanhas ainda</h3>
          <p className="text-body-sm text-text-secondary">
            Quando a Agência BASE lançar suas primeiras campanhas, elas aparecem aqui.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
