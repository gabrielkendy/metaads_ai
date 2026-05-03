import type { Metadata } from "next";
import { Plug, Bell, Users, Shield, Webhook } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";

export const metadata: Metadata = { title: "Demo · Configurações" };

const INTEGRATIONS: Array<{ name: string; description: string; status: "ok" | "pending" }> = [
  { name: "Anthropic Claude", description: "API key configurada", status: "ok" },
  { name: "Meta Marketing API", description: "App ID + Secret configurados", status: "ok" },
  { name: "Resend (emails)", description: "Magic links + notifications", status: "ok" },
  { name: "Sentry", description: "Error tracking", status: "ok" },
  { name: "PostHog", description: "Product analytics", status: "pending" },
];

export default function DemoSettings() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Plataforma · demo</p>
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
          {INTEGRATIONS.map((i) => (
            <div
              key={i.name}
              className="flex items-center gap-3 p-4 rounded-xl bg-glass-light border border-border-default"
            >
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-medium truncate">{i.name}</div>
                <div className="text-[11px] font-mono text-text-tertiary truncate">
                  {i.description}
                </div>
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.18em] px-2 py-1 rounded-full border ${
                  i.status === "ok"
                    ? "bg-success-bg text-success-text border-success-border"
                    : "bg-warning-bg text-warning-text border-warning-border"
                }`}
              >
                {i.status === "ok" ? "conectado" : "pendente"}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-h4 flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-brand-500" />
          Notificações
        </h2>
        <div className="space-y-3">
          {[
            ["Em-app (toasts + central)", true],
            ["Email", true],
            ["WhatsApp (futuro)", false],
            ["Discord webhook", false],
          ].map(([label, enabled]) => (
            <div
              key={label as string}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-glass-light border border-border-default"
            >
              <div>
                <div className="text-body-sm font-medium">{label as string}</div>
              </div>
              <input
                type="checkbox"
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
          Webhooks Meta
        </h2>
        <p className="text-body-sm text-text-secondary">
          URL Meta Webhook (configure no painel do app Meta):
        </p>
        <code className="block mt-2 px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-[11px] font-mono break-all">
          https://command.agenciabase.tech/api/webhooks/meta
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
