"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Check, X, ChevronDown, ChevronUp, Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";
import { formatRelative } from "@base-trafego/shared/utils";
import { demoApprovals } from "@/lib/demo/mock-data";

export default function DemoApprovals() {
  const [expanded, setExpanded] = useState<string | null>(demoApprovals[0]?.id ?? null);
  const [resolved, setResolved] = useState<Record<string, "approved" | "rejected" | undefined>>({});

  function decide(id: string, decision: "approved" | "rejected") {
    setResolved((prev) => ({ ...prev, [id]: decision }));
    toast.success(`Aprovação ${decision === "approved" ? "aprovada" : "rejeitada"}`, {
      description: "Modo demo — em produção, Claude executa automaticamente.",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Operação · demo</p>
        <h1 className="text-h1">Aprovações</h1>
        <p className="text-body text-text-secondary mt-1">
          Ações sensíveis de Claude que precisam da sua decisão.
        </p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "expired"] as const).map((s) => (
          <button
            type="button"
            key={s}
            className={`px-3 py-1.5 rounded-full text-body-sm border transition-colors ${
              s === "pending"
                ? "bg-glass-medium border-border-strong text-text-primary"
                : "bg-glass-light border-border-default text-text-tertiary"
            }`}
          >
            {s === "pending" && "Pendentes"}
            {s === "approved" && "Aprovadas"}
            {s === "rejected" && "Rejeitadas"}
            {s === "expired" && "Expiradas"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {demoApprovals.map((it) => {
          const isOpen = expanded === it.id;
          const decision = resolved[it.id];
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
                    {decision ? (
                      <StatusPill variant={decision === "approved" ? "active" : "rejected"}>
                        {decision === "approved" ? "aprovada" : "rejeitada"}
                      </StatusPill>
                    ) : (
                      <StatusPill variant="pending">{it.type.replace(/_/g, " ")}</StatusPill>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-text-tertiary truncate">
                    {it.client.name} · {formatRelative(it.created_at)}
                    <span> · </span>
                    <Clock className="inline w-3 h-3" /> expira{" "}
                    {formatRelative(it.expires_at)}
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
                  <div>
                    <p className="text-label mb-1">Descrição</p>
                    <p className="text-body-sm text-text-secondary">{it.description}</p>
                  </div>

                  <div>
                    <p className="text-label mb-1 flex items-center gap-1">
                      <Bot className="w-3 h-3" /> Justificativa de Claude
                    </p>
                    <p className="text-body-sm text-text-primary italic">
                      “{it.claude_reasoning}”
                    </p>
                  </div>

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

                  <details>
                    <summary className="text-label cursor-pointer hover:text-text-primary">
                      Ver payload completo
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg bg-bg-base border border-border-subtle text-[11px] font-mono overflow-x-auto text-text-tertiary">
                      {JSON.stringify(it.payload, null, 2)}
                    </pre>
                  </details>

                  {!decision && (
                    <div className="flex justify-end gap-3 pt-2">
                      <GlassButton
                        variant="danger"
                        size="sm"
                        onClick={() => decide(it.id, "rejected")}
                      >
                        <X className="w-4 h-4" />
                        Rejeitar
                      </GlassButton>
                      <GlassButton
                        variant="success"
                        size="sm"
                        onClick={() => decide(it.id, "approved")}
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

      <GlassCard className="p-6 text-center">
        <ShieldCheck className="w-6 h-6 text-info-text mx-auto mb-2" />
        <p className="text-body-sm text-text-secondary">
          Aprovações em modo demo — clique em "Aprovar" pra ver o feedback. Em produção, Claude
          retoma a execução via Meta API automaticamente.
        </p>
      </GlassCard>
    </div>
  );
}
