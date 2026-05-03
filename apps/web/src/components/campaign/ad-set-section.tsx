import { ChevronRight, Eye, MapPin, MousePointer2, Sliders, Target, TrendingUp, Users, Wallet } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { AdDetailCard } from "./ad-detail-card";
import { formatBRL, formatCompact, formatPercent } from "@base-trafego/shared/utils";
import type { DemoAdSet } from "@/lib/demo/campaigns";

export function AdSetSection({ adSet }: { adSet: DemoAdSet }) {
  return (
    <section className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-label mb-1 flex items-center gap-1">
              <Sliders className="w-3 h-3" /> Ad Set
            </p>
            <h2 className="text-h4">{adSet.name}</h2>
          </div>
          <StatusPill variant={adSet.status === "active" ? "active" : "paused"}>
            {adSet.status}
          </StatusPill>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="px-3 py-2.5 rounded-xl bg-glass-light border border-border-subtle">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1">
              Otimização
            </div>
            <div className="text-body-sm font-medium">
              {adSet.optimization_goal.replace(/_/g, " ")}
            </div>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-glass-light border border-border-subtle">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
              <Wallet className="w-2.5 h-2.5" /> Daily budget
            </div>
            <div className="text-body-sm font-mono">
              {formatBRL(adSet.daily_budget, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-glass-light border border-border-subtle">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
              <Wallet className="w-2.5 h-2.5" /> Total investido
            </div>
            <div className="text-body-sm font-mono">{formatBRL(adSet.metrics.spend)}</div>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-glass-light border border-border-subtle">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> ROAS
            </div>
            <div
              className={`text-body-sm font-mono ${
                adSet.metrics.roas >= 3 ? "text-success-text" : "text-text-primary"
              }`}
            >
              {adSet.metrics.roas > 0 ? `${adSet.metrics.roas.toFixed(2)}x` : "—"}
            </div>
          </div>
        </div>

        <details className="group">
          <summary className="text-body-sm text-text-tertiary hover:text-text-primary cursor-pointer flex items-center gap-1.5 select-none">
            <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
            Ver targeting completo
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
            <Field icon={Users} label="Idade · Gênero">
              {adSet.targeting.age_range} · {adSet.targeting.genders.join(", ")}
            </Field>
            <Field icon={MapPin} label="Geo">
              {adSet.targeting.geo.join(", ")}
            </Field>
            <Field icon={Target} label="Interesses">
              {adSet.targeting.interests.join(", ")}
            </Field>
            <Field icon={Eye} label="Placements">
              {adSet.targeting.placements.map((p) => p.replace(/_/g, " ")).join(", ")}
            </Field>
          </div>
        </details>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-border-subtle">
          <Mini label="Impressões" value={formatCompact(adSet.metrics.impressions)} />
          <Mini label="Cliques" value={formatCompact(adSet.metrics.clicks)} />
          <Mini
            label="CTR"
            value={formatPercent(adSet.metrics.ctr, { alreadyPercent: true, decimals: 2 })}
          />
          <Mini label="Conversões" value={adSet.metrics.conversions.toString()} />
        </div>
      </GlassCard>

      {adSet.ads.length > 0 && (
        <div className="space-y-3 pl-2 border-l-2 border-border-default ml-2">
          <p className="text-label flex items-center gap-2 ml-2">
            <span className="w-3 h-3 rounded bg-glass-medium border border-border-default" />
            {adSet.ads.length} anúncio{adSet.ads.length > 1 ? "s" : ""}
          </p>
          {adSet.ads.map((ad) => (
            <div key={ad.id} className="ml-2">
              <AdDetailCard ad={ad} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
      <div className="text-body-sm text-text-primary">{children}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1">
        {label}
      </div>
      <div className="text-body-sm font-mono tabular-nums">{value}</div>
    </div>
  );
}
