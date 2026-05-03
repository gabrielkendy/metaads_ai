"use client";

import { useState } from "react";
import { ImageIcon, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";
import { demoAds } from "@/lib/demo/mock-data";

export default function DemoCriativos() {
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>({});
  const [pending, setPending] = useState<string | null>(null);

  function handle(adId: string, approved: boolean) {
    setPending(adId);
    setTimeout(() => {
      setDecisions((p) => ({ ...p, [adId]: approved ? "approved" : "rejected" }));
      setPending(null);
      toast.success(approved ? "Criativo aprovado" : "Criativo rejeitado", {
        description: "Modo demo — em produção, Claude ativa o anúncio no Meta automaticamente.",
      });
    }, 600);
  }

  const pendingAds = demoAds.filter((a) => a.status === "pending_approval" && !decisions[a.id]);
  const activeAds = demoAds.filter((a) => a.status === "active" || decisions[a.id] === "approved");
  const otherAds = demoAds.filter(
    (a) => a.status === "paused" || decisions[a.id] === "rejected",
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-label mb-1">Galeria · demo</p>
        <h1 className="text-h1">Criativos</h1>
        <p className="text-body text-text-secondary mt-1">
          Anúncios rodando e aguardando sua aprovação.
        </p>
      </div>

      {pendingAds.length > 0 && (
        <section>
          <h2 className="text-h4 mb-4 flex items-center gap-2">
            Aguardando sua aprovação
            <StatusPill variant="pending">{pendingAds.length}</StatusPill>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingAds.map((ad) => (
              <GlassCard key={ad.id} className="overflow-hidden flex flex-col">
                <div className="relative aspect-square bg-bg-elevated">
                  {/* biome-ignore lint/a11y/useAltText: creative */}
                  <img src={ad.image_url} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <StatusPill variant="pending">aguarda aprovação</StatusPill>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-body font-medium truncate">{ad.headline}</h3>
                  <p className="text-body-sm text-text-secondary line-clamp-2 mt-1">{ad.body}</p>
                  <span className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
                    CTA: {ad.cta_type?.replace(/_/g, " ")}
                  </span>
                  <div className="mt-4 pt-4 border-t border-border-subtle flex gap-2">
                    <GlassButton
                      variant="success"
                      size="sm"
                      className="flex-1"
                      onClick={() => handle(ad.id, true)}
                      disabled={pending === ad.id}
                    >
                      {pending === ad.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Aprovar
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => handle(ad.id, false)}
                      disabled={pending === ad.id}
                    >
                      <X className="w-4 h-4" />
                      Rejeitar
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-h4 mb-4 flex items-center gap-2">
          Ativos <StatusPill variant="active">{activeAds.length}</StatusPill>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeAds.map((ad) => (
            <GlassCard key={ad.id} className="overflow-hidden flex flex-col">
              <div className="relative aspect-square bg-bg-elevated">
                {/* biome-ignore lint/a11y/useAltText: creative */}
                <img src={ad.image_url} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">
                  <StatusPill variant="active">{ad.status}</StatusPill>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-body font-medium truncate">{ad.headline}</h3>
                <p className="text-body-sm text-text-secondary line-clamp-2 mt-1">{ad.body}</p>
                <span className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
                  CTA: {ad.cta_type?.replace(/_/g, " ")}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {otherAds.length > 0 && (
        <section>
          <h2 className="text-h4 mb-4">Histórico</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherAds.map((ad) => (
              <GlassCard key={ad.id} className="overflow-hidden flex flex-col opacity-70">
                <div className="relative aspect-square bg-bg-elevated">
                  {/* biome-ignore lint/a11y/useAltText: creative */}
                  <img src={ad.image_url} className="w-full h-full object-cover grayscale" />
                  <div className="absolute top-3 left-3">
                    <StatusPill
                      variant={decisions[ad.id] === "rejected" ? "rejected" : "paused"}
                    >
                      {decisions[ad.id] === "rejected" ? "rejeitado" : ad.status}
                    </StatusPill>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-body font-medium truncate">{ad.headline}</h3>
                  <p className="text-body-sm text-text-tertiary line-clamp-2 mt-1">{ad.body}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
