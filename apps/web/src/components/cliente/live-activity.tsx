"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/glass/glass-card";
import { EmptyState } from "@/components/glass/empty-state";
import { StatusPill } from "@/components/glass/status-pill";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@base-trafego/shared/utils";
import { fadeInUp } from "@/lib/motion/variants";

interface ActivityRow {
  id: string;
  kind: "claude" | "alert" | "approval";
  title: string;
  detail?: string;
  created_at: string;
}

const ACTIVITY_LABELS: Record<string, string> = {
  create_campaign: "Nova campanha lançada",
  pause_campaign: "Campanha pausada",
  resume_campaign: "Campanha retomada",
  create_ad: "Novo anúncio criado",
  pause_ad: "Anúncio pausado",
  create_creative: "Novo criativo gerado",
  budget_change: "Orçamento ajustado",
  generate_report: "Relatório gerado",
};

export function LiveActivity({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createClient();
    let active = true;

    const init = async () => {
      const { data } = await sb
        .from("claude_actions")
        .select("id, action_type, status, created_at, reasoning")
        .eq("client_id", clientId)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(8);

      if (!active) return;
      const mapped: ActivityRow[] = (data ?? []).map((d) => ({
        id: d.id,
        kind: "claude",
        title: ACTIVITY_LABELS[d.action_type as string] ?? d.action_type,
        detail: d.reasoning ?? undefined,
        created_at: d.created_at,
      }));
      setItems(mapped);
      setLoading(false);
    };

    init();

    const channel = sb
      .channel(`client:${clientId}:activity`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "claude_actions",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; action_type: string; status: string; reasoning: string | null; created_at: string };
          if (row.status !== "success") return;
          setItems((prev) =>
            [
              {
                id: row.id,
                kind: "claude" as const,
                title: ACTIVITY_LABELS[row.action_type] ?? row.action_type,
                detail: row.reasoning ?? undefined,
                created_at: row.created_at,
              },
              ...prev.filter((p) => p.id !== row.id),
            ].slice(0, 8),
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, [clientId]);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-500" />
          <h2 className="text-h4">Atividade ao vivo</h2>
          <StatusPill variant="info" pulse>
            ao vivo
          </StatusPill>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((it) => (
              <motion.li
                key={it.id}
                layout
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-glass-light"
              >
                {it.kind === "claude" ? (
                  <Bot className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                ) : it.kind === "alert" ? (
                  <AlertCircle className="w-4 h-4 text-warning-text mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-success-text mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-medium">{it.title}</p>
                  {it.detail && (
                    <p className="text-[11px] text-text-tertiary truncate">{it.detail}</p>
                  )}
                </div>
                <span className="text-[11px] font-mono text-text-tertiary shrink-0">
                  {formatRelative(it.created_at)}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <EmptyState
          icon={Activity}
          title="Sem atividade recente"
          description="Quando algo acontecer com suas campanhas, aparece aqui."
        />
      )}
    </GlassCard>
  );
}
