import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Settings, Wallet, Users, Activity, Bot } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";
import { MetricCard } from "@/components/glass/metric-card";
import { ClientForm } from "@/components/admin/client-form";
import { ClientDetailTabs } from "@/components/admin/client-detail-tabs";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatNumber } from "@base-trafego/shared/utils";

export const metadata: Metadata = { title: "Detalhes do cliente" };
export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const [{ data: summary }, { count: campaignsCount }, { count: adsCount }] = await Promise.all([
    supabase.rpc("client_performance_summary", { p_client_id: id }),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("status", "active"),
    supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("status", "active"),
  ]);

  const perf = summary?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <Link href={`/cliente/${client.slug}`} target="_blank">
          <GlassButton variant="glass" size="sm">
            <ExternalLink className="w-4 h-4" />
            Ver dashboard cliente
          </GlassButton>
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-bold text-lg shrink-0"
          style={{
            background: `linear-gradient(135deg, ${client.brand_primary_color}40, ${client.brand_primary_color}10)`,
            color: client.brand_primary_color,
            border: `1px solid ${client.brand_primary_color}40`,
          }}
        >
          {client.logo_url ? (
            // biome-ignore lint/a11y/useAltText: client logo
            <img src={client.logo_url} className="w-full h-full rounded-2xl object-cover" />
          ) : (
            client.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label mb-1">/{client.slug}</p>
          <h1 className="text-h1 truncate">{client.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusPill
              variant={
                client.status === "active"
                  ? "active"
                  : client.status === "onboarding"
                    ? "info"
                    : "neutral"
              }
            >
              {client.status}
            </StatusPill>
            <StatusPill variant="info">{client.plan.toUpperCase()}</StatusPill>
            {client.industry && <StatusPill variant="neutral">{client.industry}</StatusPill>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Investido (7d)"
          value={formatBRL(perf?.spend ?? 0)}
          icon={Wallet}
        />
        <MetricCard
          label="ROAS (7d)"
          value={`${(perf?.roas ?? 0).toFixed(2)}x`}
          icon={Activity}
        />
        <MetricCard
          label="Campanhas ativas"
          value={formatNumber(campaignsCount ?? 0)}
          icon={Users}
        />
        <MetricCard label="Anúncios ativos" value={formatNumber(adsCount ?? 0)} icon={Bot} />
      </div>

      <ClientDetailTabs clientId={id} clientSlug={client.slug}>
        <ClientForm mode="edit" defaultValues={client as unknown as Record<string, unknown>} />
      </ClientDetailTabs>
    </div>
  );
}
