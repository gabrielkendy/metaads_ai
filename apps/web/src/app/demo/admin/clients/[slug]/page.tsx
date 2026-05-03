import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Megaphone, Users, Bot, Wallet, TrendingUp, Activity } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";
import { MetricCard } from "@/components/glass/metric-card";
import { AreaChart } from "@/components/charts/area-chart";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { demoClients, demoChartData, demoClaudeActions } from "@/lib/demo/mock-data";
import { getCampaignsBySlug } from "@/lib/demo/campaigns";
import { formatBRL, formatNumber, formatRelative } from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Demo · Detalhes do cliente" };

export default async function DemoClientDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = demoClients.find((c) => c.slug === slug);
  if (!client) notFound();

  const campaigns = getCampaignsBySlug(slug);
  const active = campaigns.filter((c) => c.status === "active");
  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + c.metrics.spend,
      revenue: acc.revenue + c.metrics.conversion_value,
      conversions: acc.conversions + c.metrics.conversions,
      ads: acc.ads + c.ad_sets.reduce((s, a) => s + a.ads.length, 0),
    }),
    { spend: 0, revenue: 0, conversions: 0, ads: 0 },
  );
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const recentActions = demoClaudeActions
    .filter((a) => a.client?.name === client.name)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/demo/admin/clients"
          className="inline-flex items-center gap-1.5 text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        {slug === "just-burn" && (
          <Link href={`/demo/cliente/${client.slug}`} target="_blank">
            <GlassButton variant="glass" size="sm">
              <ExternalLink className="w-4 h-4" />
              Ver dashboard cliente
            </GlassButton>
          </Link>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-bold text-lg shrink-0"
          style={{
            background: `linear-gradient(135deg, ${client.brand_primary_color}40, ${client.brand_primary_color}10)`,
            color: client.brand_primary_color,
            border: `1px solid ${client.brand_primary_color}40`,
          }}
        >
          {client.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label mb-1">/{client.slug}</p>
          <h1 className="text-h1 truncate">{client.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusPill
              variant={
                client.status === "active"
                  ? "active"
                  : client.status === "onboarding"
                    ? "info"
                    : "neutral"
              }
            >
              {client.status}
            </StatusPill>
            <StatusPill variant="info">{client.plan.toUpperCase()}</StatusPill>
            {client.industry && <StatusPill variant="neutral">{client.industry}</StatusPill>}
            {client.cnpj && (
              <span className="text-[11px] font-mono text-text-tertiary">{client.cnpj}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Investido (mês)"
          value={formatBRL(totals.spend, { maximumFractionDigits: 0 })}
          icon={Wallet}
        />
        <MetricCard
          label="ROAS médio"
          value={roas > 0 ? `${roas.toFixed(2)}x` : "—"}
          icon={TrendingUp}
        />
        <MetricCard
          label="Campanhas ativas"
          value={formatNumber(active.length)}
          icon={Megaphone}
          hint={`${formatNumber(totals.ads)} criativos rodando`}
        />
        <MetricCard
          label="Conversões"
          value={formatNumber(totals.conversions)}
          icon={Users}
        />
      </div>

      <GlassCard className="p-6">
        <h2 className="text-h4 mb-4">Performance · últimos 7 dias</h2>
        <AreaChart
          data={demoChartData}
          format="brl0"
          series={[
            { key: "spend", label: "Investido", color: client.brand_primary_color },
            { key: "revenue", label: "Retorno", color: "#4ADE80" },
          ]}
        />
      </GlassCard>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-brand-500" />
            <h2 className="text-h3">Campanhas</h2>
            <StatusPill variant="info">{campaigns.length} total</StatusPill>
          </div>
        </div>
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                href={
                  slug === "just-burn"
                    ? `/demo/cliente/just-burn/campanhas/${c.id}`
                    : `/demo/admin/clients/${slug}`
                }
              />
            ))}
          </div>
        ) : (
          <GlassCard className="p-10 text-center">
            <p className="text-body-sm text-text-secondary">
              Nenhuma campanha cadastrada ainda. Use Claude Desktop pra criar a primeira.
            </p>
          </GlassCard>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-brand-500" />
          <h2 className="text-h3">Últimas ações Claude</h2>
        </div>
        <GlassCard className="p-4">
          {recentActions.length > 0 ? (
            <ul className="space-y-2">
              {recentActions.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-glass-light transition-colors"
                >
                  <Bot className="w-4 h-4 text-brand-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm font-mono text-text-primary truncate">
                      {a.tool_name}
                    </div>
                    <div className="text-[11px] text-text-tertiary truncate">{a.reasoning}</div>
                  </div>
                  <StatusPill variant={a.status === "success" ? "active" : "rejected"}>
                    {a.status}
                  </StatusPill>
                  <span className="text-[11px] font-mono text-text-tertiary shrink-0">
                    {formatRelative(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-body-sm text-text-tertiary py-6">
              Nenhuma ação Claude registrada pra esse cliente.
            </p>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
