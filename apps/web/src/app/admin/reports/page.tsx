import type { Metadata } from "next";
import { FileBarChart2, Download } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";
import { EmptyState } from "@/components/glass/empty-state";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/utils";
import { formatRelative } from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Relatórios" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, title, type, format, period_start, period_end, file_url, created_at, generated_by_claude, client:clients(name, slug)")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, slug")
    .eq("status", "active");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Documentos</p>
        <h1 className="text-h1">Relatórios</h1>
        <p className="text-body text-text-secondary mt-1">
          Histórico de relatórios gerados pelos clientes da agência.
        </p>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-h4 mb-4">Gerar novo relatório</h2>
        <form
          action="/api/admin/reports/generate"
          method="post"
          className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3"
        >
          <select
            name="client_id"
            required
            className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm"
          >
            <option value="">Selecione cliente…</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="type"
            className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm"
          >
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
            <option value="executive">Executivo</option>
          </select>
          <select
            name="format"
            className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm"
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="web_link">Link compartilhável</option>
          </select>
          <GlassButton type="submit">Gerar</GlassButton>
        </form>
      </GlassCard>

      {reports && reports.length > 0 ? (
        <div className="space-y-2">
          {reports.map((r) => (
            <GlassCard key={r.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-glass-medium border border-border-default flex items-center justify-center">
                <FileBarChart2 className="w-4 h-4 text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body font-medium truncate">{r.title}</div>
                <div className="text-[11px] font-mono text-text-tertiary">
                  {pickOne(r.client)?.name} · {r.period_start} → {r.period_end} ·{" "}
                  {formatRelative(r.created_at)}
                </div>
              </div>
              <StatusPill variant="info">{r.format.toUpperCase()}</StatusPill>
              {r.generated_by_claude && <StatusPill variant="info">claude</StatusPill>}
              {r.file_url && (
                <a href={r.file_url} target="_blank" rel="noopener">
                  <GlassButton variant="glass" size="sm">
                    <Download className="w-4 h-4" />
                    Baixar
                  </GlassButton>
                </a>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileBarChart2}
          title="Sem relatórios ainda"
          description="Gere o primeiro relatório acima."
        />
      )}
    </div>
  );
}
