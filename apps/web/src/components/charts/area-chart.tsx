"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassTooltip } from "./glass-tooltip";

export interface AreaChartPoint {
  date: string;
  [key: string]: string | number;
}

export interface AreaSeries {
  key: string;
  label: string;
  color?: string;
}

export type FormatterKind = "brl" | "brl0" | "number" | "compact";

const FORMATTERS: Record<FormatterKind, (n: number) => string> = {
  brl: (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(n || 0),
  brl0: (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n || 0),
  number: (n: number) => new Intl.NumberFormat("pt-BR").format(n || 0),
  compact: (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n || 0),
};

export function AreaChart({
  data,
  series,
  height = 300,
  format = "brl0",
}: {
  data: AreaChartPoint[];
  series: AreaSeries[];
  height?: number;
  format?: FormatterKind;
}) {
  const formatter = FORMATTERS[format];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient
              key={s.key}
              id={`grad-${s.key}-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={s.color ?? "#3D5AFE"}
                stopOpacity={0.4}
              />
              <stop
                offset="100%"
                stopColor={s.color ?? "#3D5AFE"}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="0"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          stroke="#52525B"
          fontSize={11}
          fontFamily="var(--font-geist-mono), monospace"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#52525B"
          fontSize={11}
          fontFamily="var(--font-geist-mono), monospace"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatter}
          width={50}
        />
        <Tooltip content={<GlassTooltip />} />
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? "#3D5AFE"}
            strokeWidth={2}
            fill={`url(#grad-${s.key}-${i})`}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
