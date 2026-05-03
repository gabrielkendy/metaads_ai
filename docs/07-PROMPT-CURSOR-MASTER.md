# 🤖 PROMPT MESTRE — CURSOR + CLAUDE CODE

> **Como usar este arquivo:**
> 1. Faça o setup completo seguindo `06-SETUP-INICIAL.md`
> 2. Abra o projeto no Cursor
> 3. Cole este prompt completo no chat do Cursor (Claude Sonnet 4.5 ou superior)
> 4. Execute sprint por sprint, validando entre cada
>
> **NUNCA cole tudo de uma vez.** Vamos por sprints, com checkpoints.

---

## 🎯 PROMPT PRINCIPAL — COLA NO CURSOR

```
# CONTEXTO DO PROJETO

Você é um engenheiro sênior trabalhando no projeto **BASE Trafego Command** —
um mini-SaaS multi-tenant pra Agência BASE gerenciar Meta Ads dos clientes
através do Claude Desktop via MCP.

## DOCUMENTOS DE REFERÊNCIA OBRIGATÓRIOS

Antes de fazer QUALQUER coisa, leia atentamente os documentos na pasta /docs:

1. `docs/01-PRD-COMPLETO.md` → Product Requirements Document
2. `docs/02-ARQUITETURA.md` → Arquitetura técnica + diagramas
3. `sql/03-SCHEMA-DATABASE.sql` → Schema Postgres completo (já aplicado no Supabase)
4. `docs/04-DESIGN-SYSTEM.md` → Glass Future Dark — TOKEN POR TOKEN
5. `docs/05-MCP-SERVER-SPEC.md` → Especificação do MCP Server
6. `docs/06-SETUP-INICIAL.md` → Setup do ambiente (já feito)
7. `docs/08-ROADMAP-6-SPRINTS.md` → Roadmap detalhado

## REGRAS NÃO-NEGOCIÁVEIS

### 🔴 QUALIDADE
- ZERO rascunho. Todo código nivel 10/10 de primeira.
- TypeScript estrito sempre
- Validação Zod em TODOS os inputs (forms, server actions, MCP tools)
- Error boundaries onde fizer sentido
- Loading states + Empty states + Error states em TODAS as listas

### 🎨 DESIGN
- 100% Glass Future Dark (ver 04-DESIGN-SYSTEM.md)
- USE CSS variables do Tailwind v4 que já configurei
- Inline-style padrão pra estilos críticos (lição aprendida)
- Animações Framer Motion com easings físicos
- Mobile-first responsivo
- Reduced-motion respeitado
- Focus visible em TODOS interativos

### 📋 CÓDIGO
- Server Components por padrão (Next.js 15 App Router)
- Server Actions pra mutations
- "use client" apenas onde precisar
- Async params (Next 15: await params/searchParams)
- React 19 features (useActionState, useOptimistic)

### 🛡️ SEGURANÇA
- Service role key NUNCA fora do MCP server
- Sempre verificar permissões via RLS + helpers
- Sanitização de inputs
- CSRF tokens em forms críticos
- Rate limiting em rotas públicas

### 🧪 TESTES
- Vitest pra utils, hooks, lib
- Playwright pra fluxos críticos
- Não obrigatório fazer 100% coverage, mas casos críticos sim

### 📝 COMMITS
- Conventional Commits (feat:, fix:, chore:, docs:, style:, refactor:, test:)
- Branches: `feature/sprint-X-task-Y`
- NUNCA push direto na main sem ter pedido aprovação

### 🚦 CHECKPOINTS OBRIGATÓRIOS
Você DEVE PARAR e me reportar nos seguintes momentos:
- Antes de criar arquivos novos em escala (>5 arquivos novos)
- Antes de instalar nova dependência
- Antes de mudar schema do banco
- Ao concluir cada feature de sprint
- Quando encontrar erro que não sabe resolver

## SPRINT ATUAL: [DEFINIR — VEJA ROADMAP]

Estou começando pela SPRINT 1. Confirme:
1. Que leu os 7 documentos de referência
2. Qual a sua compreensão do produto em 3 frases
3. Quais são as ENTREGAS da Sprint 1 segundo o roadmap
4. Quais riscos você vê na execução

Depois disso, espere meu OK pra começar a executar.
```

---

## 📋 SPRINTS — ESTRUTURA DE EXECUÇÃO

Para cada sprint, use o seguinte fluxo:

### FLUXO PADRÃO POR SPRINT

```
1. Você cola o prompt do sprint no Cursor
2. Cursor lê documentos e confirma compreensão
3. Cursor PARA e pede OK
4. Você diz: "OK pode começar"
5. Cursor executa a sprint inteira
6. A cada feature concluída, Cursor PARA e reporta
7. Você valida visualmente + funcionalmente
8. Cursor commita com mensagem clara
9. Próxima feature
10. Ao final do sprint: PR review + merge
```

---

## 🚀 PROMPT SPRINT 1 — SETUP + AUTH + LAYOUT + DESIGN SYSTEM

```
# SPRINT 1: Foundation Layer

Objetivo: Criar a fundação visual e de auth do projeto.

## ENTREGAS DA SPRINT 1

### 1.1 ESTRUTURA DE PASTAS COMPLETA
Crie a estrutura completa em apps/web/src conforme docs/02-ARQUITETURA.md seção 12.

### 1.2 SISTEMA DE DESIGN BASE
Crie em src/components/glass/:
- glass-card.tsx (com top highlight)
- metric-card.tsx (com loading + delta)
- status-pill.tsx (variants: active, paused, pending, error)
- glass-button.tsx (variants: primary, glass, ghost)
- background-orbs.tsx (4 orbs animados + grain)
- border-beam.tsx (animated conic gradient)

Use exatamente os tokens/snippets do docs/04-DESIGN-SYSTEM.md.

### 1.3 LIB SUPABASE
Crie em src/lib/supabase/:
- client.ts → createBrowserClient
- server.ts → createServerClient com cookies
- admin.ts → createAdminClient (service role) — APENAS server-side
- types.ts → exporta tipos do database.ts

### 1.4 MIDDLEWARE DE AUTH
src/middleware.ts:
- Refresh session
- Proteção de rotas /admin/* e /cliente/*
- Redirect pra /login se não autenticado
- Verificação de role (admin vs client)

### 1.5 PÁGINAS DE AUTH

#### /login
- Glass card centralizado
- BG orbs animados
- Form com email (magic link) + Google OAuth button
- Loading states
- Toast de sucesso/erro
- Animação de entrada (Framer Motion)

#### /auth/callback (route handler)
- Recebe code do magic link / OAuth
- Cria sessão
- Redireciona pra /admin (se admin) ou /cliente/[slug] (se cliente)

#### /signup
- Apenas pra clientes via convite (com token)
- Form completo

### 1.6 LAYOUT ADMIN

src/app/admin/layout.tsx:
- Sidebar fixa 240px com:
  - Logo BASE
  - Nav: Dashboard, Clientes, Aprovações, Auditoria, Agente, Relatórios, Settings
  - User menu no rodapé
- Topbar 64px com:
  - Breadcrumb
  - Search global (Cmd+K — fica pro sprint 2)
  - Notifications bell
  - Avatar
- Main content area com container max-w-1440 padding 32

Use BackgroundOrbs como background fixo.

### 1.7 LAYOUT CLIENTE

src/app/cliente/[slug]/layout.tsx:
- Topbar horizontal 72px
- Brand do cliente à esquerda (logo dinâmico)
- Nav central: Home, Criativos, Histórico, Investimento, Mensagens
- User menu à direita
- Main com max-w-1280 padding 32

### 1.8 PLACEHOLDER PAGES

Crie páginas placeholder com layout pronto pra todos os roteamentos:
- /admin → "Dashboard" (apenas estrutura)
- /admin/clients → "Clientes"
- /admin/approvals → "Aprovações"
- /admin/audit → "Auditoria"
- /admin/agent-config → "Config Agente"
- /admin/reports → "Relatórios"
- /admin/settings → "Configurações"
- /cliente/[slug] → "Home"
- /cliente/[slug]/criativos → "Criativos"
- /cliente/[slug]/historico → "Histórico"
- /cliente/[slug]/investimento → "Investimento"
- /cliente/[slug]/mensagens → "Mensagens"

Cada placeholder com:
- Header da página (h1 + descrição)
- Card "Em construção" com Framer Motion
- Estilo Glass

### 1.9 PERMISSIONS HELPER

src/lib/auth/permissions.ts:
- getUser() → user atual + profile
- requireAdmin() → throws se não admin
- requireClientAccess(clientId) → throws se sem acesso

### 1.10 QUERIES INICIAIS

src/lib/queries/:
- profile.ts → getCurrentProfile()
- clients.ts → getClients() para admin

## CRITÉRIOS DE ACEITE

☐ Login funciona via Magic Link (recebe email Supabase, clica, loga)
☐ Login funciona via Google OAuth
☐ Após login admin → vê /admin com sidebar
☐ Após login cliente → vê /cliente/[slug] (apenas o seu)
☐ Tentar acessar /admin sendo cliente → 403 ou redirect
☐ Logout funciona
☐ Glass design aplicado em TUDO
☐ Animações suaves (não "robóticas")
☐ Mobile responsivo (sidebar vira drawer)
☐ Reduced-motion respeitado
☐ TypeScript zero erros
☐ Biome zero warnings

## TESTES MÍNIMOS

Crie testes Playwright em e2e/:
- auth.spec.ts → login + logout flow
- admin-layout.spec.ts → navegação admin
- client-layout.spec.ts → navegação cliente

## TIMEBOX

5 dias de Cursor + Claude Code.

## OUTPUT FINAL

PR pra main com:
- Título: "feat(sprint-1): foundation layer + auth + design system"
- Descrição com checklist
- Screenshots dos layouts
- Loom (opcional) mostrando funcionando

EXECUTE A SPRINT 1 COMPLETA. PARE EM CADA ENTREGA (1.1, 1.2, ...) PRA EU 
VALIDAR ANTES DE PROSSEGUIR.
```

---

## 🚀 PROMPT SPRINT 2 — DASHBOARD ADMIN

```
# SPRINT 2: Admin Dashboard Completo

Pré-requisito: Sprint 1 mergeada.

## ENTREGAS DA SPRINT 2

### 2.1 DASHBOARD HOME (/admin)

Implementar layout conforme PRD seção 3.1.1:

#### Top Section — Overview Cards
4 metric cards horizontais:
- Clientes ativos
- Investimento hoje
- Ações Claude hoje
- Alertas pendentes

#### Middle Section — 2 colunas
Coluna esquerda: Alertas Ativos
- Lista glass com até 5 alertas
- Cada alerta: icon, título, cliente, hora, ação rápida
- Botão "Ver todos"

Coluna direita: Aprovações Pendentes
- Lista glass com até 5 aprovações
- Botões inline: Aprovar / Rejeitar
- Confirmação modal antes de executar

#### Bottom Section — Live Feed
Timeline das últimas 20 ações Claude:
- Timestamp em mono
- Tool name
- Cliente
- Status (success/failed/pending)
- Click → expand pra ver detalhes
- Subscribe Realtime channel pra atualização live

### 2.2 GESTÃO DE CLIENTES (/admin/clients)

#### Lista
- Grid responsivo de cards (grid-cols-1 md:2 xl:3)
- Cada card cliente:
  - Avatar/logo
  - Nome
  - Status pill
  - Plan badge
  - 3 metrics inline (campanhas ativas, spend mês, ROAS)
  - Hover: lift + glow
  - Click → /admin/clients/[id]

#### Filtros
- Search bar com debounce
- Filter por status (active, paused, churned, onboarding)
- Filter por plan
- Sort por: nome, último update, spend

#### Ações
- Botão "Novo Cliente" → modal multi-step
- Por card: menu dropdown (editar, pausar, exportar dados)

### 2.3 DETALHE DO CLIENTE (/admin/clients/[id])

Tabs:
1. **Visão Geral** → metrics + gráficos + timeline
2. **Contas Meta** → contas vinculadas + botão "Conectar nova"
3. **Usuários** → lista de client_admins/viewers + convite
4. **Configuração IA** → editor do agent_config
5. **Auditoria** → logs específicos desse cliente
6. **Configurações** → editar dados, plano, limites

### 2.4 NOVO CLIENTE (modal/wizard)

Wizard 3 etapas:
1. **Dados Básicos**: nome, slug (auto), CNPJ, indústria
2. **Plano e Limites**: plano, budget mensal, requires_approval_above
3. **Branding**: logo upload, cor primária, cor secundária

Após criar:
- Cria registro em clients
- Cria agent_config padrão
- Toast de sucesso
- Redireciona pra /admin/clients/[id]

### 2.5 APROVAÇÕES (/admin/approvals)

- Lista de aprovações pendentes
- Filtros: por cliente, por tipo, por urgência
- Cada item:
  - Tipo (badge colorido)
  - Cliente
  - Título e descrição
  - Reasoning de Claude (expandable)
  - Estimated impact
  - Botões: Aprovar / Rejeitar / Pedir info
- Modal de confirmação antes de aprovar
- Após aprovar/rejeitar → webhook pro MCP server retomar

### 2.6 AUDITORIA (/admin/audit)

Tabela densa com:
- Timestamp
- Actor (user/Claude/system)
- Action
- Resource
- Cliente
- Status
- Click → modal com detalhes (before/after diff)

Filtros pesados:
- Date range
- Actor type
- Action type
- Cliente
- Status

Export CSV button.

### 2.7 CONFIG AGENTE (/admin/agent-config)

Lista de clientes → seleciona um → editor:
- System Prompt (textarea grande)
- Tone of voice (select)
- Brand guidelines (textarea)
- Limites:
  - max_daily_actions
  - max_budget_change_percent
- Toggles:
  - auto_pause_underperforming
  - auto_optimize_budget
  - auto_create_variations
- Forbidden audiences (tags input)
- Forbidden keywords (tags input)
- Templates de criativos (lista editável JSON)
- Botão "Salvar" com toast

### 2.8 RELATÓRIOS (/admin/reports)

- Lista de relatórios já gerados
- Botão "Gerar Novo Relatório":
  - Seleciona cliente
  - Seleciona período
  - Seleciona formato (PDF/CSV)
  - Botão "Gerar"
- Cada relatório: preview, download, share link
- Filtros e search

### 2.9 SETTINGS (/admin/settings)

Tabs:
1. Conta (perfil, password)
2. Notificações (canais habilitados)
3. Integrações (Anthropic API key, Meta credentials check, Resend)
4. Equipe (multi-admin futuro — placeholder)
5. Webhooks (configurar URLs)

## CRITÉRIOS DE ACEITE

☐ Tudo do PRD seção 3.1 implementado
☐ Realtime funcionando (alerts e claude_actions atualizam live)
☐ Aprovações executam ações reais via MCP
☐ Forms validam com Zod
☐ Tabelas com pagination, sort, filter
☐ Empty states bonitos
☐ Loading states em TODAS as listas
☐ Mobile responsivo
☐ Sem layout shift
☐ Animações 60fps

## TIMEBOX

7 dias.

EXECUTE PARANDO A CADA SECTION (2.1, 2.2...) PRA EU VALIDAR.
```

---

## 🚀 PROMPT SPRINT 3 — DASHBOARD CLIENTE + REALTIME

```
# SPRINT 3: Cliente White-Label + Realtime

Pré-requisito: Sprint 2 mergeada.

## ENTREGAS

### 3.1 HOME CLIENTE (/cliente/[slug])

Conforme PRD 3.2.1:
- Welcome card com nome do cliente
- 4 metric cards (investimento, impressões, cliques, ROAS) hoje
- Gráfico linha 7 dias (investimento vs retorno)
- Top 3 criativos performando
- Próximas ações da agência (timeline)
- TUDO em tempo real via Supabase Realtime

### 3.2 CRIATIVOS (/cliente/[slug]/criativos)

- Galeria grid (3 cols)
- Filtros: status (rodando/pausado/aprovação)
- Cada criativo:
  - Preview imagem/vídeo (lazy load)
  - Headline, body, CTA
  - Status pill
  - Métricas: impressões, CTR, custo
  - Botão "Aprovar" se status = pending_approval
  - Modal preview full-size

### 3.3 HISTÓRICO (/cliente/[slug]/historico)

Timeline read-only de eventos:
- "Novo criativo lançado"
- "Campanha pausada"
- "Otimização aplicada"
- "Relatório semanal gerado"

NÃO mostra detalhes técnicos do Claude (usuário não-técnico).

### 3.4 INVESTIMENTO (/cliente/[slug]/investimento)

- Gráfico investimento por dia (30d)
- Comparativo com mês anterior
- Breakdown por campanha (table)
- Próxima cobrança / saldo
- Histórico de pagamentos

### 3.5 MENSAGENS (/cliente/[slug]/mensagens)

Chat simples:
- Lista de mensagens (cliente + agência)
- Input com anexar arquivo
- Markdown básico
- Notificações badge no menu

### 3.6 REALTIME EVERYWHERE

Hook customizado src/hooks/use-realtime.ts:
- Subscribe automático
- Cleanup automático
- Optimistic updates
- Reconnect logic

Aplicar em:
- Home cliente (metrics)
- Criativos (status changes)
- Histórico (novas entries)
- Mensagens (new messages)

### 3.7 ONBOARDING DO CLIENTE

Primeiro login:
- Wizard 3 etapas
- Aceite de termos
- Configuração de notificações
- Tour guiado (Driver.js ou similar)

### 3.8 WHITE-LABEL DINÂMICO

- Logo do cliente carregado de clients.logo_url
- Cores da brand aplicadas via CSS vars dinâmicas
- Favicon dinâmico (futuro)
- Title da aba personalizado

## CRITÉRIOS DE ACEITE

☐ Cliente vê APENAS dados do seu client_id
☐ Realtime atualiza em <2s
☐ White-label visível (logo + cores)
☐ Mobile-first perfeito
☐ Aprovação de criativo executa via webhook
☐ Mensagens funcionam bidirecionalmente

EXECUTE EM ORDEM 3.1→3.8 COM CHECKPOINTS.
```

---

## 🚀 PROMPT SPRINT 4 — MCP SERVER

```
# SPRINT 4: MCP Server + Claude Desktop Integration

Pré-requisito: Sprints 1-3 mergeadas. apps/mcp criado vazio.

## ENTREGAS

### 4.1 ESTRUTURA E CONFIG

Conforme docs/05-MCP-SERVER-SPEC.md seção 2:
- Toda estrutura de pastas
- Config env (Zod validated)
- Logger Winston configurado
- Supabase client com service role
- Meta API client wrapper

### 4.2 ENTRY POINT

src/index.ts:
- Cria MCP server
- Registra todos tools
- Registra todos resources
- Registra todos prompts
- Stdio transport
- Graceful shutdown
- Health check

### 4.3 TOOLS — CLIENTES (5 tools)

Implemente conforme spec:
- list_clients
- get_client
- create_client (admin only)
- update_client_settings
- get_client_summary

### 4.4 TOOLS — CAMPANHAS (7 tools)

- list_campaigns
- get_campaign
- create_campaign (com aprovação)
- update_campaign
- pause_campaign
- resume_campaign
- delete_campaign (sempre aprovação)

### 4.5 TOOLS — AD SETS (4 tools)

- list_ad_sets
- create_ad_set
- update_ad_set
- get_ad_set_performance

### 4.6 TOOLS — ADS/CRIATIVOS (6 tools)

- list_ads
- create_creative
- duplicate_creative
- pause_ad
- get_ad_preview
- upload_creative_asset

### 4.7 TOOLS — PERFORMANCE (5 tools)

- get_performance
- get_top_performing
- get_underperforming
- compare_periods
- get_audience_breakdown

### 4.8 TOOLS — ALERTAS, APROVAÇÕES, RELATÓRIOS

- create_alert, list_alerts, resolve_alert
- list_pending_approvals, get_approval
- generate_report, list_reports

### 4.9 RESOURCES

Conforme spec seção 6:
- base://clients
- base://client/{id}
- base://client/{id}/campaigns
- base://client/{id}/performance/last-7-days
- base://client/{id}/performance/last-30-days
- base://alerts/active
- base://approvals/pending
- base://config/agent/{client_id}

### 4.10 PROMPTS

- /analise-cliente
- /criar-campanha
- /pausar-criativos-cansados
- /relatorio-semanal
- /otimizar-orcamento

### 4.11 ERROR HANDLING

- Hierarquia de erros (MCPError, ValidationError, etc)
- Retry logic com backoff
- Logs estruturados
- Mensagens de erro amigáveis pro Claude

### 4.12 TESTES

- Unit tests pra cada tool
- Mock Supabase + Meta API
- Coverage mínimo 80% nos handlers

### 4.13 INTEGRAÇÃO COM CLAUDE DESKTOP

- Build script
- Documentação claude_desktop_config.json
- Smoke test manual

## CRITÉRIOS DE ACEITE

☐ Claude Desktop conecta sem erros
☐ Todas 35+ tools listadas no menu
☐ Cada tool valida input com Zod
☐ Cada tool log em claude_actions
☐ Aprovação flow funciona end-to-end
☐ Realtime reflete na plataforma
☐ Erros tratados com graça
☐ Logs estruturados em arquivo

EXECUTE TOOLS EM GRUPOS DE 5. PARE A CADA GRUPO.
```

---

## 🚀 PROMPT SPRINT 5 — META ADS REAL

```
# SPRINT 5: Meta Ads OAuth + Sync Real

Pré-requisito: Sprint 4 mergeada com mocks.

## ENTREGAS

### 5.1 META APP CONFIG

- Verificar Meta App está com permissões corretas
- Adicionar lista de redirect URIs
- Testar OAuth manual

### 5.2 OAUTH FLOW

src/app/admin/clients/[id]/connect-meta/page.tsx:
- Botão "Conectar Conta Meta"
- Inicia OAuth → redirect Meta
- Callback → valida token → encripta → salva em meta_accounts
- Sync inicial completo

### 5.3 SUBSTITUIR MOCKS POR API REAL

Em apps/mcp:
- create_campaign → Meta API real
- update_campaign → real
- get_performance → Insights API real
- list_ads → real

### 5.4 SYNC PERIÓDICO

Vercel Cron Job a cada 15min:
- /api/cron/sync-meta-data
- Pra cada cliente ativo:
  - Pega insights last 1h
  - Detecta anomalias
  - Cria alertas se necessário
  - Insert performance_snapshots

### 5.5 WEBHOOKS META

- Endpoint /api/webhooks/meta
- Validação X-Hub-Signature
- Processa events: ad_account, ads, ad_creative
- Atualiza estado local

### 5.6 ERROR HANDLING META

- Token expirado → refresh
- Rate limit → fila com retry
- Conta suspensa → alerta crítico
- Saldo zerado → pausa campanhas + alerta

## CRITÉRIOS DE ACEITE

☐ OAuth funciona end-to-end
☐ Token armazenado encriptado
☐ Sync inicial popula banco
☐ Cron job atualiza performance
☐ Webhook recebe e processa eventos
☐ Claude Desktop pode criar campanha real (em conta dev)
☐ Métricas reais aparecem no dashboard

EXECUTE COM CONTA META DEV PRIMEIRO.
```

---

## 🚀 PROMPT SPRINT 6 — POLISH + DEPLOY + ONBOARDING

```
# SPRINT 6: Production Ready

Pré-requisito: Sprints 1-5 funcionando.

## ENTREGAS

### 6.1 LANDING PAGE

src/app/(marketing)/page.tsx:
- Hero com value prop
- Features grid (Glass cards)
- Como funciona (steps)
- Pricing (3 cards)
- Depoimentos
- Footer com links legais

### 6.2 PRICING PAGE

- 3 planos (Starter, Pro, Premium)
- Comparação de features
- CTA "Começar agora" → wizard signup
- FAQ

### 6.3 TERMOS + PRIVACIDADE

- /termos-de-uso
- /politica-de-privacidade  
- /lgpd
- /cookies

### 6.4 NOTIFICAÇÕES

- Email transacional via Resend
- Templates: welcome, alerta, aprovação, relatório
- Settings de canais (in-app, email, WhatsApp futuro)

### 6.5 SEO + META

- Sitemap dinâmico
- robots.txt
- Open Graph + Twitter Cards
- Schema.org markup

### 6.6 OBSERVABILIDADE

- Sentry SDK em apps/web e apps/mcp
- PostHog (page views, events)
- Vercel Analytics + Speed Insights
- Better Stack pra logs do MCP

### 6.7 PERFORMANCE

- Lighthouse 95+ em todas páginas
- Core Web Vitals verde
- Bundle analyzer
- Otimizações:
  - Lazy load de componentes pesados
  - Image optimization
  - Font subsetting
  - Code splitting

### 6.8 ACESSIBILIDADE

- axe DevTools zero erros
- Lighthouse a11y 100
- Skip links
- ARIA labels
- Keyboard navigation completa

### 6.9 DEPLOY PRODUÇÃO

- Domain command.agenciabase.tech
- SSL ativo
- Env vars production
- Database backups automáticos
- Status page (BetterStack)

### 6.10 ONBOARDING DO PRIMEIRO CLIENTE

- Cria 1 cliente real (você mesmo, ou Just Burn)
- Conecta Meta Business
- Cria 1 campanha via Claude Desktop
- Cliente loga e vê dashboard
- Validação ponta a ponta

### 6.11 DOCUMENTAÇÃO

- README.md detalhado
- CONTRIBUTING.md
- Manual do Admin (PDF/Markdown)
- Manual do Cliente (PDF/Markdown)
- Troubleshooting

## CRITÉRIOS DE ACEITE

☐ Landing live em command.agenciabase.tech
☐ Pricing convertendo (track signups)
☐ Lighthouse 95+ em todas
☐ Zero erros Sentry últimos 7d
☐ 1 cliente real onboardado
☐ Documentação completa publicada

🚀 GO LIVE!
```

---

## 📋 PADRÕES DE COMMIT

```
feat(scope): adiciona feature X
fix(scope): corrige bug Y
chore(scope): mudança não-funcional
docs(scope): atualiza docs
style(scope): formatação
refactor(scope): refatora sem mudar comportamento
test(scope): adiciona/atualiza testes
perf(scope): melhora performance

Scopes: auth, dashboard, admin, cliente, mcp, db, ui, api, deploy
```

---

## 🛡️ PROTEÇÕES OBRIGATÓRIAS

```
PR REVIEW CHECKLIST:
☐ Sem console.log esquecidos
☐ Sem .env commitado
☐ Sem hardcoded secrets
☐ Type-check PASS
☐ Biome PASS
☐ Build PASS
☐ Testes PASS
☐ Screenshots no PR
☐ Migration aplicada (se DB)
☐ Documentação atualizada
```

---

## 🚨 SE ALGO DER ERRADO

```
1. NÃO continue avançando
2. Reporte o erro completo
3. Sugira 2-3 abordagens
4. Espere decisão
5. Após decisão, execute
6. Documente a solução

Common pitfalls:
- Tailwind v4 + CSS vars → use inline-style se inconsistente
- Server Components + 'use client' → atenção
- RLS policies muito restritivas → debug com service role temporariamente
- Realtime subscription leak → cleanup obrigatório
- Meta API rate limit → batch + delay
```

---

## 🎯 OBJETIVO FINAL

Em 6 semanas, ter:
- Plataforma BASE Tráfego Command no ar
- Claude Desktop operando Meta Ads via MCP
- 1 cliente real onboardado e satisfeito
- Foundation sólida pra escalar pra 20+ clientes
- Documentação que outras pessoas entendam

**EXECUTE COM EXCELÊNCIA. NÍVEL 10/10. ZERO RASCUNHO.**

Bora! 🔥
