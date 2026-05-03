"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/messages";
import { cn } from "@/lib/utils";
import { formatRelative } from "@base-trafego/shared/utils";

interface MessageRow {
  id: string;
  content: string;
  sender_id: string;
  sender_role: string;
  created_at: string;
  sender?: { full_name: string | null; avatar_url: string | null } | null;
}

export function ChatPanel({
  clientId,
  currentUserId,
  initialMessages,
}: {
  clientId: string;
  currentUserId: string;
  initialMessages: MessageRow[];
}) {
  const [items, setItems] = useState<MessageRow[]>(initialMessages);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [items]);

  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel(`messages:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          setItems((prev) => {
            const row = payload.new as MessageRow;
            if (prev.find((p) => p.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [clientId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    startTransition(async () => {
      await sendMessage(clientId, content);
    });
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-body-sm text-text-tertiary py-12">
            Nenhuma mensagem ainda. Comece dizendo oi 👋
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((m) => {
              const mine = m.sender_id === currentUserId;
              const isAdmin = ["admin", "super_admin"].includes(m.sender_role);
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[78%] px-4 py-2.5 rounded-2xl text-body-sm",
                      mine
                        ? "bg-brand-500 text-white rounded-br-sm"
                        : "bg-glass-medium text-text-primary border border-border-default rounded-bl-sm",
                    )}
                  >
                    {!mine && (
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] mb-0.5 opacity-70">
                        {isAdmin ? "Agência BASE" : m.sender?.full_name ?? "Cliente"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p
                      className={cn(
                        "text-[10px] font-mono mt-1",
                        mine ? "text-white/60" : "text-text-tertiary",
                      )}
                    >
                      {formatRelative(m.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border-subtle p-4 flex gap-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva sua mensagem…"
          className="flex-1 h-10 px-4 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 focus:bg-glass-medium outline-none text-body-sm placeholder:text-text-muted transition-all"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="h-10 px-4 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar
        </button>
      </form>
    </div>
  );
}
