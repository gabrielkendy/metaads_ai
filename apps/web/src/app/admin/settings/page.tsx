import type { Metadata } from "next";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { Plug, Bell, Users, Shield, Webhook } from "lucide-react";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Plataforma</p>
        <h1 className="text-h1">Configurações</h1>
        <p className="text-body text-text-secondary mt-1">
          Integrações, notificações e equipe da Agência BASE.
        </p>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-h4 flex items-center gap-2 mb-4">
          <Plug className="w-4 h-4 text-brand-500" />
          Integrações
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <IntegrationRow
            name="Anthropic Claude"
            description="API key configurada via env var ANTHROPIC_API_KEY"
            envVar="ANTHROPIC_API_KEY"
          />
          <IntegrationRow
            name="Meta Marketing API"
            description="App ID e Secret configurados via env vars"
            envVar="META_APP_ID"
          />
          <IntegrationRow
            name="Resend (emails)"
            description="Magic links + notifications"
            envVar="RESEND_API_KEY"
          />
          <IntegrationRow name="Sentry" description="Error tracking" envVar="SENTRY_DSN" />
          <IntegrationRow
            name="PostHog"
            description="Product analytics"
            envVar="NEXT_PUBLIC_POSTHOG_KEY"
          />
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-h4 flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-brand-500" />
          Notificações
        </h2>
        <div className="space-y-3">
          {[
            ["Em-app (toasts + central)", true, true],
            ["Email", true, false],
            ["WhatsApp (futuro)", false, false],
            ["Discord webhook", false, false],
          ].map(([label, supported, enabled]) => (
            <div
              key={label as string}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-glass-light border border-border-default"
            >
              <div>
                <div className="text-body-sm font-medium">{label as string}</div>
                <div className="text-[11px] font-mono text-text-tertiary">
                  {supported ? "Disponível" : "Em breve"}
                </div>
              </div>
              <input
                type="checkbox"
                disabled={!supported}
                defaultChecked={!!enabled}
                className="w-4 h-4 accent-brand-500"
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-h4 flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-brand-500" />
          Equipe
        </h2>
        <p className="text-body-sm text-text-secondary mb-4">
          Multi-admin chega no v1.1. Agora você é o único super_admin.
        </p>
        <GlassButton variant="glass" disabled>
          Convidar membro (em breve)
        </GlassButton>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-h4 flex items-center gap-2 mb-4">
          <Webhook className="w-4 h-4 text-brand-500" />
          Webhooks
        </h2>
        <p className="text-body-sm text-text-secondary">
          URL Meta Webhook (configure no painel do app Meta):
        </p>
        <code className="block mt-2 px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-[11px] font-mono break-all">
          {process.env.NEXT_PUBLIC_APP_URL ?? "https://command.agenciabase.tech"}/api/webhooks/meta
        </code>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-h4 flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-brand-500" />
          Segurança
        </h2>
        <ul className="space-y-2 text-body-sm text-text-secondary">
          <li>✓ TLS 1.3 obrigatório (Vercel + Supabase)</li>
          <li>✓ RLS habilitado em todas as tabelas</li>
          <li>✓ Tokens Meta encriptados no banco (pgcrypto)</li>
          <li>✓ Audit log imutável (append-only)</li>
          <li>✓ JWT com expiração curta (7d)</li>
          <li>✓ Service role key isolada no server</li>
        </ul>
      </GlassCard>
    </div>
  );
}

function IntegrationRow({
  name,
  description,
  envVar,
}: {
  name: string;
  description: string;
  envVar: string;
}) {
  const configured = !!process.env[envVar];
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-glass-light border border-border-default">
      <div className="flex-1 min-w-0">
        <div className="text-body-sm font-medium truncate">{name}</div>
        <div className="text-[11px] font-mono text-text-tertiary truncate">{description}</div>
      </div>
      <span
        className={`text-[10px] font-mono uppercase tracking-[0.18em] px-2 py-1 rounded-full border ${
          configured
            ? "bg-success-bg text-success-text border-success-border"
            : "bg-warning-bg text-warning-text border-warning-border"
        }`}
      >
        {configured ? "conectado" : "pendente"}
      </span>
    </div>
  );
}
