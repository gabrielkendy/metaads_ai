import type { Metadata } from "next";
import {
  Users,
  Wallet,
  Bot,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/glass/metric-card";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { EmptyState } from "@/components/glass/empty-state";
import { ClaudeFeed } from "@/components/admin/claude-feed";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/utils";
import { formatBRL, formatNumber, formatRelative } from "@base-trafego/shared/utils";
import { ROUTES } from "@base-trafego/shared/constants";

export const metadata: Metadata = { title: "Visão Geral" };
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const { data: overview } = await supabase.rpc("admin_dashboard_overview");
  const stats = overview?.[0] ?? {
    active_clients: 0,
    total_spend_today: 0,
    total_spend_7d: 0,
    total_spend_30d: 0,
    claude_actions_today: 0,
    pending_approvals: 0,
    active_alerts: 0,
    avg_roas: 0,
  };

  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, title, severity, created_at, client:clients(name, slug)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: approvals } = await supabase
    .from("approvals")
    .select("id, title, type, created_at, client:clients(name, slug)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-label mb-1">Visão geral</p>
        <h1 className="text-h1">Bom dia, Kendy 👋</h1>
        <p className="text-body text-text-secondary mt-1">
          Aqui está o resumo das suas operações em tempo real.
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Clientes ativos"
          value={formatNumber(stats.active_clients)}
          icon={Users}
        />
        <MetricCard
          label="Investido hoje"
          value={formatBRL(stats.total_spend_today)}
          icon={Wallet}
          hint={`${formatBRL(stats.total_spend_30d)} nos últimos 30 dias`}
        />
        <MetricCard
          label="Ações Claude (24h)"
          value={formatNumber(stats.claude_actions_today)}
          icon={Bot}
        />
        <MetricCard
          label="ROAS médio (7d)"
          value={`${(stats.avg_roas ?? 0).toFixed(2)}x`}
          icon={TrendingUp}
        />
      </div>

      {/* Alertas + aprovações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-text" />
              <h2 className="text-h4">Alertas</h2>
              {stats.active_alerts > 0 && (
                <StatusPill variant="error" pulse>
                  {stats.active_alerts}
                </StatusPill>
              )}
            </div>
            <Link
              href="/admin/clients"
              className="text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
            >
              Ver tudo →
            </Link>
          </div>
          {alerts && alerts.length > 0 ? (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-glass-light transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-body-sm font-medium truncate">{a.title}</div>
                    <div className="text-[11px] font-mono text-text-tertiary truncate">
                      {pickOne(a.client)?.name ?? "—"} · {formatRelative(a.created_at)}
                    </div>
                  </div>
                  <StatusPill
                    variant={
                      a.severity === "critical"
                        ? "error"
                        : a.severity === "error"
                          ? "error"
                          : a.severity === "warning"
                            ? "pending"
                            : "info"
                    }
                  >
                    {a.severity}
                  </StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="Sem alertas"
              description="Quando algo precisar de atenção, aparece aqui."
            />
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-info-text" />
              <h2 className="text-h4">Aprovações pendentes</h2>
              {stats.pending_approvals > 0 && (
                <StatusPill variant="pending">{stats.pending_approvals}</StatusPill>
              )}
            </div>
            <Link
              href={ROUTES.admin.approvals}
              className="text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
            >
              Ver tudo →
            </Link>
          </div>
          {approvals && approvals.length > 0 ? (
            <ul className="space-y-2">
              {approvals.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-glass-light transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-body-sm font-medium truncate">{a.title}</div>
                    <div className="text-[11px] font-mono text-text-tertiary truncate">
                      {pickOne(a.client)?.name ?? "—"} · {formatRelative(a.created_at)}
                    </div>
                  </div>
                  <StatusPill variant="pending">{a.type}</StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="Tudo aprovado"
              description="Não há ações pendentes da equipe."
            />
          )}
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
        <ClaudeFeed />
      </GlassCard>
    </div>
  );
}
