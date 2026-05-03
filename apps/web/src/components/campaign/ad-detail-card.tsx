import { ImageIcon, Eye, MousePointer2, Wallet, Target, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { formatBRL, formatCompact, formatPercent } from "@base-trafego/shared/utils";
import type { DemoAd } from "@/lib/demo/campaigns";

export function AdDetailCard({ ad }: { ad: DemoAd }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col md:flex-row gap-0">
        <div className="relative md:w-72 aspect-square md:aspect-auto md:h-auto bg-bg-elevated shrink-0">
          {ad.image_url ? (
            // biome-ignore lint/a11y/useAltText: creative
            <img src={ad.image_url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-text-tertiary" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <StatusPill
              variant={
                ad.status === "active"
                  ? "active"
                  : ad.status === "pending_approval"
                    ? "pending"
                    : ad.status === "paused"
                      ? "paused"
                      : ad.status === "rejected"
                        ? "rejected"
                        : "neutral"
              }
            >
              {ad.status.replace(/_/g, " ")}
            </StatusPill>
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-4">
          <div>
            <p className="text-label mb-1">{ad.name}</p>
            <h3 className="text-h4 mb-2">{ad.headline}</h3>
            <p className="text-body-sm text-text-secondary leading-relaxed">{ad.body}</p>
            <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-text-tertiary flex-wrap">
              <StatusPill variant="info">CTA: {ad.cta_type.replace(/_/g, " ")}</StatusPill>
              <a
                href={ad.link_url}
                target="_blank"
                rel="noopener"
                className="hover:text-text-primary truncate max-w-xs"
              >
                {ad.link_url}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-3 border-t border-border-subtle">
            <Stat icon={Wallet} label="Investido" value={formatBRL(ad.metrics.spend, { maximumFractionDigits: 0 })} />
            <Stat
              icon={TrendingUp}
              label="ROAS"
              value={ad.metrics.roas > 0 ? `${ad.metrics.roas.toFixed(2)}x` : "—"}
              tone={ad.metrics.roas >= 3 ? "good" : ad.metrics.roas >= 1.5 ? "warn" : "bad"}
            />
            <Stat icon={Target} label="Conv." value={ad.metrics.conversions.toString()} />
            <Stat icon={Eye} label="Impr." value={formatCompact(ad.metrics.impressions)} />
            <Stat
              icon={MousePointer2}
              label="CTR"
              value={formatPercent(ad.metrics.ctr, { alreadyPercent: true, decimals: 2 })}
              tone={ad.metrics.ctr >= 2 ? "good" : ad.metrics.ctr >= 1 ? "warn" : "bad"}
            />
            <Stat
              icon={Eye}
              label="Freq."
              value={ad.metrics.frequency.toFixed(2)}
              tone={ad.metrics.frequency < 3 ? "good" : ad.metrics.frequency < 5 ? "warn" : "bad"}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1 flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
      <div
        className={`text-body-sm font-mono tabular-nums ${
          tone === "good"
            ? "text-success-text"
            : tone === "warn"
              ? "text-warning-text"
              : tone === "bad"
                ? "text-danger-text"
                : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
