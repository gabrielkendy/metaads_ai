export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{ name: string; description: string; required?: boolean }>;
  generate: (args: Record<string, string>) => Promise<{
    messages: Array<{ role: "user" | "assistant"; content: { type: "text"; text: string } }>;
  }>;
}

export const analiseClientePrompt: PromptDefinition = {
  name: "analise-cliente",
  description: "Análise completa de performance de um cliente — top/bottom criativos + recomendações.",
  arguments: [
    { name: "client_slug", description: "slug do cliente (ex: just-burn)", required: true },
    { name: "period", description: "7d | 14d | 30d", required: false },
  ],
  generate: async ({ client_slug, period = "7d" }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Faça análise completa do cliente "${client_slug}" considerando os últimos ${period}.

Workflow:

1. **Visão geral**
   - Use \`get_client\` com slug="${client_slug}" pra pegar o client_id
   - Use \`get_performance\` com period="last_${period}"
   - Compare com período anterior usando \`compare_periods\`

2. **Top 3 criativos por ROAS**
   - Use \`get_top_performing\` com metric="roas" level="ad" limit=3

3. **Underperformers**
   - Use \`get_underperforming\` com threshold padrão
   - Sugira pause_ad se frequency > 5

4. **Audience breakdown**
   - Use \`get_audience_breakdown\` por idade e dispositivo
   - Identifique segmentos rentáveis

5. **Alertas ativos**
   - Use \`list_alerts\` filtrando por client_id

6. **3-5 recomendações concretas**
   - Sempre justifique com dados específicos
   - Indique se cada uma requer aprovação
   - Estime impacto (orçamento, alcance, ROAS)

Apresente em formato estruturado pra Kendy decidir. Use bullets, números reais, e evite jargão.`,
        },
      },
    ],
  }),
};

export const criarCampanhaPrompt: PromptDefinition = {
  name: "criar-campanha",
  description: "Wizard pra criar nova campanha pra um cliente.",
  arguments: [
    { name: "client_slug", description: "slug do cliente", required: true },
    { name: "objective", description: "OUTCOME_SALES, OUTCOME_LEADS etc", required: true },
    { name: "budget", description: "orçamento mensal em BRL", required: true },
  ],
  generate: async ({ client_slug, objective, budget }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Crie uma nova campanha pra "${client_slug}" com objetivo ${objective} e budget mensal de R$ ${budget}.

Workflow:

1. Use \`get_client\` com slug="${client_slug}" pra confirmar cliente
2. Use \`check_meta_balance\` pra confirmar saldo suficiente
3. Use \`get_client_summary\` pra entender estado atual

4. Confirme estratégia de targeting:
   - Audiência atual está rendendo?
   - Há segmentos não explorados (use get_audience_breakdown)?
   - Vai começar com lookalike, interesse ou audience custom?

5. Calcule daily_budget = ${budget} / 30
6. Use \`create_campaign\` com:
   - reasoning detalhado
   - targeting bem definido
   - status sempre PAUSED

7. Após aprovação, crie ad sets e criativos

⚠️ Se o budget mensal > limite do cliente, vai virar aprovação automática. Avise Kendy.`,
        },
      },
    ],
  }),
};

export const pausarCansadosPrompt: PromptDefinition = {
  name: "pausar-criativos-cansados",
  description: "Identifica e pausa criativos com fadiga (frequency >= 5).",
  arguments: [{ name: "client_slug", description: "slug do cliente", required: true }],
  generate: async ({ client_slug }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Identifique e pause criativos cansados do cliente "${client_slug}".

Workflow:

1. Use \`get_client\` com slug pra pegar client_id
2. Use \`get_underperforming\` com fatigue_frequency=5
3. Pra cada ad cansado:
   - Mostre métricas (frequency, CTR, ROAS)
   - Use \`pause_ad\` com reason claro
4. Sugira variações via \`duplicate_creative\` modificando headline/body
5. Cria alerta consolidado via \`create_alert\` com lista de pausados

Sempre confirme com Kendy antes de pausar mais de 3 ads de uma vez.`,
        },
      },
    ],
  }),
};

export const relatorioSemanalPrompt: PromptDefinition = {
  name: "relatorio-semanal",
  description: "Gera relatório executivo semanal pra um cliente.",
  arguments: [{ name: "client_slug", description: "slug do cliente", required: true }],
  generate: async ({ client_slug }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Gere relatório semanal completo do cliente "${client_slug}".

Workflow:

1. \`get_client\` → pegue client_id
2. \`compare_periods\` last_7d vs last_7d anterior
3. \`get_top_performing\` ROAS top 5
4. \`get_underperforming\` lista
5. \`list_alerts\` ativos
6. \`generate_report\` type="weekly" format="pdf" cobrindo últimos 7 dias

No final, escreva sumário em 3-5 bullets pra cliente.`,
        },
      },
    ],
  }),
};

export const otimizarOrcamentoPrompt: PromptDefinition = {
  name: "otimizar-orcamento",
  description: "Redistribui orçamento entre campanhas baseado em ROAS.",
  arguments: [{ name: "client_slug", description: "slug do cliente", required: true }],
  generate: async ({ client_slug }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Otimize a distribuição de orçamento do cliente "${client_slug}".

Workflow:

1. Liste campanhas ativas (\`list_campaigns\` status=active)
2. Pra cada uma, use \`get_performance\` last_7d
3. Calcule ROAS e identifique outliers (top 20% e bottom 20%)
4. Sugira redistribuição (-20% das piores → +30% das melhores)
5. Cada \`update_campaign\` com mudança > 20% vai virar aprovação automática
6. Apresente um plano com prós/contras antes de executar

Limite total de mudanças por execução: 3 campanhas.`,
        },
      },
    ],
  }),
};

export const allPrompts: PromptDefinition[] = [
  analiseClientePrompt,
  criarCampanhaPrompt,
  pausarCansadosPrompt,
  relatorioSemanalPrompt,
  otimizarOrcamentoPrompt,
];

export const promptMap = new Map(allPrompts.map((p) => [p.name, p]));
