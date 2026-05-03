import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { formatBRL } from "@base-trafego/shared/utils";
import { demoClients } from "@/lib/demo/mock-data";

export const metadata: Metadata = { title: "Demo · Clientes" };

export default function DemoClients() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:justify-between">
        <div>
          <p className="text-label mb-1">Gestão · demo</p>
          <h1 className="text-h1">Clientes</h1>
          <p className="text-body text-text-secondary mt-1">
            Todos os clientes ativos da Agência BASE.
          </p>
        </div>
        <GlassButton disabled>
          <Plus className="w-4 h-4" />
          Novo cliente
        </GlassButton>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar cliente…"
            disabled
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-glass-light border border-border-default text-body-sm placeholder:text-text-muted opacity-60"
          />
        </div>
        <select
          disabled
          className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm opacity-60"
        >
          <option>Todos status</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {demoClients.map((c) => (
          <Link key={c.id} href={`/demo/admin/clients/${c.slug}`} className="block">
            <GlassCard hoverable className="p-5 h-full">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${c.brand_primary_color}40, ${c.brand_primary_color}10)`,
                    color: c.brand_primary_color,
                    border: `1px solid ${c.brand_primary_color}40`,
                  }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-body font-semibold truncate">{c.name}</h3>
                  <p className="text-[11px] font-mono text-text-tertiary truncate">/{c.slug}</p>
                </div>
                <StatusPill
                  variant={
                    c.status === "active"
                      ? "active"
                      : c.status === "onboarding"
                        ? "info"
                        : "paused"
                  }
                >
                  {c.status}
                </StatusPill>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle">
                <div>
                  <div className="text-label">Plano</div>
                  <div className="text-body-sm font-medium uppercase">{c.plan}</div>
                </div>
                <div>
                  <div className="text-label">Budget/mês</div>
                  <div className="text-body-sm font-mono">
                    {c.monthly_budget_limit ? formatBRL(c.monthly_budget_limit) : "—"}
                  </div>
                </div>
                {c.industry && (
                  <div className="col-span-2">
                    <div className="text-label">Setor</div>
                    <div className="text-body-sm">{c.industry}</div>
                  </div>
                )}
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      <p className="text-center text-body-sm text-text-tertiary mt-6">
        💡 Clique em qualquer cliente pra ver as campanhas detalhadas. Just Burn tem dashboard
        white-label completo.
      </p>
    </div>
  );
}
