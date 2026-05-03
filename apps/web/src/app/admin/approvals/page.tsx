import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { EmptyState } from "@/components/glass/empty-state";
import { ApprovalsList } from "@/components/admin/approvals-list";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Aprovações" };
export const dynamic = "force-dynamic";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "pending";
  const supabase = await createClient();

  const { data: approvals } = await supabase
    .from("approvals")
    .select(
      "id, type, status, title, description, claude_reasoning, payload, estimated_impact, expires_at, created_at, client:clients(name, slug)",
    )
    .eq("status", status as never)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Operação</p>
        <h1 className="text-h1">Aprovações</h1>
        <p className="text-body text-text-secondary mt-1">
          Ações sensíveis de Claude que precisam da sua decisão.
        </p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "expired"] as const).map((s) => (
          <a
            key={s}
            href={`/admin/approvals?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-body-sm border transition-colors ${
              status === s
                ? "bg-glass-medium border-border-strong text-text-primary"
                : "bg-glass-light border-border-default text-text-tertiary hover:text-text-primary"
            }`}
          >
            {s === "pending" && "Pendentes"}
            {s === "approved" && "Aprovadas"}
            {s === "rejected" && "Rejeitadas"}
            {s === "expired" && "Expiradas"}
          </a>
        ))}
      </div>

      {approvals && approvals.length > 0 ? (
        <ApprovalsList items={approvals as never} />
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhuma aprovação"
          description={
            status === "pending"
              ? "Quando Claude solicitar aprovação pra ações de alto impacto, aparecem aqui."
              : "Nenhum item nesse filtro."
          }
        />
      )}
    </div>
  );
}
