"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { EmptyState } from "@/components/glass/empty-state";
import { createClient } from "@/lib/supabase/client";

interface CreativeRow {
  id: string;
  name: string;
  status: string;
  headline: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
}

export function TopCreatives({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<CreativeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createClient();
    sb.from("ads")
      .select("id, name, status, headline, image_url, thumbnail_url")
      .eq("client_id", clientId)
      .in("status", ["active", "approved"])
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setItems((data ?? []) as never);
        setLoading(false);
      });
  }, [clientId]);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <h2 className="text-h4">Top criativos</h2>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-glass-light hover:bg-glass-medium transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-glass-medium border border-border-default overflow-hidden flex items-center justify-center shrink-0">
                {c.thumbnail_url || c.image_url ? (
                  // biome-ignore lint/a11y/useAltText: creative thumb
                  <img
                    src={c.thumbnail_url ?? c.image_url ?? undefined}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-4 h-4 text-text-tertiary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium truncate">{c.name}</p>
                {c.headline && (
                  <p className="text-[11px] text-text-tertiary truncate">{c.headline}</p>
                )}
              </div>
              <StatusPill variant={c.status === "active" ? "active" : "pending"}>
                {c.status}
              </StatusPill>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="Sem criativos rodando"
          description="Quando suas campanhas tiverem anúncios, eles aparecem aqui."
        />
      )}
    </GlassCard>
  );
}
