import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { EmptyState } from "@/components/glass/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, name, slug, status, plan, monthly_budget_limit, logo_url, brand_primary_color, industry")
    .order("name");

  if (sp.q) query = query.ilike("name", `%${sp.q}%`);
  if (sp.status) query = query.eq("status", sp.status as never);

  const { data: clients } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:justify-between">
        <div>
          <p className="text-label mb-1">Gestão</p>
          <h1 className="text-h1">Clientes</h1>
          <p className="text-body text-text-secondary mt-1">
            Todos os clientes ativos da Agência BASE.
          </p>
        </div>
        <Link href="/admin/clients/new">
          <GlassButton>
            <Plus className="w-4 h-4" />
            Novo cliente
          </GlassButton>
        </Link>
      </div>

      {/* Search/filter bar */}
      <form className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar cliente…"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-glass-light border border-border-default focus:bg-glass-medium focus:border-brand-500 outline-none transition-all text-body-sm placeholder:text-text-muted"
          />
        </div>
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="h-10 px-3 rounded-xl bg-glass-light border border-border-default focus:bg-glass-medium focus:border-brand-500 outline-none transition-all text-body-sm"
        >
          <option value="">Todos status</option>
          <option value="active">Ativos</option>
          <option value="paused">Pausados</option>
          <option value="onboarding">Onboarding</option>
          <option value="churned">Churn</option>
        </select>
        <GlassButton type="submit" variant="glass">
          Filtrar
        </GlassButton>
      </form>

      {clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((c) => (
            <Link key={c.id} href={`/admin/clients/${c.id}`} className="block">
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
                    {c.logo_url ? (
                      // biome-ignore lint/a11y/useAltText: avatar
                      <img
                        src={c.logo_url}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      c.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body font-semibold truncate">{c.name}</h3>
                    <p className="text-[11px] font-mono text-text-tertiary truncate">
                      /{c.slug}
                    </p>
                  </div>
                  <StatusPill
                    variant={
                      c.status === "active"
                        ? "active"
                        : c.status === "onboarding"
                          ? "info"
                          : c.status === "paused"
                            ? "paused"
                            : "neutral"
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
                      {c.monthly_budget_limit
                        ? formatBRL(c.monthly_budget_limit)
                        : "—"}
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
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Comece adicionando seu primeiro cliente pra começar a operar."
          action={
            <Link href="/admin/clients/new">
              <GlassButton>
                <Plus className="w-4 h-4" />
                Novo cliente
              </GlassButton>
            </Link>
          }
        />
      )}
    </div>
  );
}
