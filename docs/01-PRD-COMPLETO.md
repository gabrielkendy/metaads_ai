# 📋 PRD — BASE TRÁFEGO COMMAND

> **Product Requirements Document**
> Versão 1.0 · Maio 2026 · Agência BASE
> Owner: Kendy (CEO) · Status: APROVADO PRA EXECUÇÃO

---

## 🎯 1. VISÃO DO PRODUTO

### 1.1 Resumo Executivo

**BASE Tráfego Command** é um mini-SaaS multi-tenant que permite à Agência BASE gerenciar Meta Ads de múltiplos clientes através do Claude Desktop, com plataforma web que reflete em tempo real todas as ações executadas pela IA, oferecendo:

- **Para o gestor (Kendy)**: controle total sobre o que Claude executa, histórico completo, alertas de performance, aprovação de mudanças sensíveis
- **Para os clientes**: dashboard white-label com criativos rodando, métricas em tempo real, ROAS e investimento

### 1.2 Problema Resolvido

```
🔴 PROBLEMA ATUAL
├── Claude Desktop opera Meta Ads via MCP, mas:
│   ├── Sem histórico estruturado de ações
│   ├── Sem visibilidade pra cliente final
│   ├── Sem aprovação prévia de mudanças críticas
│   ├── Sem alertas centralizados
│   └── Cliente fica dependente de relatório PDF semanal
│
└── Gestor (Kendy) gasta tempo:
    ├── Criando relatórios manualmente no PowerPoint
    ├── Mandando print de campanhas no WhatsApp
    ├── Verificando contas no gerenciador Meta toda hora
    └── Sem confiança que Claude não vai estourar orçamento
```

```
🟢 SOLUÇÃO PROPOSTA
├── Plataforma web onde TUDO que Claude executa é refletido
├── Dashboard cliente sempre atualizado (Realtime)
├── Sistema de aprovação pra ações de alto impacto
├── Alertas inteligentes (CTR caiu, CPM alto, criativo cansado)
├── Relatórios gerados automaticamente em PDF/CSV
└── Auditoria completa de cada ação Claude → Meta API
```

### 1.3 Métricas de Sucesso

| Métrica | Meta 30 dias | Meta 90 dias |
|---------|-------------|--------------|
| Clientes ativos na plataforma | 5 | 20 |
| Tempo médio gasto criando relatórios | -80% | -90% |
| NPS dos clientes | 50+ | 70+ |
| Ações Claude/dia executadas | 100+ | 500+ |
| Uptime da plataforma | 99.5% | 99.9% |

---

## 🏗️ 2. ARQUITETURA FUNCIONAL

### 2.1 Personas

#### **Persona 1 — Kendy (Admin/Operador)**

```
👤 Kendy, 30+, CEO Agência BASE
🎯 Objetivo: gerenciar Meta Ads de N clientes com eficiência máxima
🛠️ Ferramenta principal: Claude Desktop
💼 Contextos de uso:
   - Manhã: revisão de alertas + aprovações pendentes
   - Tarde: ajustes de campanha via Claude
   - Noite: geração de relatórios automáticos
😡 Frustrações:
   - Dependência de planilhas manuais
   - Falta de histórico do que Claude fez
   - Cliente cobrando atualização toda hora
```

#### **Persona 2 — Cliente Final**

```
👤 Empresário PME, 35-55, contratante de tráfego
🎯 Objetivo: ver retorno do investimento sem precisar entender Meta Ads
🛠️ Ferramenta principal: dashboard web (mobile-first)
💼 Contextos de uso:
   - 2-3x por dia: olha dashboard pra ver desempenho
   - Semanalmente: revisa relatório
   - Quando aprovam novo criativo
😡 Frustrações:
   - Não entende gerenciador Meta nativo
   - Só recebe atualização quando agência envia
   - Difícil saber se está tendo ROI
```

### 2.2 Jornadas Principais

#### **Jornada A — Kendy cria campanha via Claude Desktop**

```
1. Kendy: "Claude, cria uma campanha de conversão pro cliente Just Burn 
          com R$ 5000/mês focada em mulheres 25-45 da grande BH"

2. Claude (via MCP):
   ├── Valida se cliente "Just Burn" existe na plataforma
   ├── Verifica se há saldo disponível no Meta
   ├── Cria estrutura: Campaign → Ad Set → Ad
   ├── Gera 3 variações de criativo (texto)
   └── REGISTRA TUDO no Supabase em paralelo

3. Plataforma BASE Command:
   ├── Notifica admin: "Nova campanha criada"
   ├── Mostra na timeline da conta Just Burn
   └── Aciona webhook Realtime → cliente vê na sua dashboard

4. Cliente Just Burn (logado):
   ├── Vê notificação: "3 novos criativos aguardando sua aprovação"
   ├── Aprova/rejeita
   └── Quando aprova → Claude ativa via MCP automaticamente
```

#### **Jornada B — Cliente vê performance em tempo real**

```
1. Cliente acessa: command.agenciabase.tech/cliente/just-burn
2. Login Magic Link via email
3. Dashboard mostra:
   ├── Hoje: R$ 234 investidos · 1,2k impressões · 47 cliques
   ├── 7 dias: R$ 1.840 · 12k imp · 380 cliques · 12 leads · ROAS 4.2x
   ├── Top 3 criativos por performance
   └── Alertas: nenhum (✅) | CPM acima da média (⚠️)
4. Tudo atualiza em tempo real via Supabase Realtime
   (sem refresh, dados aparecem conforme Claude executa ações)
```

#### **Jornada C — Alerta automático**

```
1. Sistema detecta: CTR caiu 40% em 6h no anúncio X
2. Cria alerta no banco
3. Realtime → admin dashboard mostra notificação vermelha
4. Kendy abre Claude Desktop:
   "Claude, analisa o alerta do anúncio X e sugere ações"
5. Claude:
   ├── Lê alerta via MCP
   ├── Busca histórico de performance
   ├── Analisa criativo (cansaço de audiência?)
   └── Sugere: pausar + criar variação
6. Kendy: "Aprovado, executa"
7. Claude executa, plataforma reflete, cliente é notificado
```

---

## ⚙️ 3. FUNCIONALIDADES (FEATURE LIST COMPLETA)

### 3.1 Dashboard Admin (Kendy)

#### **3.1.1 Home — Visão Macro**

```
┌─────────────────────────────────────────────────────┐
│ 📊 OVERVIEW HOJE                                     │
├─────────────────────────────────────────────────────┤
│ 12 clientes ativos · R$ 18.4k investidos hoje       │
│ 47 ações Claude · 3 alertas pendentes · ROAS 3.8x   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────┬───────────────────────────┐
│ 🚨 ALERTAS              │ ⏳ APROVAÇÕES PENDENTES  │
│ • CTR caiu Just Burn (2h)│ • Campanha nova FlexByo  │
│ • CPM alto Beat Life     │ • Criativo Manchester    │
│ • Saldo baixo Nechio     │ • Pause Just Burn 003    │
└─────────────────────────┴───────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🤖 ÚLTIMAS AÇÕES CLAUDE (live)                       │
├─────────────────────────────────────────────────────┤
│ 14:23 · pause_ad('justburn_3') · success            │
│ 14:21 · create_creative('flexbyo', 'mulheres-30+')   │
│ 14:18 · get_performance('manchester', '7d')         │
│ ...                                                  │
└─────────────────────────────────────────────────────┘
```

#### **3.1.2 Aba Clientes**

- Lista todos os clientes (CRUD)
- Por cliente:
  - Contas Meta Business vinculadas
  - Plano (Starter/Pro/Premium)
  - Acesso do cliente final
  - Configurações de agente IA específicas
  - Logs históricos
  - Saldo disponível

#### **3.1.3 Aba Aprovações**

- Fila de aprovações pendentes
- Filtros: por cliente, por tipo, por data
- Cada aprovação mostra:
  - O que Claude quer fazer
  - Justificativa de Claude
  - Impacto estimado (orçamento, audiência)
  - Botões: Aprovar / Rejeitar / Pedir mais info

#### **3.1.4 Aba Auditoria**

- Log completo de TODA ação na plataforma
- Filtros: por usuário, por cliente, por tipo, por status
- Cada log:
  - Timestamp
  - Quem (Claude/admin/cliente)
  - O que (action_type)
  - Antes/Depois (diff)
  - Status (success/failed/pending)

#### **3.1.5 Aba Configuração de Agente**

- Editor de System Prompt do Claude
- Regras automáticas (se X então Y)
- Limites: orçamento máximo por ação, requer aprovação se > X
- Templates de criativos (Glass aceita?)
- Tom de voz por cliente

#### **3.1.6 Aba Relatórios**

- Gerar relatório por cliente + período
- Formatos: PDF (com gráficos), CSV, link compartilhável
- Templates customizáveis
- Histórico de relatórios gerados

#### **3.1.7 Aba Configurações**

- Conta Anthropic (API key)
- Conta Meta Business
- Webhooks
- Notificações (email, WhatsApp, Discord)
- Equipe (multi-admin futuro)

### 3.2 Dashboard Cliente (white-label)

#### **3.2.1 Home Cliente**

```
┌─────────────────────────────────────────────────────┐
│ 🏠 OLÁ, JUST BURN                                    │
│ Seu desempenho em tempo real                         │
├─────────────────────────────────────────────────────┤
│                                                       │
│ HOJE (até agora)                                     │
│ ┌─────────┬─────────┬─────────┬─────────┐          │
│ │ R$ 234  │ 1.2k    │ 47      │ 4.2x    │          │
│ │ INVEST. │ IMPRESS.│ CLIQUES │ ROAS    │          │
│ └─────────┴─────────┴─────────┴─────────┘          │
│                                                       │
│ [Gráfico linha 7d - investimento vs retorno]        │
│                                                       │
└─────────────────────────────────────────────────────┘
```

#### **3.2.2 Aba Criativos**

- Galeria de criativos rodando
- Por criativo:
  - Imagem/vídeo
  - Headline + texto
  - Status (rodando/pausado/aprovação)
  - Métricas: impressões, CTR, custo
  - Botão "Aprovar" se status = aprovação

#### **3.2.3 Aba Histórico**

- Timeline de ações que aconteceram (filtro pra cliente)
- Sem mostrar o que Claude faz internamente
- Apenas: "Novo criativo lançado", "Campanha pausada", etc.

#### **3.2.4 Aba Investimento**

- Gráfico de investimento por dia/semana/mês
- Comparativo com mês anterior
- Breakdown por campanha
- Próxima cobrança / saldo

#### **3.2.5 Aba Mensagens**

- Chat simples com a agência (Kendy)
- Anexar arquivos
- Notificações por email

### 3.3 MCP Server (Claude Desktop ↔ Plataforma)

#### **3.3.1 Tools Expostas**

```typescript
// CLIENTES
list_clients()
get_client(client_id)
create_client(name, business_data)
update_client_settings(client_id, settings)

// META ACCOUNTS
get_meta_accounts(client_id)
sync_meta_data(client_id)

// CAMPANHAS
list_campaigns(client_id, status?)
create_campaign(client_id, name, objective, budget, targeting)
update_campaign(campaign_id, changes)
pause_campaign(campaign_id, reason)
resume_campaign(campaign_id)
delete_campaign(campaign_id)  // requer aprovação

// AD SETS
list_ad_sets(campaign_id)
create_ad_set(campaign_id, name, targeting, budget)
update_ad_set(ad_set_id, changes)

// CRIATIVOS
list_creatives(client_id, status?)
create_creative(client_id, headline, body, image_url, cta, ad_set_id?)
duplicate_creative(creative_id, modifications)
pause_creative(creative_id, reason)

// PERFORMANCE
get_performance(client_id, date_range, breakdown?)
get_top_performing(client_id, metric, limit)
get_underperforming(client_id, threshold)

// ALERTAS
create_alert(client_id, type, severity, message, data)
list_alerts(client_id?, status?)
resolve_alert(alert_id, resolution)

// APROVAÇÕES
request_approval(client_id, action_type, payload, justification)
list_pending_approvals(client_id?)

// RELATÓRIOS
generate_report(client_id, date_range, format)
list_reports(client_id?)

// LOGS
log_action(action_type, payload, status, error?)
```

#### **3.3.2 Resources Expostos**

```typescript
// Claude Desktop pode ler como contexto:
base://clients                    // Lista de clientes
base://client/{id}                // Detalhes de um cliente
base://client/{id}/campaigns      // Campanhas de um cliente
base://client/{id}/performance    // Performance recente
base://alerts                     // Alertas ativos
base://approvals                  // Aprovações pendentes
base://config/agent               // Config do agente IA
```

#### **3.3.3 Prompts Pré-definidos (Slash Commands)**

```
/analise-cliente [client_name]
/criar-campanha [client_name] [objective] [budget]
/pausar-criativos-cansados [client_name]
/relatorio-semanal [client_name]
/otimizar-orcamento [client_name]
```

---

## 🔐 4. AUTENTICAÇÃO E AUTORIZAÇÃO

### 4.1 Tipos de Usuário

```
admin           → Kendy (1 conta inicial, expansível pra equipe)
client_admin    → Cliente final (1 por cliente, pode ter mais)
client_viewer   → Pessoa adicional do cliente (read-only)
```

### 4.2 Métodos de Login

```
✅ Magic Link (Supabase Auth)
✅ Google OAuth
✅ Email + Senha (fallback)
```

### 4.3 RLS (Row Level Security) - Supabase

```sql
-- Admin vê tudo
-- Client_admin/viewer só vê dados do client_id ao qual pertence
-- Implementado via policies no Postgres
```

### 4.4 Roles Granulares

```
admin:
  ├── Pode TUDO
  └── Aprovar ações de Claude

client_admin:
  ├── Ver dashboard do próprio cliente
  ├── Aprovar criativos
  ├── Conversar com agência
  └── Ver relatórios

client_viewer:
  └── Ver dashboard apenas (read-only)
```

---

## 📊 5. INTEGRAÇÃO COM META ADS

### 5.1 APIs Utilizadas

```
✅ Meta Marketing API v22       → Campanhas, ad sets, ads
✅ Meta Graph API               → Páginas, Instagram, criativos
✅ Meta Business Manager        → Permissões e contas
✅ Meta Conversions API         → Tracking server-side
```

### 5.2 OAuth Flow

```
1. Cliente conecta conta Meta Business via /admin/clients/[id]/connect-meta
2. Redirect Meta OAuth → Meta autoriza permissões granulares:
   - ads_management
   - ads_read
   - business_management
   - pages_read_engagement
3. Token de longa duração armazenado encriptado
4. Refresh token a cada 60 dias automático
```

### 5.3 Sincronização

```
Estratégia híbrida:
├── Push (Webhooks Meta) → mudanças em tempo real
├── Pull (Cron job a cada 15min) → métricas de performance
└── On-demand (Claude tool) → quando precisa de dado fresco
```

### 5.4 Tratamento de Erros

```
- Rate limit Meta (200 calls/hour por app) → fila com retry
- Token expirado → refresh automático
- Conta suspensa → alerta crítico + email
- Conta sem saldo → alerta + pausa automática
```

---

## 🎨 6. DESIGN SYSTEM

Ver documento `04-DESIGN-SYSTEM.md` em detalhes.

**Resumo:**
- Estilo: Glass Future Dark
- Inspiração: Vercel Dashboard + Linear + Arc Browser + Stripe
- Cores base: pretos profundos, azul elétrico (#3D5AFE), accents glass
- Motion: Framer Motion + tweens cinematográficas
- Tipografia: Inter (UI) + Geist Mono (números) + Fraunces (acentos editoriais)
- Componentes: shadcn/ui + Aceternity UI + custom

---

## 🚀 7. STACK TÉCNICA

```
FRONTEND
├── Next.js 15 (App Router) + React 19
├── TypeScript 5.5+
├── Tailwind CSS v4
├── shadcn/ui (Radix + custom)
├── Aceternity UI (efeitos glass)
├── Framer Motion (animações)
├── Recharts (gráficos)
├── Lucide Icons
├── Sonner (toasts)
├── nuqs (URL state)
└── React Hook Form + Zod (forms)

BACKEND
├── Supabase
│   ├── PostgreSQL 15
│   ├── Auth (magic link + OAuth)
│   ├── Storage (criativos, relatórios)
│   ├── Realtime (subscriptions)
│   └── Edge Functions (Deno)
├── Meta Marketing API (sdk facebook-nodejs-business-sdk)
└── Vercel Cron Jobs

MCP
├── @modelcontextprotocol/sdk (TypeScript)
├── Anthropic SDK (claude-sonnet-4)
└── Stdio transport pra Claude Desktop

OBSERVABILIDADE
├── Vercel Analytics
├── Sentry (errors)
├── Better Stack (logs)
└── PostHog (product analytics)

CI/CD
├── GitHub
├── Vercel (deploy automático)
└── GitHub Actions (lint, type-check, tests)

AMBIENTE
├── Bun (package manager + runtime local)
├── Biome (linter + formatter)
├── Vitest (unit tests)
└── Playwright (e2e tests)
```

---

## 💰 8. MODELO DE NEGÓCIO

### 8.1 Estrutura de Pricing (cliente final)

```
🎯 STARTER     R$ 1.500/mês
├── 1 conta Meta
├── Até R$ 5.000/mês ad spend
├── Dashboard básico
└── Relatório mensal

🚀 PRO         R$ 3.500/mês  
├── Até 3 contas Meta
├── Até R$ 20.000/mês ad spend
├── Dashboard completo + alertas
├── Relatórios semanais
├── Aprovação de criativos
└── + CURSO GRATUITO INCLUSO

🏆 PREMIUM     R$ 8.000/mês
├── Contas ilimitadas
├── Ad spend ilimitado
├── Tudo do PRO +
├── Chamadas estratégicas mensais
├── Dashboard 100% white-label custom
├── Onboarding white-glove
└── Prioridade no suporte
```

### 8.2 Custos da Operação

```
Supabase Pro:        $25/mês  (até 100k usuários)
Vercel Pro:          $20/mês  (necessário pra comercial)
Anthropic API:     ~$50-150/mês (depende do uso de Claude)
Domain:             $12/ano  (já temos)
─────────────────────────
TOTAL: ~$95-195/mês fixo + uso variável Claude
```

### 8.3 Margem Estimada

```
3 clientes Pro = R$ 10.500/mês
Custo operação = R$ 1.000/mês (incl. Claude pesado)
Margem bruta   = R$ 9.500/mês = 90%
```

---

## 🛣️ 9. ROADMAP RESUMIDO

Ver `08-ROADMAP-6-SPRINTS.md` em detalhes.

```
SPRINT 1 (semana 1)  → Setup + Auth + Layout + Design System
SPRINT 2 (semana 2)  → Dashboard Admin + CRUD Clientes
SPRINT 3 (semana 3)  → Dashboard Cliente + Realtime
SPRINT 4 (semana 4)  → MCP Server + Claude Desktop integration
SPRINT 5 (semana 5)  → Meta Ads OAuth + Sync + APIs
SPRINT 6 (semana 6)  → Polish + Deploy + Onboarding cliente 1
```

---

## ✅ 10. CRITÉRIOS DE ACEITE (DONE = DONE)

Para considerar o produto MVP entregue:

```
☐ Admin consegue logar e ver dashboard
☐ Admin consegue criar cliente novo
☐ Cliente consegue logar via magic link
☐ Cliente vê dashboard com dados reais (não mock)
☐ Claude Desktop conecta no MCP server
☐ Claude consegue executar 5+ tools sem erro
☐ Toda ação Claude é refletida em tempo real na plataforma
☐ Sistema de aprovação funciona end-to-end
☐ Relatório PDF é gerado com sucesso
☐ Deploy em produção funcionando
☐ 1 cliente real onboardado
☐ Documentação básica de uso publicada
```

---

## 🚨 11. RISCOS E MITIGAÇÕES

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Meta API bloquear acesso | Baixa | Alto | Múltiplas apps, rate limit interno |
| Claude alucinar e estourar orçamento | Média | Alto | Sistema de aprovação + limites por tool |
| Cliente desconfia da automação | Média | Médio | Logs visíveis + aprovações |
| Supabase free tier limitado | Baixa | Baixo | Pro plan desde início |
| Bug no MCP travar Claude Desktop | Média | Médio | Fallback graceful + logs |

---

## 📞 12. DECISÕES PENDENTES

```
☐ Subdomínio definitivo (atualmente: trafego-command.vercel.app)
☐ Logo da plataforma (atual: BASE Tráfego Command)
☐ Política de pricing final
☐ Quais clientes do BASE serão os primeiros a usar
☐ Plano de migração dos clientes atuais
```

---

> **Próximos documentos:** `02-ARQUITETURA.md`, `03-SCHEMA-DATABASE.sql`, `04-DESIGN-SYSTEM.md`, `05-MCP-SERVER-SPEC.md`, `06-SETUP-INICIAL.md`, `07-PROMPT-CURSOR-MASTER.md`, `08-ROADMAP-6-SPRINTS.md`
