import Link from "next/link";
import { ArrowUpRight, Bot, Eye, MousePointer2, Target, TrendingUp, Wallet } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill, type StatusVariant } from "@/components/glass/status-pill";
import { formatBRL, formatCompact, formatPercent } from "@base-trafego/shared/utils";
import type { DemoCampaign } from "@/lib/demo/campaigns";

const STATUS_VARIANT: Record<DemoCampaign["status"], StatusVariant> = {
  active: "active",
  paused: "paused",
  draft: "neutral",
  pending_approval: "pending",
  completed: "info",
};

const OBJECTIVE_LABEL: Record<string, string> = {
  OUTCOME_SALES: "Vendas",
  OUTCOME_LEADS: "Leads",
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_ENGAGEMENT: "Engajamento",
};

export function CampaignCard({
  campaign,
  href,
}: {
  campaign: DemoCampaign;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <GlassCard hoverable className="p-5 h-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusPill variant={STATUS_VARIANT[campaign.status]}>
                {campaign.status.replace(/_/g, " ")}
              </StatusPill>
              <StatusPill variant="info">{OBJECTIVE_LABEL[campaign.objective] ?? campaign.objective}</StatusPill>
              {campaign.created_by_claude && (
                <StatusPill variant="neutral">
                  <Bot className="w-3 h-3" />
                  Claude
                </StatusPill>
              )}
            </div>
            <h3 className="text-body font-semibold truncate">{campaign.name}</h3>
            {campaign.notes && (
              <p className="text-[11px] text-text-tertiary mt-1 line-clamp-1">{campaign.notes}</p>
            )}
          </div>
          <ArrowUpRight className="w-4 h-4 text-text-tertiary shrink-0" />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border-subtle">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
              <Wallet className="w-2.5 h-2.5" /> Investido
            </div>
            <div className="text-body-sm font-mono tabular-nums">
              {formatBRL(campaign.metrics.spend, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> ROAS
            </div>
            <div
              className={`text-body-sm font-mono tabular-nums ${
                campaign.metrics.roas >= 3
                  ? "text-success-text"
                  : campaign.metrics.roas >= 1.5
                    ? "text-warning-text"
                    : campaign.metrics.roas > 0
                      ? "text-danger-text"
                      : "text-text-tertiary"
              }`}
            >
              {campaign.metrics.roas > 0 ? `${campaign.metrics.roas.toFixed(2)}x` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
              <Target className="w-2.5 h-2.5" /> Conversões
            </div>
            <div className="text-body-sm font-mono tabular-nums">{campaign.metrics.conversions}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" /> Impressões
            </div>
            <div className="text-body-sm font-mono tabular-nums">
              {formatCompact(campaign.metrics.impressions)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
              <MousePointer2 className="w-2.5 h-2.5" /> CTR
            </div>
            <div className="text-body-sm font-mono tabular-nums">
              {formatPercent(campaign.metrics.ctr, { alreadyPercent: true, decimals: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1">
              CPA
            </div>
            <div className="text-body-sm font-mono tabular-nums">
              {campaign.metrics.cpa > 0
                ? formatBRL(campaign.metrics.cpa, { maximumFractionDigits: 2 })
                : "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-tertiary">
          <span>Daily {formatBRL(campaign.daily_budget, { maximumFractionDigits: 0 })}</span>
          <span>
            {campaign.ad_sets.length} ad set{campaign.ad_sets.length !== 1 ? "s" : ""} ·{" "}
            {campaign.ad_sets.reduce((acc, a) => acc + a.ads.length, 0)} ads
          </span>
        </div>
      </GlassCard>
    </Link>
  );
}
