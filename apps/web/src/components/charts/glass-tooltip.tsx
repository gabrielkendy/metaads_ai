"use client";

import type { TooltipProps } from "recharts";

export function GlassTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated/95 backdrop-blur-xl px-3 py-2 shadow-2xl">
      {label && (
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary mb-1">
          {label}
        </div>
      )}
      {payload.map((p, i) => (
        <div
          key={`${p.dataKey}-${i}`}
          className="flex items-center justify-between gap-3 text-body-sm"
        >
          <span className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: p.color ?? "#3D5AFE" }}
            />
            <span className="text-text-secondary">{p.name}</span>
          </span>
          <span className="font-mono tabular-nums text-text-primary font-medium">
            {typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
