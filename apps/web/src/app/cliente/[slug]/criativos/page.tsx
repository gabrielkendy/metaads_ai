import type { Metadata } from "next";
import { ImageIcon } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { StatusPill } from "@/components/glass/status-pill";
import { EmptyState } from "@/components/glass/empty-state";
import { CreativeApprovalButton } from "@/components/cliente/creative-approval";
import { createClient } from "@/lib/supabase/server";
import { requireClientAccess } from "@/lib/auth/helpers";

export const metadata: Metadata = { title: "Criativos" };
export const dynamic = "force-dynamic";

export default async function CriativosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireClientAccess(slug);
  const supabase = await createClient();

  const { data: ads } = await supabase
    .from("ads")
    .select(
      "id, name, status, headline, body, cta_type, image_url, video_url, thumbnail_url, approved_by_client, created_at",
    )
    .eq("client_id", ctx.client.id)
    .order("created_at", { ascending: false });

  const pending = ads?.filter((a) => a.status === "pending_approval") ?? [];
  const active = ads?.filter((a) => a.status === "active") ?? [];
  const others = ads?.filter((a) => !["active", "pending_approval"].includes(a.status)) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-label mb-1">Galeria</p>
        <h1 className="text-h1">Criativos</h1>
        <p className="text-body text-text-secondary mt-1">
          Anúncios rodando e aguardando sua aprovação.
        </p>
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="text-h4 mb-4 flex items-center gap-2">
            Aguardando sua aprovação
            <StatusPill variant="pending">{pending.length}</StatusPill>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pending.map((ad) => (
              <CreativeCard key={ad.id} ad={ad} action />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-h4 mb-4 flex items-center gap-2">
          Ativos <StatusPill variant="active">{active.length}</StatusPill>
        </h2>
        {active.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {active.map((ad) => (
              <CreativeCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ImageIcon}
            title="Sem criativos ativos"
            description="Quando uma campanha começar a rodar, os anúncios aparecem aqui."
          />
        )}
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="text-h4 mb-4">Histórico</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {others.map((ad) => (
              <CreativeCard key={ad.id} ad={ad} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface AdRow {
  id: string;
  name: string;
  status: string;
  headline: string | null;
  body: string | null;
  cta_type: string | null;
  image_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
}

function CreativeCard({ ad, action }: { ad: AdRow; action?: boolean }) {
  return (
    <GlassCard className="overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-bg-elevated">
        {ad.image_url || ad.thumbnail_url ? (
          // biome-ignore lint/a11y/useAltText: creative
          <img
            src={ad.image_url ?? ad.thumbnail_url ?? undefined}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-text-tertiary" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusPill
            variant={
              ad.status === "active"
                ? "active"
                : ad.status === "pending_approval"
                  ? "pending"
                  : ad.status === "paused"
                    ? "paused"
                    : "neutral"
            }
          >
            {ad.status.replace(/_/g, " ")}
          </StatusPill>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-body font-medium truncate">{ad.headline ?? ad.name}</h3>
        {ad.body && (
          <p className="text-body-sm text-text-secondary line-clamp-2 mt-1">{ad.body}</p>
        )}
        {ad.cta_type && (
          <span className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
            CTA: {ad.cta_type.replace(/_/g, " ")}
          </span>
        )}
        {action && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <CreativeApprovalButton adId={ad.id} />
          </div>
        )}
      </div>
    </GlassCard>
  );
}
