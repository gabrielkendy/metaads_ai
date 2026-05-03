import type { Metadata } from "next";
import { GlassCard } from "@/components/glass/glass-card";
import { formatRelative } from "@base-trafego/shared/utils";
import { demoHistorico } from "@/lib/demo/mock-data";

const LABELS: Record<string, string> = {
  create_campaign: "Nova campanha lançada",
  pause_campaign: "Campanha pausada",
  resume_campaign: "Campanha retomada",
  create_ad: "Novo anúncio criado",
  pause_ad: "Anúncio pausado",
  create_creative: "Novo criativo gerado",
  budget_change: "Orçamento ajustado",
  generate_report: "Relatório gerado",
  sync_meta_data: "Sincronização Meta",
};

export const metadata: Metadata = { title: "Demo · Histórico" };

export default function DemoHistorico() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Linha do tempo · demo</p>
        <h1 className="text-h1">Histórico</h1>
        <p className="text-body text-text-secondary mt-1">
          Tudo que aconteceu nas suas campanhas — gerenciado pela Agência BASE.
        </p>
      </div>

      <GlassCard className="p-6">
        <ol className="relative border-l border-border-subtle ml-2 pl-6 space-y-6">
          {demoHistorico.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[34px] top-1.5 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-bg-base" />
              <p className="text-body font-medium">{LABELS[a.action_type] ?? a.action_type}</p>
              <p className="text-body-sm text-text-secondary mt-1">{a.reasoning}</p>
              <p className="text-[11px] font-mono text-text-tertiary mt-1">
                {formatRelative(a.created_at)}
              </p>
            </li>
          ))}
        </ol>
      </GlassCard>
    </div>
  );
}
