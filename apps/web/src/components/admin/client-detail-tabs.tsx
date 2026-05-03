"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useState, type ReactNode } from "react";
import { GlassCard } from "@/components/glass/glass-card";

const TAB_ITEMS = [
  { id: "overview", label: "Visão" },
  { id: "settings", label: "Configurações" },
  { id: "meta", label: "Contas Meta" },
  { id: "users", label: "Usuários" },
  { id: "agent", label: "Agente IA" },
  { id: "logs", label: "Logs" },
] as const;

export function ClientDetailTabs({
  clientId,
  clientSlug,
  children,
}: {
  clientId: string;
  clientSlug: string;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<string>("settings");

  return (
    <Tabs.Root value={tab} onValueChange={setTab}>
      <Tabs.List className="flex gap-1 p-1 rounded-xl bg-glass-light border border-border-default w-fit overflow-x-auto no-scrollbar">
        {TAB_ITEMS.map((t) => (
          <Tabs.Trigger
            key={t.id}
            value={t.id}
            className="px-4 py-2 rounded-lg text-body-sm text-text-tertiary hover:text-text-primary data-[state=active]:bg-glass-medium data-[state=active]:text-text-primary transition-colors whitespace-nowrap"
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="overview" className="mt-6">
        <GlassCard className="p-8 text-center text-text-secondary">
          <p className="text-body-sm">
            Resumo executivo está disponível no dashboard do cliente em{" "}
            <a
              href={`/cliente/${clientSlug}`}
              target="_blank"
              rel="noopener"
              className="text-text-primary underline-offset-4 hover:underline"
            >
              /cliente/{clientSlug}
            </a>
            .
          </p>
        </GlassCard>
      </Tabs.Content>

      <Tabs.Content value="settings" className="mt-6">
        <GlassCard className="p-8">{children}</GlassCard>
      </Tabs.Content>

      <Tabs.Content value="meta" className="mt-6">
        <MetaAccountsPanel clientId={clientId} />
      </Tabs.Content>

      <Tabs.Content value="users" className="mt-6">
        <ClientUsersPanel clientId={clientId} />
      </Tabs.Content>

      <Tabs.Content value="agent" className="mt-6">
        <GlassCard className="p-8 text-center text-text-secondary">
          <p className="text-body-sm">
            Configuração do agente disponível em <a className="underline" href="/admin/agent-config">/admin/agent-config</a>.
          </p>
        </GlassCard>
      </Tabs.Content>

      <Tabs.Content value="logs" className="mt-6">
        <GlassCard className="p-8 text-center text-text-secondary">
          <p className="text-body-sm">
            Logs detalhados em <a className="underline" href="/admin/audit">/admin/audit</a>.
          </p>
        </GlassCard>
      </Tabs.Content>
    </Tabs.Root>
  );
}

function MetaAccountsPanel({ clientId }: { clientId: string }) {
  return (
    <GlassCard className="p-8 text-center">
      <h3 className="text-h4 mb-2">Conectar conta Meta Business</h3>
      <p className="text-body-sm text-text-secondary mb-5">
        Vincule a Conta de Anúncios Meta deste cliente pra Claude operar.
      </p>
      <a
        href={`/api/auth/meta/start?client_id=${clientId}`}
        className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-brand-500 text-white text-body font-medium hover:bg-brand-600 transition"
      >
        Conectar Meta Business
      </a>
      <p className="text-[11px] text-text-tertiary mt-3">
        OAuth oficial do Meta — só funciona após META_APP_ID estar configurado nas env vars.
      </p>
    </GlassCard>
  );
}

function ClientUsersPanel({ clientId }: { clientId: string }) {
  return (
    <GlassCard className="p-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-h4">Usuários vinculados</h3>
      </div>
      <form className="flex gap-3 mb-6" action="/api/admin/clients/invite" method="post">
        <input type="hidden" name="client_id" value={clientId} />
        <input
          type="email"
          name="email"
          required
          placeholder="email@cliente.com"
          className="flex-1 h-10 px-3 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 outline-none text-body-sm"
        />
        <select
          name="role"
          className="h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm"
        >
          <option value="client_admin">Cliente Admin</option>
          <option value="client_viewer">Cliente Viewer</option>
        </select>
        <button
          type="submit"
          className="h-10 px-5 rounded-xl bg-brand-500 text-white text-body-sm font-medium hover:bg-brand-600 transition"
        >
          Convidar
        </button>
      </form>
      <p className="text-[11px] text-text-tertiary">
        Usuários convidados recebem magic link por email assim que Resend estiver configurado.
      </p>
    </GlassCard>
  );
}
