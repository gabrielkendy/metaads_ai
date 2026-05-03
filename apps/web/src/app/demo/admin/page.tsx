import type { Metadata } from "next";
import {
  Users,
  Wallet,
  Bot,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/glass/metric-card";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { AreaChart } from "@/components/charts/area-chart";
import { formatBRL, formatNumber, formatRelative } from "@base-trafego/shared/utils";
import {
  demoOverview,
  demoAlerts,
  demoApprovals,
  demoClaudeActions,
  demoChartData,
} from "@/lib/demo/mock-data";

export const metadata: Metadata = { title: "Demo · Visão Geral" };

export default function DemoAdminHome() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-label mb-1">Visão geral · demo</p>
        <h1 className="text-h1">Bom dia, Kendy 👋</h1>
        <p className="text-body text-text-secondary mt-1">
          Aqui está o resumo das suas operações em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Clientes ativos"
          value={formatNumber(demoOverview.active_clients)}
          icon={Users}
          delta={{ value: 8.3, period: "vs semana anterior" }}
        />
        <MetricCard
          label="Investido hoje"
          value={formatBRL(demoOverview.total_spend_today)}
          icon={Wallet}
          delta={{ value: 12.4, period: "vs ontem" }}
        />
        <MetricCard
          label="Ações Claude (24h)"
          value={formatNumber(demoOverview.claude_actions_today)}
          icon={Bot}
          delta={{ value: 24.1, period: "vs ontem" }}
        />
        <MetricCard
          label="ROAS médio (7d)"
          value={`${demoOverview.avg_roas.toFixed(2)}x`}
          icon={TrendingUp}
          delta={{ value: 6.2, period: "vs semana" }}
        />
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-h3">Investimento vs Retorno (7d)</h2>
            <p className="text-body-sm text-text-secondary">
              Consolidado de todos os clientes
            </p>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-6">
            <div>
              <p className="text-label">Investido (7d)</p>
              <p className="text-metric-sm">{formatBRL(demoOverview.total_spend_7d)}</p>
            </div>
            <div>
              <p className="text-label">Retorno (7d)</p>
              <p className="text-metric-sm">
                {formatBRL(demoOverview.total_spend_7d * demoOverview.avg_roas)}
              </p>
            </div>
          </div>
        </div>
        <AreaChart
          data={demoChartData}
          format="brl0"
          series={[
            { key: "spend", label: "Investido", color: "#3D5AFE" },
            { key: "revenue", label: "Retorno", color: "#4ADE80" },
          ]}
        />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-text" />
              <h2 className="text-h4">Alertas</h2>
              <StatusPill variant="error" pulse>
                {demoAlerts.length}
              </StatusPill>
            </div>
            <Link
              href="/demo/admin/clients"
              className="text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
            >
              Ver tudo →
            </Link>
          </div>
          <ul className="space-y-2">
            {demoAlerts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-glass-light transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-body-sm font-medium truncate">{a.title}</div>
                  <div className="text-[11px] font-mono text-text-tertiary truncate">
                    {a.client.name} · {formatRelative(a.created_at)}
                  </div>
                </div>
                <StatusPill
                  variant={
                    a.severity === "warning" ? "pending" : a.severity === "info" ? "info" : "error"
                  }
                >
                  {a.severity}
                </StatusPill>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-info-text" />
              <h2 className="text-h4">Aprovações pendentes</h2>
              <StatusPill variant="pending">{demoApprovals.length}</StatusPill>
            </div>
            <Link
              href="/demo/admin/approvals"
              className="text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
            >
              Ver tudo →
            </Link>
          </div>
          <ul className="space-y-2">
            {demoApprovals.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-glass-light transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-body-sm font-medium truncate">{a.title}</div>
                  <div className="text-[11px] font-mono text-text-tertiary truncate">
                    {a.client.name} · {formatRelative(a.created_at)}
                  </div>
                </div>
                <StatusPill variant="pending">{a.type.replace(/_/g, " ")}</StatusPill>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-4 h-4 text-brand-500" />
          <h2 className="text-h4">Últimas ações Claude</h2>
          <StatusPill variant="info" pulse>
            ao vivo
          </StatusPill>
        </div>
        <ul className="space-y-1">
          {demoClaudeActions.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-glass-light transition-colors"
            >
              <span className="shrink-0">
                {it.status === "success" && (
                  <CheckCircle2 className="w-4 h-4 text-success-text" strokeWidth={1.75} />
                )}
                {it.status === "failed" && <XCircle className="w-4 h-4 text-danger-text" />}
                {it.status === "pending" && (
                  <Clock className="w-4 h-4 text-warning-text" strokeWidth={1.75} />
                )}
                {it.status === "in_progress" && (
                  <Loader2 className="w-4 h-4 text-info-text animate-spin" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-mono text-text-primary truncate">
                  {it.tool_name}
                  {it.client?.name && (
                    <span className="text-text-tertiary"> · {it.client.name}</span>
                  )}
                </div>
                <div className="text-[11px] text-text-tertiary truncate">{it.reasoning}</div>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary shrink-0">
                {formatRelative(it.created_at)}
              </span>
              <StatusPill variant="neutral">{(it.duration_ms / 1000).toFixed(1)}s</StatusPill>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
