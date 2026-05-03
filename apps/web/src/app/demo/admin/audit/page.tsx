import type { Metadata } from "next";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { formatRelative } from "@base-trafego/shared/utils";
import { demoAuditLogs } from "@/lib/demo/mock-data";

export const metadata: Metadata = { title: "Demo · Auditoria" };

export default function DemoAudit() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Compliance · demo</p>
        <h1 className="text-h1">Auditoria</h1>
        <p className="text-body text-text-secondary mt-1">
          Tudo que acontece na plataforma — usuários, Claude, sistema.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Buscar ação…"
          disabled
          className="flex-1 min-w-48 h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm opacity-60"
        />
        <select
          disabled
          className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm opacity-60"
        >
          <option>Todos atores</option>
        </select>
        <select
          disabled
          className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm opacity-60"
        >
          <option>Todos recursos</option>
        </select>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border-subtle">
              <tr className="text-label">
                <th className="text-left px-5 py-3 font-medium">Quando</th>
                <th className="text-left px-5 py-3 font-medium">Quem</th>
                <th className="text-left px-5 py-3 font-medium">Ação</th>
                <th className="text-left px-5 py-3 font-medium">Recurso</th>
                <th className="text-left px-5 py-3 font-medium">Cliente</th>
              </tr>
            </thead>
            <tbody>
              {demoAuditLogs.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-border-subtle/50 hover:bg-glass-light transition-colors"
                >
                  <td className="px-5 py-3 text-body-sm font-mono text-text-tertiary whitespace-nowrap">
                    {formatRelative(l.created_at)}
                  </td>
                  <td className="px-5 py-3 text-body-sm">
                    <StatusPill
                      variant={
                        l.actor_type === "claude"
                          ? "info"
                          : l.actor_type === "user"
                            ? "neutral"
                            : "paused"
                      }
                    >
                      {l.actor_type}
                    </StatusPill>
                    {l.actor_email && (
                      <span className="ml-2 text-text-tertiary text-[11px]">{l.actor_email}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-body-sm font-mono">{l.action}</td>
                  <td className="px-5 py-3 text-body-sm text-text-tertiary">{l.resource_type}</td>
                  <td className="px-5 py-3 text-body-sm text-text-secondary">
                    {l.client?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
