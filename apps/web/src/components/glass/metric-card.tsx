import { ArrowUp, ArrowDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";

export interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: { value: number; period: string } | null;
  icon?: LucideIcon;
  loading?: boolean;
  hint?: string;
  invertDelta?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  loading,
  hint,
  invertDelta,
  className,
}: MetricCardProps) {
  const positive = delta && delta.value > 0;
  const negative = delta && delta.value < 0;
  const isGood = invertDelta ? negative : positive;
  const isBad = invertDelta ? positive : negative;

  return (
    <GlassCard hoverable className={cn("p-6 group", className)}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-label">{label}</span>
        {Icon && (
          <Icon
            className="w-4 h-4 text-text-tertiary group-hover:text-brand-500 transition-colors"
            strokeWidth={1.75}
          />
        )}
      </div>

      <div className="text-metric-md mb-2 text-text-primary">
        {loading ? <span className="skeleton inline-block h-10 w-24 rounded-md" /> : value}
      </div>

      {hint && !delta && (
        <p className="text-body-sm text-text-tertiary">{hint}</p>
      )}

      {delta && !loading && (
        <div
          className={cn(
            "text-body-sm font-mono inline-flex items-center gap-1",
            isGood && "text-success-text",
            isBad && "text-danger-text",
            !isGood && !isBad && "text-text-tertiary",
          )}
        >
          {positive ? (
            <ArrowUp size={12} strokeWidth={2.25} />
          ) : negative ? (
            <ArrowDown size={12} strokeWidth={2.25} />
          ) : (
            <Minus size={12} strokeWidth={2.25} />
          )}
          <span>{Math.abs(delta.value).toFixed(1)}%</span>
          <span className="text-text-tertiary ml-1">{delta.period}</span>
        </div>
      )}
    </GlassCard>
  );
}
