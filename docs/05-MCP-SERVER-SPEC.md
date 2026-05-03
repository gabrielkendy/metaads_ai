# 🤖 MCP SERVER SPEC — BASE TRÁFEGO COMMAND

> Servidor MCP que conecta Claude Desktop à plataforma BASE
> Versão 1.0 · Implementação em TypeScript

---

## 1. VISÃO GERAL

```
PROPÓSITO:
Permitir que Claude Desktop opere a plataforma BASE Tráfego Command,
executando ações em Meta Ads e refletindo TUDO em tempo real
no Supabase, com auditoria completa.

FLUXO:
[Kendy] → [Claude Desktop] → [MCP Server] → [Meta API + Supabase]
                                              ↓
                                       [Realtime] → [Dashboards]
```

---

## 2. ARQUITETURA DO MCP SERVER

```
mcp-server/
├── src/
│   ├── index.ts                    ← Entry point + servidor
│   ├── config/
│   │   ├── env.ts                  ← Validação env vars (Zod)
│   │   └── meta.ts                 ← Config Meta API
│   ├── lib/
│   │   ├── supabase.ts             ← Client com service role
│   │   ├── meta.ts                 ← Meta SDK wrapper
│   │   ├── logger.ts               ← Winston structured logs
│   │   └── audit.ts                ← Helper pra logs
│   ├── tools/
│   │   ├── clients.ts              ← list, get, create, update
│   │   ├── campaigns.ts            ← CRUD + actions
│   │   ├── ad-sets.ts
│   │   ├── ads.ts                  ← criativos
│   │   ├── creatives.ts
│   │   ├── performance.ts          ← analytics
│   │   ├── alerts.ts
│   │   ├── approvals.ts
│   │   ├── reports.ts
│   │   └── index.ts                ← registro de tools
│   ├── resources/
│   │   ├── clients.ts
│   │   ├── alerts.ts
│   │   ├── approvals.ts
│   │   └── index.ts
│   ├── prompts/
│   │   ├── analise-cliente.ts
│   │   ├── criar-campanha.ts
│   │   ├── relatorio-semanal.ts
│   │   └── index.ts
│   └── schemas/
│       ├── client.ts               ← Zod schemas
│       ├── campaign.ts
│       └── ...
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. CONFIGURAÇÃO DE AMBIENTE

### 3.1 .env.local (MCP server)

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx       # PERIGOSO - acesso total
SUPABASE_ANON_KEY=eyJxxx

# Meta Marketing API
META_APP_ID=123456789
META_APP_SECRET=xxxxxxxx
META_API_VERSION=v22.0

# Anthropic (pra usar Claude SDK em alguns tools)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Logs
LOG_LEVEL=info
LOG_PATH=./logs/mcp-server.log

# Plataforma (pra webhooks reverso)
PLATFORM_URL=https://command.agenciabase.tech
PLATFORM_WEBHOOK_SECRET=xxx
```

### 3.2 Schema de validação env

```typescript
// src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  
  // Meta
  META_APP_ID: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  META_API_VERSION: z.string().default("v22.0"),
  
  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Logs
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  LOG_PATH: z.string().default("./logs/mcp-server.log"),
  
  // Platform
  PLATFORM_URL: z.string().url(),
  PLATFORM_WEBHOOK_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

---

## 4. ESTRUTURA DOS TOOLS

### 4.1 Padrão de Tool

```typescript
// src/tools/campaigns.ts
import { z } from "zod";
import { Tool } from "@modelcontextprotocol/sdk";
import { supabase } from "../lib/supabase";
import { metaApi } from "../lib/meta";
import { logger } from "../lib/logger";
import { auditLog } from "../lib/audit";

// Schema de input
const createCampaignSchema = z.object({
  client_id: z.string().uuid().describe("UUID do cliente na plataforma BASE"),
  name: z.string().min(3).max(100).describe("Nome da campanha"),
  objective: z.enum([
    "CONVERSIONS",
    "LEAD_GENERATION",
    "TRAFFIC",
    "REACH",
    "BRAND_AWARENESS",
    "VIDEO_VIEWS",
    "MESSAGES",
  ]).describe("Objetivo da campanha"),
  daily_budget: z.number().positive().describe("Orçamento diário em BRL"),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  targeting: z.object({
    geo_locations: z.array(z.string()).optional(),
    age_min: z.number().min(13).max(65).optional(),
    age_max: z.number().min(13).max(65).optional(),
    genders: z.array(z.enum(["male", "female"])).optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
  reasoning: z.string().describe("Por que está criando essa campanha. Importante pra auditoria."),
});

export const createCampaignTool: Tool = {
  name: "create_campaign",
  description: `Cria uma nova campanha de tráfego pago no Meta Ads para um cliente.
  
  IMPORTANTE:
  - Verifica primeiro o saldo do cliente via get_client
  - Para campanhas com orçamento > R$ 1.000/dia, requer aprovação
  - Sempre passe um reasoning explicando POR QUE está criando
  - A campanha é criada PAUSED por padrão pra evitar gastos não-intencionais
  
  Retorna: { campaign_id, meta_campaign_id, status, requires_approval }`,
  
  inputSchema: {
    type: "object",
    properties: createCampaignSchema.shape,
    required: ["client_id", "name", "objective", "daily_budget", "reasoning"],
  },
  
  handler: async (input) => {
    const params = createCampaignSchema.parse(input);
    
    logger.info("create_campaign called", { client_id: params.client_id });
    
    // 1. Valida cliente existe
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*, agent_configs(*)")
      .eq("id", params.client_id)
      .single();
    
    if (clientError || !client) {
      throw new Error(`Cliente não encontrado: ${params.client_id}`);
    }
    
    // 2. Pega meta_account primária
    const { data: metaAccount } = await supabase
      .from("meta_accounts")
      .select("*")
      .eq("client_id", params.client_id)
      .eq("is_primary", true)
      .eq("is_active", true)
      .single();
    
    if (!metaAccount) {
      throw new Error("Cliente não tem conta Meta configurada");
    }
    
    // 3. Decide se requer aprovação
    const monthlyBudget = params.daily_budget * 30;
    const requiresApproval = monthlyBudget > (client.requires_approval_above ?? 1000);
    
    // 4. Cria registro de claude_action
    const { data: action } = await supabase
      .from("claude_actions")
      .insert({
        client_id: params.client_id,
        action_type: "create_campaign",
        tool_name: "create_campaign",
        input_payload: params,
        reasoning: params.reasoning,
        status: requiresApproval ? "pending" : "in_progress",
      })
      .select()
      .single();
    
    // 5. Se requer aprovação → cria approval e retorna
    if (requiresApproval) {
      const { data: approval } = await supabase
        .from("approvals")
        .insert({
          client_id: params.client_id,
          type: "create_campaign",
          title: `Criar campanha "${params.name}"`,
          description: `Orçamento mensal estimado: R$ ${monthlyBudget.toFixed(2)}`,
          payload: params,
          estimated_impact: {
            monthly_budget: monthlyBudget,
            objective: params.objective,
          },
          claude_reasoning: params.reasoning,
          claude_action_id: action.id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      
      return {
        success: true,
        requires_approval: true,
        approval_id: approval.id,
        message: `Campanha criada como pendente de aprovação. Kendy precisa aprovar via dashboard.`,
      };
    }
    
    // 6. Cria campanha no Meta API
    let metaCampaign;
    try {
      metaCampaign = await metaApi.createCampaign({
        accountId: metaAccount.meta_account_id,
        accessToken: await decryptToken(metaAccount.access_token_encrypted),
        name: params.name,
        objective: params.objective,
        dailyBudget: params.daily_budget * 100, // Meta usa centavos
        status: "PAUSED", // Sempre criar pausado
      });
    } catch (metaError) {
      // Atualiza ação com erro
      await supabase
        .from("claude_actions")
        .update({
          status: "failed",
          error_message: metaError.message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", action.id);
      
      throw new Error(`Erro Meta API: ${metaError.message}`);
    }
    
    // 7. Cria registro local
    const { data: campaign } = await supabase
      .from("campaigns")
      .insert({
        client_id: params.client_id,
        meta_account_id: metaAccount.id,
        meta_campaign_id: metaCampaign.id,
        name: params.name,
        objective: params.objective,
        daily_budget: params.daily_budget,
        status: "paused",
        targeting: params.targeting ?? {},
        start_date: params.start_date,
        end_date: params.end_date,
        created_by_claude: true,
      })
      .select()
      .single();
    
    // 8. Atualiza claude_action como sucesso
    await supabase
      .from("claude_actions")
      .update({
        status: "success",
        output_payload: { campaign_id: campaign.id, meta_campaign_id: metaCampaign.id },
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(action.created_at).getTime(),
      })
      .eq("id", action.id);
    
    // 9. Audit log
    await auditLog({
      actorType: "claude",
      action: "campaign.created",
      resourceType: "campaign",
      resourceId: campaign.id,
      clientId: params.client_id,
      afterData: campaign,
    });
    
    return {
      success: true,
      requires_approval: false,
      campaign_id: campaign.id,
      meta_campaign_id: metaCampaign.id,
      status: "paused",
      message: `Campanha criada com sucesso. Status: PAUSED (precisa ativar manualmente após criar criativos).`,
    };
  },
};
```

---

## 5. LISTA COMPLETA DE TOOLS (35+)

### 5.1 Clientes (5 tools)

```typescript
list_clients              // Lista todos clientes
get_client                // Detalhes de um cliente
create_client             // Cria cliente novo (admin only)
update_client_settings    // Atualiza config de cliente
get_client_summary        // Resumo executivo
```

### 5.2 Meta Accounts (3 tools)

```typescript
get_meta_accounts         // Lista contas Meta de um cliente
sync_meta_account         // Força sync com Meta API
check_meta_balance        // Verifica saldo atual
```

### 5.3 Campanhas (7 tools)

```typescript
list_campaigns            // Lista campanhas de um cliente
get_campaign              // Detalhes de campanha
create_campaign           // Cria nova (com aprovação se > limite)
update_campaign           // Edita campanha
pause_campaign            // Pausa
resume_campaign           // Retoma
delete_campaign           // Arquiva (sempre requer aprovação)
```

### 5.4 Ad Sets (4 tools)

```typescript
list_ad_sets              // Lista ad sets
create_ad_set             // Cria ad set
update_ad_set             // Edita
get_ad_set_performance    // Performance específica
```

### 5.5 Ads/Criativos (6 tools)

```typescript
list_ads                  // Lista ads
create_creative           // Gera novo criativo
duplicate_creative        // Duplica com modificações
pause_ad                  // Pausa anúncio
get_ad_preview            // Preview do criativo
upload_creative_asset     // Upload de imagem/vídeo
```

### 5.6 Performance (5 tools)

```typescript
get_performance              // Métricas por período
get_top_performing           // Top criativos/campanhas
get_underperforming          // Que precisam atenção
compare_periods              // Comparação de períodos
get_audience_breakdown       // Performance por audiência
```

### 5.7 Alertas (3 tools)

```typescript
list_alerts               // Lista alertas ativos
create_alert              // Cria alerta manual
resolve_alert             // Resolve alerta
```

### 5.8 Aprovações (2 tools)

```typescript
list_pending_approvals    // Aprovações pendentes
get_approval              // Detalhes de aprovação
```

### 5.9 Relatórios (2 tools)

```typescript
generate_report           // Gera relatório PDF/CSV
list_reports              // Histórico de relatórios
```

---

## 6. RESOURCES EXPOSTOS

```typescript
// Resources que Claude pode ler como contexto

base://clients
└─ JSON com lista completa de clientes ativos

base://client/{id}
└─ JSON com tudo do cliente: dados, plano, contas Meta

base://client/{id}/campaigns
└─ JSON com campanhas ativas + métricas resumidas

base://client/{id}/performance/last-7-days
└─ Performance dos últimos 7 dias

base://client/{id}/performance/last-30-days
└─ Performance dos últimos 30 dias

base://alerts/active
└─ Alertas ativos de todos clientes

base://approvals/pending
└─ Aprovações pendentes

base://config/agent/{client_id}
└─ Configuração de agente IA pra um cliente

base://templates/creatives
└─ Templates de criativos disponíveis
```

### 6.1 Implementação de Resource

```typescript
// src/resources/clients.ts
export const clientsListResource = {
  uri: "base://clients",
  name: "Lista de Clientes",
  description: "Lista completa de clientes ativos da Agência BASE",
  mimeType: "application/json",
  
  async read() {
    const { data: clients } = await supabase
      .from("clients")
      .select(`
        id,
        slug,
        name,
        status,
        plan,
        industry,
        monthly_budget_limit,
        meta_accounts(meta_account_id, current_balance),
        campaigns(count)
      `)
      .eq("status", "active")
      .order("name");
    
    return {
      contents: [{
        uri: "base://clients",
        mimeType: "application/json",
        text: JSON.stringify(clients, null, 2),
      }],
    };
  },
};
```

---

## 7. PROMPTS PRÉ-DEFINIDOS

```typescript
// src/prompts/analise-cliente.ts
export const analiseClientePrompt = {
  name: "analise-cliente",
  description: "Análise completa de performance de um cliente específico",
  arguments: [
    {
      name: "client_slug",
      description: "Slug do cliente (ex: 'just-burn')",
      required: true,
    },
    {
      name: "period",
      description: "Período: 7d, 30d, 90d",
      required: false,
    },
  ],
  
  async generate({ client_slug, period = "7d" }) {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Faça uma análise completa do cliente "${client_slug}" considerando:

1. PERFORMANCE GERAL (período: ${period}):
   - Use a tool get_performance pra pegar métricas
   - Compare com período anterior
   - Identifique tendências

2. CAMPANHAS ATIVAS:
   - Use list_campaigns
   - Identifique top 3 e bottom 3 por ROAS
   - Analise CTR, CPC, CPM, frequency

3. CRIATIVOS:
   - Use list_ads
   - Quais estão dando fadiga? (frequency > 4)
   - Quais precisam ser pausados?
   - Quais merecem mais investimento?

4. ALERTAS ATIVOS:
   - Use list_alerts
   - Priorize por severidade

5. RECOMENDAÇÕES:
   - 3-5 ações concretas que você sugere
   - Justifique cada uma com dados
   - Indique quais requerem aprovação

Apresente em formato estruturado e claro pra o Kendy decidir.`,
          },
        },
      ],
    };
  },
};
```

---

## 8. CONFIGURAÇÃO NO CLAUDE DESKTOP

### 8.1 claude_desktop_config.json

```json
{
  "mcpServers": {
    "base-trafego": {
      "command": "node",
      "args": [
        "/caminho/absoluto/para/mcp-server/dist/index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJxxx",
        "META_APP_ID": "123",
        "META_APP_SECRET": "xxx",
        "META_API_VERSION": "v22.0",
        "ANTHROPIC_API_KEY": "sk-ant-xxx",
        "PLATFORM_URL": "https://command.agenciabase.tech",
        "PLATFORM_WEBHOOK_SECRET": "xxx",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 8.2 Localização do config

```
macOS:    ~/Library/Application Support/Claude/claude_desktop_config.json
Windows:  %APPDATA%\Claude\claude_desktop_config.json
Linux:    ~/.config/Claude/claude_desktop_config.json
```

---

## 9. SEGURANÇA DO MCP

### 9.1 Princípios

```
✅ Service role key NUNCA é exposto fora do MCP server
✅ Tokens Meta encriptados no banco (pgp_sym_encrypt)
✅ Rate limiting interno (max 100 calls/min Meta API)
✅ Validação Zod estrita em TODOS os inputs
✅ Audit log obrigatório em ações destrutivas
✅ Aprovação obrigatória pra ações high-impact
✅ Logs estruturados pra detectar abuse
✅ Timeout de 30s por tool call
```

### 9.2 Limites Configuráveis

```typescript
// src/config/limits.ts
export const limits = {
  // Por cliente
  maxDailyActionsPerClient: 50,
  maxBudgetChangePercent: 20,
  approvalRequiredAbove: 1000, // BRL/mês
  
  // Globais
  maxConcurrentTools: 5,
  toolTimeoutMs: 30000,
  metaApiRateLimit: 100, // por minuto
  
  // Auto-pause
  autoPaseOnFatigue: true,
  fatigueFrequencyThreshold: 5,
  
  // Auto-alert
  ctrDropThreshold: 0.4, // 40% queda
  cpmIncreaseThreshold: 0.5, // 50% aumento
  budgetExhaustedThreshold: 0.8, // 80% gasto
};
```

---

## 10. TRATAMENTO DE ERROS

### 10.1 Hierarquia de Erros

```typescript
// src/lib/errors.ts
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: "low" | "medium" | "high" | "critical",
    public retryable: boolean = false,
  ) {
    super(message);
  }
}

export class ValidationError extends MCPError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", "low", false);
  }
}

export class MetaAPIError extends MCPError {
  constructor(message: string, public metaErrorCode?: number) {
    super(message, "META_API_ERROR", "medium", true);
  }
}

export class ApprovalRequiredError extends MCPError {
  constructor(public approvalId: string) {
    super(
      "Esta ação requer aprovação",
      "APPROVAL_REQUIRED",
      "low",
      false
    );
  }
}

export class RateLimitError extends MCPError {
  constructor(public retryAfter: number) {
    super(
      `Rate limit. Retry after ${retryAfter}s`,
      "RATE_LIMIT",
      "medium",
      true
    );
  }
}
```

### 10.2 Retry Logic

```typescript
// src/lib/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; backoffMs?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, backoffMs = 1000 } = options;
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (error instanceof MCPError && !error.retryable) {
        throw error;
      }
      
      if (attempt < maxAttempts) {
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError;
}
```

---

## 11. LOGS ESTRUTURADOS

```typescript
// src/lib/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "base-trafego-mcp" },
  transports: [
    new winston.transports.File({ 
      filename: env.LOG_PATH,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// Helper pra logar tool calls
export function logToolCall(toolName: string, input: any, result: any) {
  logger.info("tool_call", {
    tool: toolName,
    input: JSON.stringify(input),
    success: !!result,
    duration_ms: result?.duration_ms,
  });
}
```

---

## 12. TESTES

### 12.1 Estratégia

```
UNIT (Vitest)
├── Schemas Zod (input validation)
├── Helpers (audit, retry, logger)
└── Tool handlers (com Supabase mock)

INTEGRATION
├── Tools chamando Supabase real (test DB)
└── Meta API com sandbox

E2E (manual)
├── Claude Desktop conectando
├── Executar 5 tools básicos
└── Verificar refletir em dashboard
```

---

## 13. DEPLOYMENT DO MCP SERVER

### 13.1 Local (recomendado pra dev)

```bash
cd mcp-server
bun install
bun run build
# Configurar Claude Desktop com path absoluto
```

### 13.2 Distribuição (futuro)

```
Opção A: NPM Package
└── npm install -g @agenciabase/trafego-mcp
└── Cliente roda local

Opção B: Cloud (mais complexo)
└── Deploy em VPS / Cloudflare Workers
└── Claude Desktop conecta via SSE/HTTP
└── Requer auth adicional
```

---

## 14. EXEMPLO DE INTERAÇÃO REAL

```
KENDY (Claude Desktop):
"Claude, faz uma análise do Just Burn das últimas 2 semanas e me 
sugere otimizações"

CLAUDE:
[chama get_client com slug "just-burn"]
[chama get_performance com 14d]
[chama list_campaigns]
[chama list_ads]
[chama list_alerts]

"Análise do Just Burn — últimas 2 semanas:

📊 PERFORMANCE GERAL
- Investimento: R$ 4.847 (+12% vs semana anterior)
- Impressões: 234k (-8%)  
- Cliques: 4.2k (CTR 1.8%)
- Conversões: 67 leads
- ROAS: 3.4x (queda de 0.3x)

🟢 DESTAQUES
- Campanha 'Captação Mulheres 30+' performa 85% acima da média
- Criativo 'Antes e Depois Maria' tem CTR 3.2%

🟡 ATENÇÃO
- Criativo 'Lifestyle Pilates 04' com fadiga (frequency 5.2)
- CPM aumentou 22% nos últimos 3 dias
- 1 alerta ativo: budget burning rate alto

💡 RECOMENDAÇÕES
1. Pausar 'Lifestyle Pilates 04' e criar 2 variações novas
   (não requer aprovação, posso executar)
   
2. Aumentar daily budget da campanha 'Captação Mulheres 30+' em 30%
   (R$ 200 → R$ 260) — REQUER APROVAÇÃO
   
3. Pausar campanhas com ROAS < 2x no horário 22h-06h
   (3 campanhas afetadas, economia estimada R$ 80/dia)

Posso executar as ações 1 e 3 agora? A ação 2 vou enviar pra sua 
fila de aprovações."

KENDY: "Pode executar 1 e 3, e manda 2 pra aprovação"

CLAUDE:
[chama pause_ad com 'Lifestyle Pilates 04']
[chama duplicate_creative 2x com modifications]
[chama list_campaigns com filter ROAS<2]
[chama update_campaign x3 com schedule_adjust]
[chama request_approval com action 2]

"Executado! ✅
- Pausei o criativo Lifestyle Pilates 04
- Criei 2 novas variações com ângulos diferentes (aguardando aprovação 
  de criativo do cliente)
- Pausei 3 campanhas no horário noturno

Aprovação enviada pra dashboard: aumento de budget da Captação 
Mulheres 30+. Você pode aprovar em command.agenciabase.tech/admin/approvals"
```

---

## 15. ROADMAP DO MCP SERVER

```
v1.0 (MVP)
└── 35 tools básicos
└── Resources principais
└── 5 prompts pré-definidos

v1.1
└── Webhook receiver (Meta → MCP)
└── Auto-sync periódico
└── Relatórios PDF estilizados

v1.2
└── Multi-platform (Google Ads, TikTok)
└── A/B testing automation
└── Predictive analytics (ML)

v2.0
└── Cloud deployment opcional
└── Multi-tenant MCP
└── White-label pra outras agências
```

---

> **Próximo:** `06-SETUP-INICIAL.md` (passo a passo de criação do projeto)
