"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/glass/glass-card";
import { cn } from "@/lib/utils";
import { formatRelative } from "@base-trafego/shared/utils";
import { demoMessages } from "@/lib/demo/mock-data";

export default function DemoMensagens() {
  const [items, setItems] = useState(demoMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setTimeout(() => {
      setItems((p) => [
        ...p,
        {
          id: `mock-${Date.now()}`,
          sender_id: "demo-client-user",
          sender_role: "client_admin" as const,
          content: text.trim(),
          created_at: new Date().toISOString(),
          sender: { full_name: "Marina (FlexByo)", avatar_url: null },
        },
      ]);
      setText("");
      setSending(false);
      setTimeout(() => {
        setItems((p) => [
          ...p,
          {
            id: `mock-r-${Date.now()}`,
            sender_id: "demo-admin",
            sender_role: "admin" as const,
            content: "Beleza, anotado! Vou olhar e te respondo em seguida 👀",
            created_at: new Date().toISOString(),
            sender: { full_name: "Kendy (Agência BASE)", avatar_url: null },
          },
        ]);
      }, 1500);
    }, 400);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Comunicação · demo</p>
        <h1 className="text-h1">Mensagens</h1>
        <p className="text-body text-text-secondary mt-1">
          Chat direto com a equipe da Agência BASE.
        </p>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <AnimatePresence initial={false}>
              {items.map((m) => {
                const mine = m.sender_id === "demo-client-user";
                const isAdmin = m.sender_role === "admin";
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
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border-subtle p-4 flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva sua mensagem…"
              className="flex-1 h-10 px-4 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 focus:bg-glass-medium outline-none text-body-sm placeholder:text-text-muted transition-all"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="h-10 px-4 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
