import type { Metadata } from "next";
import { Bot, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { demoClients } from "@/lib/demo/mock-data";

export const metadata: Metadata = { title: "Demo · Agente IA" };

const SYSTEM_PROMPT_DEFAULT = `Você é o agente da Agência BASE responsável pelas campanhas Meta Ads do Just Burn Club.

CONTEXTO:
- Cliente: academia premium em BH, ticket alto, foco em mulheres 25-45
- ROAS meta: 3.5x mínimo
- Tom: motivacional, comunidade, transformação

REGRAS:
- Pause anúncios com frequency > 5
- Crie variações antes de pausar (3 hooks diferentes)
- Sempre justifique mudanças de orçamento > 20%
- Linguagem inclusiva, evite gatilhos sobre peso

KPIs FOCO:
1. ROAS rolling 7d
2. CPA < R$ 35
3. CTR > 2%
4. Frequency < 4`;

export default function DemoAgentConfig() {
  const selected = demoClients[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Inteligência · demo</p>
        <h1 className="text-h1">Agente IA por cliente</h1>
        <p className="text-body text-text-secondary mt-1">
          Customize tom de voz, regras e limites do Claude pra cada cliente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        <GlassCard className="p-3 h-fit">
          <div className="text-label px-2 py-2">Selecionar cliente</div>
          <ul className="space-y-1">
            {demoClients.slice(0, 5).map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm transition-colors ${
                    i === 0
                      ? "bg-glass-medium text-text-primary"
                      : "text-text-tertiary hover:bg-glass-light hover:text-text-primary"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: c.brand_primary_color }}
                  />
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-h4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand-500" /> System prompt customizado
            </h2>
            <textarea
              readOnly
              defaultValue={SYSTEM_PROMPT_DEFAULT}
              rows={14}
              className="w-full px-3 py-2.5 rounded-xl bg-bg-base border border-border-default text-body-sm font-mono"
            />
            <p className="text-[11px] text-text-tertiary">
              Cliente: <strong>{selected.name}</strong>
            </p>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <h2 className="text-h4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" /> Tom & guidelines
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1.5 block">
                <span className="text-label-lg block">Tom de voz</span>
                <select
                  defaultValue="energetico"
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
                  type="number"
                  defaultValue={50}
                  className="w-full h-10 px-3 rounded-xl bg-glass-light border border-border-default text-body-sm"
                />
              </label>
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-3">
            <h2 className="text-h4">Auto-actions habilitadas</h2>
            {[
              ["Pausar criativos com baixo desempenho", true],
              ["Otimizar orçamento entre ad sets", true],
              ["Criar variações de criativos cansados", false],
            ].map(([label, enabled]) => (
              <label
                key={label as string}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-glass-light border border-border-default cursor-pointer hover:bg-glass-medium transition"
              >
                <input
                  type="checkbox"
                  defaultChecked={!!enabled}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-body-sm flex-1">{label as string}</span>
              </label>
            ))}
          </GlassCard>

          <div className="flex justify-end">
            <GlassButton disabled>Salvar config do agente</GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}
