import type { Metadata } from "next";
import { FileBarChart2, Download } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";
import { formatRelative } from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Demo · Relatórios" };

const REPORTS = [
  {
    id: "1",
    title: "Relatório Semanal — Just Burn Club",
    type: "weekly",
    format: "pdf",
    period: "21/04 → 28/04",
    created_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
    by_claude: true,
  },
  {
    id: "2",
    title: "Executivo Mensal — FlexByo",
    type: "executive",
    format: "pdf",
    period: "Abril 2026",
    created_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
    by_claude: true,
  },
  {
    id: "3",
    title: "Performance Detalhada — Beat Life",
    type: "monthly",
    format: "csv",
    period: "Abril 2026",
    created_at: new Date(Date.now() - 7 * 86400_000).toISOString(),
    by_claude: false,
  },
  {
    id: "4",
    title: "Semanal — Manchester Burger",
    type: "weekly",
    format: "web_link",
    period: "14/04 → 21/04",
    created_at: new Date(Date.now() - 14 * 86400_000).toISOString(),
    by_claude: true,
  },
];

export default function DemoReports() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Documentos · demo</p>
        <h1 className="text-h1">Relatórios</h1>
        <p className="text-body text-text-secondary mt-1">
          Histórico de relatórios gerados pelos clientes da agência.
        </p>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-h4 mb-4">Gerar novo relatório</h2>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3">
          <select
            disabled
            className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm opacity-60"
          >
            <option>Selecione cliente…</option>
          </select>
          <select
            disabled
            className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm opacity-60"
          >
            <option>Semanal</option>
          </select>
          <select
            disabled
            className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm opacity-60"
          >
            <option>PDF</option>
          </select>
          <GlassButton disabled>Gerar</GlassButton>
        </div>
      </GlassCard>

      <div className="space-y-2">
        {REPORTS.map((r) => (
          <GlassCard key={r.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-glass-medium border border-border-default flex items-center justify-center">
              <FileBarChart2 className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body font-medium truncate">{r.title}</div>
              <div className="text-[11px] font-mono text-text-tertiary">
                {r.period} · {formatRelative(r.created_at)}
              </div>
            </div>
            <StatusPill variant="info">{r.format.toUpperCase()}</StatusPill>
            {r.by_claude && <StatusPill variant="info">claude</StatusPill>}
            <GlassButton variant="glass" size="sm" disabled>
              <Download className="w-4 h-4" />
              Baixar
            </GlassButton>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
