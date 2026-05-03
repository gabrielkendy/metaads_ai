import type { Metadata } from "next";
import { Bot, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { EmptyState } from "@/components/glass/empty-state";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Agente IA" };
export const dynamic = "force-dynamic";

export default async function AgentConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, slug, brand_primary_color")
    .eq("status", "active");
  const selected = sp.client ?? clients?.[0]?.id;
  const { data: config } = selected
    ? await supabase.from("agent_configs").select("*").eq("client_id", selected).single()
    : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Inteligência</p>
        <h1 className="text-h1">Agente IA por cliente</h1>
        <p className="text-body text-text-secondary mt-1">
          Customize tom de voz, regras e limites do Claude pra cada cliente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        <GlassCard className="p-3 h-fit">
          <div className="text-label px-2 py-2">Selecionar cliente</div>
          <ul className="space-y-1">
            {(clients ?? []).map((c) => (
              <li key={c.id}>
                <a
                  href={`/admin/agent-config?client=${c.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm transition-colors ${
                    selected === c.id
                      ? "bg-glass-medium text-text-primary"
                      : "text-text-tertiary hover:bg-glass-light hover:text-text-primary"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: c.brand_primary_color }}
                  />
                  {c.name}
                </a>
              </li>
            ))}
          </ul>
        </GlassCard>

        {config ? (
          <form
            action="/api/admin/agent-config"
            method="post"
            className="space-y-5"
          >
            <input type="hidden" name="client_id" value={selected as string} />

            <GlassCard className="p-6 space-y-4">
              <h2 className="text-h4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand-500" /> System prompt customizado
              </h2>
              <textarea
                name="system_prompt"
                rows={8}
                defaultValue={config.system_prompt ?? ""}
                placeholder="Você é o agente da Agência BASE responsável pelas campanhas do cliente X…"
                className="w-full px-3 py-2.5 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 outline-none text-body-sm font-mono resize-y"
              />
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <h2 className="text-h4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" /> Tom & guidelines
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-1.5 block">
                  <span className="text-label-lg block">Tom de voz</span>
                  <select
                    name="tone_of_voice"
                    defaultValue={config.tone_of_voice}
                    className="w-full h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm"
                  >
                    <option value="profissional">Profissional</option>
                    <option value="casual">Casual</option>
                    <option value="amigavel">Amigável</option>
                    <option value="energetico">Energético</option>
                    <option value="luxuoso">Luxuoso</option>
                  </select>
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-label-lg block">Máx ações Claude/dia</span>
                  <input
                    name="max_daily_actions"
                    type="number"
                    defaultValue={config.max_daily_actions}
                    className="w-full h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm"
                  />
                </label>
              </div>
              <label className="space-y-1.5 block">
                <span className="text-label-lg block">Brand guidelines</span>
                <textarea
                  name="brand_guidelines"
                  rows={4}
                  defaultValue={config.brand_guidelines ?? ""}
                  placeholder="Regras de copy, palavras-chave preferidas, evitar gatilhos negativos…"
                  className="w-full px-3 py-2.5 rounded-xl bg-glass-light border border-border-default text-body-sm resize-y"
                />
              </label>
            </GlassCard>

            <GlassCard className="p-6 space-y-3">
              <h2 className="text-h4">Auto-actions</h2>
              {[
                ["auto_pause_underperforming", "Pausar criativos com baixo desempenho"],
                ["auto_optimize_budget", "Otimizar orçamento entre ad sets"],
                ["auto_create_variations", "Criar variações de criativos cansados"],
              ].map(([name, label]) => (
                <label
                  key={name}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-glass-light border border-border-default cursor-pointer hover:bg-glass-medium transition"
                >
                  <input
                    type="checkbox"
                    name={name as string}
                    defaultChecked={(config as never)[name as string]}
                    className="w-4 h-4 accent-brand-500"
                  />
                  <span className="text-body-sm flex-1">{label}</span>
                </label>
              ))}
            </GlassCard>

            <div className="flex justify-end">
              <GlassButton type="submit">Salvar config do agente</GlassButton>
            </div>
          </form>
        ) : (
          <EmptyState
            icon={Bot}
            title="Selecione um cliente"
            description="Escolha um cliente na lista pra configurar seu agente IA."
          />
        )}
      </div>
    </div>
  );
}
