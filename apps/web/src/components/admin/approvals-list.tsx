"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Bot, Check, X, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";
import { decideApproval } from "@/lib/actions/approvals";
import { formatRelative } from "@base-trafego/shared/utils";

interface Item {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  claude_reasoning: string | null;
  payload: Record<string, unknown>;
  estimated_impact: Record<string, unknown> | null;
  expires_at: string | null;
  created_at: string;
  client: { name: string; slug: string } | null;
}

export function ApprovalsList({ items }: { items: Item[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDecision(id: string, decision: "approve" | "reject") {
    const reason =
      decision === "reject" ? prompt("Motivo da rejeição (opcional):") ?? undefined : undefined;
    startTransition(async () => {
      const res = await decideApproval(id, decision, reason);
      if (res.ok) {
        toast.success(`Aprovação ${decision === "approve" ? "aprovada" : "rejeitada"}`);
      } else {
        toast.error("Falha", { description: res.error });
      }
    });
  }

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const isOpen = expanded === it.id;
        return (
          <GlassCard key={it.id} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : it.id)}
              className="w-full p-5 flex items-center gap-4 text-left hover:bg-glass-light transition-colors"
            >
              <Bot className="w-4 h-4 text-brand-500 shrink-0" strokeWidth={1.75} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-body font-medium truncate">{it.title}</h3>
                  <StatusPill variant="pending">{it.type.replace(/_/g, " ")}</StatusPill>
                </div>
                <div className="text-[11px] font-mono text-text-tertiary truncate">
                  {it.client?.name ?? "—"} · {formatRelative(it.created_at)}
                  {it.expires_at && (
                    <>
                      {" · "}
                      <Clock className="inline w-3 h-3" /> expira{" "}
                      {formatRelative(it.expires_at)}
                    </>
                  )}
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-text-tertiary shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-tertiary shrink-0" />
              )}
            </button>

            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="px-5 pb-5 space-y-4 border-t border-border-subtle"
              >
                {it.description && (
                  <div>
                    <p className="text-label mb-1">Descrição</p>
                    <p className="text-body-sm text-text-secondary">{it.description}</p>
                  </div>
                )}

                {it.claude_reasoning && (
                  <div>
                    <p className="text-label mb-1 flex items-center gap-1">
                      <Bot className="w-3 h-3" /> Justificativa de Claude
                    </p>
                    <p className="text-body-sm text-text-primary italic">
                      “{it.claude_reasoning}”
                    </p>
                  </div>
                )}

                {it.estimated_impact && Object.keys(it.estimated_impact).length > 0 && (
                  <div>
                    <p className="text-label mb-2">Impacto estimado</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(it.estimated_impact).map(([k, v]) => (
                        <div
                          key={k}
                          className="p-2.5 rounded-lg bg-glass-light border border-border-subtle"
                        >
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
                            {k.replace(/_/g, " ")}
                          </div>
                          <div className="text-body-sm font-mono">{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <details>
                  <summary className="text-label cursor-pointer hover:text-text-primary">
                    Ver payload completo
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-bg-base border border-border-subtle text-[11px] font-mono overflow-x-auto text-text-tertiary">
                    {JSON.stringify(it.payload, null, 2)}
                  </pre>
                </details>

                {it.status === "pending" && (
                  <div className="flex justify-end gap-3 pt-2">
                    <GlassButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDecision(it.id, "reject")}
                      disabled={pending}
                    >
                      <X className="w-4 h-4" />
                      Rejeitar
                    </GlassButton>
                    <GlassButton
                      variant="success"
                      size="sm"
                      onClick={() => handleDecision(it.id, "approve")}
                      disabled={pending}
                    >
                      <Check className="w-4 h-4" />
                      Aprovar e executar
                    </GlassButton>
                  </div>
                )}
              </motion.div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
