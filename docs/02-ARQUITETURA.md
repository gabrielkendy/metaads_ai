# 🏗️ ARQUITETURA TÉCNICA — BASE TRÁFEGO COMMAND

> Documento de arquitetura técnica detalhada
> Status: APROVADO · Versão 1.0

---

## 1. VISÃO ARQUITETURAL MACRO

```
                          ┌─────────────────────────────────┐
                          │     CLAUDE DESKTOP APP          │
                          │  (Kendy opera localmente)       │
                          └────────────┬────────────────────┘
                                       │ stdio
                                       │ MCP Protocol
                                       ▼
                          ┌─────────────────────────────────┐
                          │   MCP SERVER (TypeScript)       │
                          │   @base/trafego-mcp             │
                          │                                 │
                          │   - Tools (35+)                 │
                          │   - Resources                   │
                          │   - Prompts                     │
                          └──────┬─────────────┬────────────┘
                                 │             │
                  ┌──────────────┘             └──────────────┐
                  │                                            │
                  ▼                                            ▼
        ┌──────────────────┐                      ┌─────────────────────┐
        │   META MARKETING │                      │     SUPABASE        │
        │    API v22       │                      │  (Postgres + Auth   │
        │                  │                      │   + Realtime +      │
        │  - Campaigns     │                      │   Storage + Edge)   │
        │  - Ad Sets       │                      │                     │
        │  - Ads           │                      │                     │
        │  - Insights      │                      │                     │
        │  - Creatives     │                      │                     │
        └──────────────────┘                      └─────────┬───────────┘
                                                            │
                                                            │ Realtime channel
                                                            ▼
                                          ┌──────────────────────────────┐
                                          │      NEXT.JS 15 APP          │
                                          │  command.agenciabase.tech    │
                                          │                              │
                                          │  ┌────────────────────────┐  │
                                          │  │ /admin                 │  │
                                          │  │  ├── /dashboard        │  │
                                          │  │  ├── /clients          │  │
                                          │  │  ├── /approvals        │  │
                                          │  │  ├── /audit            │  │
                                          │  │  ├── /agent-config     │  │
                                          │  │  ├── /reports          │  │
                                          │  │  └── /settings         │  │
                                          │  ├────────────────────────┤  │
                                          │  │ /cliente/[slug]        │  │
                                          │  │  ├── /                 │  │
                                          │  │  ├── /criativos        │  │
                                          │  │  ├── /historico        │  │
                                          │  │  ├── /investimento     │  │
                                          │  │  └── /mensagens        │  │
                                          │  └────────────────────────┘  │
                                          └──────────────────────────────┘
                                                       ▲
                                                       │ HTTPS
                                          ┌────────────┴────────────┐
                                          ▼                          ▼
                                    👤 KENDY                  🏢 CLIENTE
                                    (admin)                   (white-label)
```

---

## 2. PILHA TECNOLÓGICA DETALHADA

### 2.1 Frontend (Next.js 15)

```typescript
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^4.0.0",
    
    // UI Components
    "@radix-ui/react-*": "latest",
    "shadcn-ui": "latest",
    "framer-motion": "^11.0.0",
    "lucide-react": "latest",
    "sonner": "latest",
    
    // Forms & Validation
    "react-hook-form": "^7.50.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.3.0",
    
    // Data
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "@tanstack/react-query": "^5.0.0",
    
    // Charts
    "recharts": "^2.12.0",
    
    // URL State
    "nuqs": "^2.0.0",
    
    // Utils
    "date-fns": "^3.6.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "class-variance-authority": "^0.7.0"
  }
}
```

### 2.2 Backend (Supabase)

```
PostgreSQL 15.x
├── Tabelas: 18 tabelas principais
├── Functions: 12 stored procedures
├── Triggers: 8 triggers automáticos
├── Policies: 35+ RLS policies
└── Indexes: 25+ índices estratégicos

Auth
├── Providers: Magic Link, Google, Email/Password
├── Custom claims via JWT
└── Session timeout: 7 dias

Realtime
├── Channels: alerts, approvals, actions, performance
└── Postgres Changes via subscription

Storage
├── Buckets: creatives, reports, avatars
└── Policies por user role

Edge Functions (Deno)
├── meta-webhook-receiver
├── generate-report
├── send-notification
├── meta-sync-cron
└── claude-action-logger
```

### 2.3 MCP Server (TypeScript Custom)

```typescript
// Stack do MCP Server
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "facebook-nodejs-business-sdk": "^22.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "zod": "^3.23.0",
    "winston": "^3.11.0"  // logs estruturados
  }
}
```

### 2.4 Infraestrutura

```
Vercel
├── Next.js App (region: gru1 - São Paulo)
├── Edge Functions
├── Cron Jobs
├── Analytics
└── Environment Variables

Supabase
├── Region: South America (São Paulo)
├── Plan: Pro ($25/mo)
├── Daily backups
└── Point-in-time recovery

Domain
├── command.agenciabase.tech (a definir)
└── SSL Let's Encrypt automático
```

---

## 3. FLUXOS DE DADOS CRÍTICOS

### 3.1 Fluxo: Claude cria campanha

```
┌──────────────┐
│   CLAUDE     │  "Cria campanha pro Just Burn R$ 5k/mês"
│   DESKTOP    │
└──────┬───────┘
       │ MCP call: create_campaign(...)
       ▼
┌────────────────────────────────────────────────┐
│  MCP SERVER                                     │
│                                                 │
│  1. Valida input (Zod)                          │
│  2. Verifica client_id existe (Supabase query)  │
│  3. Verifica saldo Meta (Meta API call)         │
│  4. SE valor > limite → request_approval        │
│  5. Cria registro pending em campaign_actions   │
│  6. Chama Meta API: POST /act_xxx/campaigns     │
│  7. Atualiza campaign_actions com status        │
│  8. Insere em audit_logs                        │
│  9. Notifica via Realtime channel               │
└────────────────────────────────────────────────┘
       │
       ├─────────────────► META API
       ├─────────────────► SUPABASE (write)
       └─────────────────► REALTIME (notify)
                                │
                                ▼
                    ┌────────────────────────┐
                    │   ADMIN DASHBOARD      │
                    │   Toast: "Nova campa-  │
                    │   nha criada"          │
                    └────────────────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   CLIENT DASHBOARD     │
                    │   "Just Burn"          │
                    │   Vê campanha aparecer │
                    └────────────────────────┘
```

### 3.2 Fluxo: Aprovação de ação sensível

```
1. Claude tenta executar ação X que requer aprovação
2. MCP server cria registro em `approvals` (status: pending)
3. Realtime notifica admin dashboard
4. Admin recebe push notification (browser + email)
5. Admin abre fila de aprovações
6. Admin aprova/rejeita com 1 clique
7. Webhook → MCP server retoma execução
8. Claude recebe confirmação e procede
9. Resultado refletido em todas as dashboards
```

### 3.3 Fluxo: Sincronização de Performance

```
┌─────────────────────────────────────────────────────────────────┐
│  CRON JOB (Vercel a cada 15min)                                 │
│                                                                   │
│  1. Pega lista de active_clients                                │
│  2. Pra cada client:                                            │
│     a. Busca insights Meta API (últimas 24h)                    │
│     b. Compara com últimos valores no Supabase                  │
│     c. Detecta anomalias (CTR caiu, CPM alto, etc)              │
│     d. Insere métricas em performance_snapshots                 │
│     e. Cria alerts se necessário                                │
│     f. Notifica via Realtime                                    │
└─────────────────────────────────────────────────────────────────┘
              │
              ├──► Supabase (writes)
              └──► Realtime → Dashboards atualizam em tempo real
```

### 3.4 Fluxo: Cliente aprova criativo

```
1. Cliente abre dashboard → vê 3 criativos pendentes
2. Clica em "Aprovar" no criativo X
3. Frontend → Supabase: UPDATE creative SET status = 'approved'
4. Trigger Postgres → cria action em pending_actions
5. Edge Function detecta → chama MCP server via webhook
6. MCP server pega ação → executa Meta API: ativa anúncio
7. Atualiza status no Supabase
8. Realtime notifica admin + cliente
```

---

## 4. ESQUEMA DE DADOS (RESUMO)

Ver `03-SCHEMA-DATABASE.sql` pra schema completo.

```
TABELAS PRINCIPAIS
├── auth.users (Supabase nativo)
├── profiles (1-1 com auth.users)
├── organizations (multi-tenant)
├── memberships (user ↔ org)
├── clients (clientes da agência)
├── client_users (cliente ↔ client_admin/viewer)
├── meta_accounts (contas Meta de cada cliente)
├── campaigns (snapshots de campanhas Meta)
├── ad_sets
├── ads (criativos)
├── creatives_assets (imagens, vídeos)
├── performance_snapshots (métricas por hora/dia)
├── alerts (CTR caiu, CPM alto, etc)
├── approvals (fila de aprovações)
├── audit_logs (TUDO que acontece)
├── claude_actions (ações executadas por Claude via MCP)
├── reports (relatórios gerados)
├── notifications (notificações pendentes)
├── messages (chat cliente ↔ agência)
└── agent_configs (config IA por cliente)
```

---

## 5. AUTENTICAÇÃO E AUTORIZAÇÃO

### 5.1 Estrutura de Permissões

```
ROLES:
├── super_admin    → Kendy (acesso total)
├── admin          → Equipe BASE (acesso a tudo)
├── client_admin   → Pessoa do cliente (acesso a 1 cliente)
└── client_viewer  → Pessoa do cliente (read-only de 1 cliente)
```

### 5.2 Row Level Security (RLS) - Lógica

```sql
-- Pseudocódigo conceitual

-- Admins veem TUDO
CREATE POLICY "admins_all_access" ON ANY_TABLE
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Clientes veem apenas o seu client_id
CREATE POLICY "client_isolated_access" ON ANY_TABLE
  USING (
    client_id IN (
      SELECT client_id 
      FROM client_users 
      WHERE user_id = auth.uid()
    )
  );
```

### 5.3 JWT Claims Customizados

```json
{
  "sub": "user-uuid",
  "email": "kendy@agenciabase.tech",
  "role": "super_admin",
  "client_ids": ["uuid-1", "uuid-2"],
  "permissions": ["read:*", "write:*", "approve:*"]
}
```

---

## 6. REALTIME E NOTIFICAÇÕES

### 6.1 Canais Realtime

```typescript
// Cliente subscreve no canal do seu client_id
const channel = supabase.channel(`client:${clientId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'performance_snapshots',
    filter: `client_id=eq.${clientId}`,
  }, payload => {
    // Atualiza dashboard
  })
  .subscribe();
```

### 6.2 Sistema de Notificações

```
TIPOS:
├── alert        → CTR caiu, CPM alto, saldo baixo
├── approval     → Aprovação pendente
├── action       → Claude executou X
├── creative     → Novo criativo pra aprovar
├── report       → Relatório semanal pronto
└── message      → Nova mensagem no chat

CANAIS:
├── In-app (toast + notification center)
├── Email (Resend)
├── WhatsApp (Twilio - futuro)
└── Discord webhook (Kendy)
```

---

## 7. SEGURANÇA

### 7.1 Práticas Implementadas

```
✅ TLS 1.3 obrigatório (Vercel + Supabase)
✅ JWT com expiração curta (7 dias) + refresh token
✅ RLS em TODAS as tabelas
✅ Encryption at rest (Supabase)
✅ Secrets em env vars (nunca no código)
✅ Tokens Meta encriptados no banco (pg_crypto)
✅ CORS estrito (apenas command.agenciabase.tech)
✅ Rate limiting por IP (Vercel WAF)
✅ Helmet headers (CSP, X-Frame-Options)
✅ Audit logs imutáveis (append-only)
✅ MFA opcional pra admins (futuro)
```

### 7.2 Compliance

```
✅ LGPD (Brasil) — direito a ser esquecido implementado
✅ Termos de uso e Privacy Policy obrigatórios
✅ Logs de consentimento de cookies
✅ Data retention policy: 2 anos
```

---

## 8. PERFORMANCE E ESCALABILIDADE

### 8.1 Otimizações Frontend

```
✅ Server Components por padrão (Next.js 15)
✅ React Server Actions pra mutations
✅ Streaming (Suspense + loading.tsx)
✅ Image Optimization (next/image)
✅ Font subsetting
✅ Bundle splitting agressivo
✅ Lazy load de componentes pesados
✅ Edge runtime onde possível
```

### 8.2 Otimizações Backend

```
✅ Connection pooling (Supabase Pooler)
✅ Indexes estratégicos em colunas filtradas
✅ Materialized views pra dashboards
✅ Caching com Redis (Upstash) - futuro
✅ Batch queries via Supabase RPCs
✅ Pagination obrigatória em listas
```

### 8.3 Limites Esperados

```
USUÁRIOS:
├── Admin:        até 5 simultâneos
├── Client users: até 100 simultâneos
└── Total:        ~200 sessions/dia

DADOS:
├── Clientes:     até 50
├── Campanhas:    até 1000 ativas
├── Criativos:    até 10.000
├── Snapshots:    1M+ (com retenção)
└── Storage:      até 100GB

CLAUDE ACTIONS:
├── 100/dia (MVP)
└── 1000/dia (escala)
```

---

## 9. DEPLOY E CI/CD

### 9.1 Pipeline

```
Developer push to main
    │
    ▼
GitHub Actions
    ├── biome lint
    ├── typescript check
    ├── vitest unit tests
    └── playwright e2e (smoke)
    │
    ▼ (todos verde)
Vercel auto-deploy
    ├── Build Next.js
    ├── Deploy to preview (PR) ou production (main)
    └── Run smoke tests
    │
    ▼
Slack notification
```

### 9.2 Ambientes

```
LOCAL
├── http://localhost:3000
├── Supabase local (CLI)
└── Mock Meta API

STAGING
├── https://command-staging.vercel.app
├── Supabase staging project
└── Meta sandbox

PRODUCTION
├── https://command.agenciabase.tech
├── Supabase production
└── Meta produção
```

---

## 10. OBSERVABILIDADE

### 10.1 Métricas Monitoradas

```
APPLICATION
├── Response time (p50, p95, p99)
├── Error rate
├── Active users
└── API call success rate

BUSINESS
├── Active clients
├── Total ad spend gerenciado
├── Claude actions/dia
├── Aprovações pendentes
└── Tempo médio de resolução

INFRASTRUCTURE
├── Database connections
├── Realtime channel count
├── Storage usage
└── Edge function invocations
```

### 10.2 Stack de Observabilidade

```
✅ Vercel Analytics      (Real User Monitoring)
✅ Vercel Speed Insights (Core Web Vitals)
✅ Sentry                (Errors + traces)
✅ Better Stack          (Logs centralizados)
✅ PostHog               (Product analytics + replays)
✅ Supabase Dashboard    (DB metrics)
```

---

## 11. ESTRATÉGIA DE TESTES

### 11.1 Pirâmide de Testes

```
        ╱╲
       ╱E2╲          5%   Playwright (fluxos críticos)
      ╱────╲
     ╱INTEG.╲       25%   Integration (Supabase + APIs)
    ╱────────╲
   ╱ UNIT     ╲     70%   Vitest (componentes + utils + lib)
  ╱────────────╲
```

### 11.2 Cenários E2E Críticos

```
1. Admin login + criar cliente novo
2. Cliente recebe magic link e acessa dashboard
3. Claude cria campanha via MCP (mock)
4. Aprovação flow end-to-end
5. Realtime update aparecer em <2s
```

---

## 12. DIAGRAMA DE COMPONENTES NEXT.JS

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx              ← Landing
│   │   └── pricing/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← Dashboard
│   │   ├── clients/
│   │   ├── approvals/
│   │   ├── audit/
│   │   ├── agent-config/
│   │   ├── reports/
│   │   └── settings/
│   ├── cliente/[slug]/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← Dashboard cliente
│   │   ├── criativos/
│   │   ├── historico/
│   │   ├── investimento/
│   │   └── mensagens/
│   ├── api/
│   │   ├── webhooks/meta/route.ts
│   │   ├── reports/[id]/route.ts
│   │   └── claude/action/route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                       ← shadcn/ui
│   ├── glass/                    ← componentes glass custom
│   ├── motion/                   ← framer motion wrappers
│   ├── charts/                   ← recharts wrappers
│   ├── admin/                    ← componentes admin
│   ├── cliente/                  ← componentes cliente
│   └── shared/                   ← compartilhados
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             ← browser client
│   │   ├── server.ts             ← server client
│   │   ├── admin.ts              ← service role
│   │   └── types.ts              ← tipos gerados
│   ├── meta/
│   │   ├── client.ts             ← Meta SDK wrapper
│   │   ├── campaigns.ts
│   │   ├── ads.ts
│   │   └── insights.ts
│   ├── auth/
│   │   ├── permissions.ts
│   │   └── helpers.ts
│   ├── utils/
│   │   ├── format.ts
│   │   ├── date.ts
│   │   └── validation.ts
│   └── constants.ts
│
├── hooks/
│   ├── use-realtime.ts
│   ├── use-client.ts
│   ├── use-permissions.ts
│   └── use-toast.ts
│
├── types/
│   ├── database.ts               ← gerado do Supabase
│   ├── meta.ts
│   └── domain.ts
│
└── middleware.ts                 ← auth + rate limiting
```

---

## 13. COMUNICAÇÃO ENTRE COMPONENTES

### 13.1 Frontend ↔ Backend

```typescript
// Server Actions pra mutations
"use server"
export async function createClient(formData) {
  const supabase = createServerClient()
  // ...
}

// Server Components pra reads
export default async function Dashboard() {
  const supabase = createServerClient()
  const { data } = await supabase.from('clients').select()
  return <ClientList data={data} />
}

// Client Components com Realtime
"use client"
function LiveDashboard({ clientId }) {
  const data = useRealtime('client', clientId)
  return <Charts data={data} />
}
```

### 13.2 MCP Server ↔ Plataforma

```typescript
// MCP server escreve direto no Supabase
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Cada tool do MCP:
async function create_campaign({ client_id, ... }) {
  // 1. Valida via DB
  const { data: client } = await supabase
    .from('clients')
    .select()
    .eq('id', client_id)
    .single()
  
  // 2. Chama Meta API
  const metaResult = await metaApi.createCampaign(...)
  
  // 3. Persiste resultado
  await supabase.from('campaigns').insert({...})
  
  // 4. Loga ação Claude
  await supabase.from('claude_actions').insert({...})
  
  // 5. Realtime notifica automaticamente
  return metaResult
}
```

---

## 14. DECISÕES ARQUITETURAIS-CHAVE (ADRs)

### ADR-001: Por que Supabase?

```
✅ Postgres real (não NoSQL)
✅ RLS poderoso pra multi-tenant
✅ Realtime nativo
✅ Auth completo out-of-the-box
✅ Storage incluído
✅ Edge Functions pra cron jobs
✅ Region São Paulo (latência)
✅ Pricing previsível
```

### ADR-002: Por que MCP server custom?

```
✅ Claude Desktop nativo
✅ Tools type-safe via Zod
✅ Sem necessidade de webhook reverso
✅ Stdio é simples e confiável
✅ Open standard (Anthropic)
```

### ADR-003: Por que Next.js 15 App Router?

```
✅ Server Components reduzem bundle
✅ Streaming melhora UX
✅ Server Actions simplificam mutations
✅ Edge runtime onde necessário
✅ Vercel deploy first-class
```

### ADR-004: Por que NÃO usar Convex?

```
❌ Mais caro em escala
❌ Vendor lock-in maior
❌ Postgres dá mais flexibilidade pra relatórios
❌ Comunidade Supabase >>> Convex
```

---

## 15. PRÓXIMOS PASSOS DE ARQUITETURA

```
☐ Setup repo monorepo (Turborepo)
   ├── apps/web (Next.js)
   ├── apps/mcp (MCP server)
   └── packages/shared (types, utils)

☐ Inicializar projeto Supabase
☐ Inicializar projeto Vercel
☐ Configurar GitHub Actions
☐ Sentry + Better Stack
☐ Domain DNS (Cloudflare)
```

---

> **Continua em:** `03-SCHEMA-DATABASE.sql` (DDL completo do Postgres)
