import type { Metadata } from "next";
import { Wallet, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { MetricCard } from "@/components/glass/metric-card";
import { AreaChart } from "@/components/charts/area-chart";
import { formatBRL } from "@base-trafego/shared/utils";
import { demoCampaignBreakdown, demoChartData, demoPerformanceJB } from "@/lib/demo/mock-data";

export const metadata: Metadata = { title: "Demo · Investimento" };

export default function DemoInvestimento() {
  const max = Math.max(...demoCampaignBreakdown.map((c) => c.spend));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-label mb-1">Financeiro · demo</p>
        <h1 className="text-h1">Investimento</h1>
        <p className="text-body text-text-secondary mt-1">
          Onde seu dinheiro está sendo aplicado — últimos 30 dias.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Investido (30d)"
          value={formatBRL(demoPerformanceJB.spend * 4.2)}
          icon={Wallet}
        />
        <MetricCard
          label="Retorno (30d)"
          value={formatBRL(demoPerformanceJB.conversion_value * 4.2)}
          icon={TrendingUp}
        />
        <MetricCard label="ROAS médio" value={`${demoPerformanceJB.roas.toFixed(2)}x`} />
        <MetricCard label="Limite mensal" value={formatBRL(15000)} />
      </div>

      <GlassCard className="p-6">
        <h2 className="text-h3 mb-4">Curva de investimento (7d demo)</h2>
        <AreaChart
          data={demoChartData}
          format="brl0"
          series={[
            { key: "spend", label: "Investido", color: "#FF4D00" },
            { key: "revenue", label: "Retorno", color: "#4ADE80" },
          ]}
        />
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-h3 mb-4">Por campanha</h2>
        <div className="space-y-3">
          {demoCampaignBreakdown.map((c) => {
            const pct = (c.spend / max) * 100;
            return (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-body-sm font-medium truncate">{c.name}</span>
                  <span className="text-body-sm font-mono text-text-secondary">
                    {formatBRL(c.spend)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-glass-light overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: "linear-gradient(to right, #FF4D00, #ff7a40)",
                    }}
                  />
                </div>
                <div className="text-[11px] font-mono text-text-tertiary mt-1">
                  ROAS {(c.revenue / c.spend).toFixed(2)}x · Retorno{" "}
                  {formatBRL(c.revenue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
