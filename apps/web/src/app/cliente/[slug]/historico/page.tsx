import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { EmptyState } from "@/components/glass/empty-state";
import { createClient } from "@/lib/supabase/server";
import { requireClientAccess } from "@/lib/auth/helpers";
import { formatRelative } from "@base-trafego/shared/utils";

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

export const metadata: Metadata = { title: "Histórico" };
export const dynamic = "force-dynamic";

export default async function HistoricoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireClientAccess(slug);
  const supabase = await createClient();

  const { data: actions } = await supabase
    .from("claude_actions")
    .select("id, action_type, status, created_at, reasoning")
    .eq("client_id", ctx.client.id)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(80);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Linha do tempo</p>
        <h1 className="text-h1">Histórico</h1>
        <p className="text-body text-text-secondary mt-1">
          Tudo que aconteceu nas suas campanhas — gerenciado pela Agência BASE.
        </p>
      </div>

      {actions && actions.length > 0 ? (
        <GlassCard className="p-6">
          <ol className="relative border-l border-border-subtle ml-2 pl-6 space-y-6">
            {actions.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[34px] top-1.5 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-bg-base" />
                <p className="text-body font-medium">
                  {LABELS[a.action_type] ?? a.action_type}
                </p>
                {a.reasoning && (
                  <p className="text-body-sm text-text-secondary mt-1">{a.reasoning}</p>
                )}
                <p className="text-[11px] font-mono text-text-tertiary mt-1">
                  {formatRelative(a.created_at)}
                </p>
              </li>
            ))}
          </ol>
        </GlassCard>
      ) : (
        <EmptyState
          icon={Activity}
          title="Sem histórico ainda"
          description="Quando algo acontecer com suas campanhas, aparece aqui."
        />
      )}
    </div>
  );
}
