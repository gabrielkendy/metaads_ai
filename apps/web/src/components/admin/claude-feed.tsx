"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Bot, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatusPill } from "@/components/glass/status-pill";
import { formatRelative } from "@base-trafego/shared/utils";
import { fadeInUp } from "@/lib/motion/variants";
import { EmptyState } from "@/components/glass/empty-state";

interface FeedItem {
  id: string;
  tool_name: string;
  status: string;
  created_at: string;
  duration_ms: number | null;
  reasoning: string | null;
  client?: { name: string } | null;
}

export function ClaudeFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetch = async () => {
      const { data } = await supabase
        .from("claude_actions")
        .select("id, tool_name, status, created_at, duration_ms, reasoning, client:clients(name)")
        .order("created_at", { ascending: false })
        .limit(15);
      setItems((data ?? []) as unknown as FeedItem[]);
      setLoading(false);
    };

    fetch();

    const channel = supabase
      .channel("admin:claude-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "claude_actions" },
        (payload) => {
          setItems((prev) => [payload.new as unknown as FeedItem, ...prev].slice(0, 15));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "claude_actions" },
        (payload) => {
          setItems((prev) =>
            prev.map((i) => (i.id === (payload.new as { id: string }).id ? (payload.new as unknown as FeedItem) : i)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bot}
        title="Nenhuma ação ainda"
        description="Quando Claude executar comandos via MCP, aparecem aqui em tempo real."
      />
    );
  }

  return (
    <ul className="space-y-1">
      <AnimatePresence initial={false}>
        {items.map((it) => (
          <motion.li
            key={it.id}
            layout
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-glass-light transition-colors"
          >
            <span className="shrink-0">
              {it.status === "success" && (
                <CheckCircle2 className="w-4 h-4 text-success-text" strokeWidth={1.75} />
              )}
              {it.status === "failed" && <XCircle className="w-4 h-4 text-danger-text" />}
              {it.status === "pending" && (
                <Clock className="w-4 h-4 text-warning-text" strokeWidth={1.75} />
              )}
              {it.status === "in_progress" && (
                <Loader2 className="w-4 h-4 text-info-text animate-spin" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-mono text-text-primary truncate">
                {it.tool_name}
                {it.client?.name && (
                  <span className="text-text-tertiary"> · {it.client.name}</span>
                )}
              </div>
              {it.reasoning && (
                <div className="text-[11px] text-text-tertiary truncate">{it.reasoning}</div>
              )}
            </div>
            <span className="text-[11px] font-mono text-text-tertiary shrink-0">
              {formatRelative(it.created_at)}
            </span>
            {it.duration_ms != null && (
              <StatusPill variant="neutral">{(it.duration_ms / 1000).toFixed(1)}s</StatusPill>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
