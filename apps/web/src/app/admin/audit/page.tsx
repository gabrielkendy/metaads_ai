import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { EmptyState } from "@/components/glass/empty-state";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/utils";
import { formatRelative } from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Auditoria" };
export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; actor?: string; resource?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("id, actor_type, actor_email, action, resource_type, resource_id, created_at, metadata, client:clients(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (sp.actor) query = query.eq("actor_type", sp.actor);
  if (sp.resource) query = query.eq("resource_type", sp.resource);
  if (sp.q) query = query.ilike("action", `%${sp.q}%`);

  const { data: logs } = await query;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Compliance</p>
        <h1 className="text-h1">Auditoria</h1>
        <p className="text-body text-text-secondary mt-1">
          Tudo que acontece na plataforma — usuários, Claude, sistema.
        </p>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar ação…"
          className="flex-1 min-w-48 h-10 px-3 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 outline-none text-body-sm"
        />
        <select
          name="actor"
          defaultValue={sp.actor ?? ""}
          className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm"
        >
          <option value="">Todos atores</option>
          <option value="user">Usuário</option>
          <option value="claude">Claude</option>
          <option value="system">Sistema</option>
          <option value="cron">Cron</option>
        </select>
        <select
          name="resource"
          defaultValue={sp.resource ?? ""}
          className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm"
        >
          <option value="">Todos recursos</option>
          <option value="client">Client</option>
          <option value="campaign">Campaign</option>
          <option value="ad">Ad</option>
          <option value="approval">Approval</option>
          <option value="alert">Alert</option>
        </select>
        <button
          type="submit"
          className="h-10 px-5 rounded-xl bg-glass-medium border border-border-default hover:bg-glass-heavy text-body-sm"
        >
          Filtrar
        </button>
      </form>

      <GlassCard className="overflow-hidden">
        {logs && logs.length > 0 ? (
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
                {logs.map((l) => (
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
                      <span className="ml-2 text-text-tertiary text-[11px]">
                        {l.actor_email ?? ""}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-body-sm font-mono">{l.action}</td>
                    <td className="px-5 py-3 text-body-sm text-text-tertiary">
                      {l.resource_type}
                    </td>
                    <td className="px-5 py-3 text-body-sm text-text-secondary">
                      {pickOne(l.client)?.name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="Sem registros"
            description="Quando ações acontecerem, aparecem aqui."
          />
        )}
      </GlassCard>
    </div>
  );
}
