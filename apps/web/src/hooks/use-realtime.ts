"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeOptions<T> {
  table: string;
  filter?: string;
  schema?: string;
  events?: ("INSERT" | "UPDATE" | "DELETE" | "*")[];
  initialFetch?: () => Promise<T[]>;
}

/**
 * Hook genérico pra subscrever em mudanças de uma tabela com filtro.
 * Retorna a lista atualizada em tempo real.
 */
export function useRealtimeList<T extends { id: string | number }>({
  table,
  filter,
  schema = "public",
  events = ["*"],
  initialFetch,
}: UseRealtimeOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let active = true;

    const init = async () => {
      try {
        if (initialFetch) {
          const initial = await initialFetch();
          if (active) setItems(initial);
        }
      } catch (e) {
        if (active) setError(e as Error);
      } finally {
        if (active) setLoading(false);
      }

      channel = supabase.channel(`${table}:${filter ?? "all"}`);

      for (const event of events) {
        channel = channel.on(
          "postgres_changes",
          { event, schema, table, filter },
          (payload) => {
            if (!active) return;
            setItems((prev) => {
              const newRow = payload.new as T;
              const oldRow = payload.old as T;
              switch (payload.eventType) {
                case "INSERT":
                  if (prev.find((p) => p.id === newRow?.id)) return prev;
                  return [newRow, ...prev];
                case "UPDATE":
                  return prev.map((p) => (p.id === newRow.id ? newRow : p));
                case "DELETE":
                  return prev.filter((p) => p.id !== oldRow.id);
                default:
                  return prev;
              }
            });
          },
        );
      }

      channel.subscribe();
    };

    init();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, schema]);

  return { items, loading, error, setItems };
}
