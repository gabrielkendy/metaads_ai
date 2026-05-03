# 🛣️ ROADMAP — 6 SPRINTS

> Plano de execução faseado · 4-6 semanas até MVP completo
> Cada sprint é entregável e validável independentemente

---

## 📊 VISÃO GERAL

```
SPRINT 1  →  Foundation Layer            (5 dias)
SPRINT 2  →  Dashboard Admin              (7 dias)
SPRINT 3  →  Dashboard Cliente + Realtime (5 dias)
SPRINT 4  →  MCP Server                   (7 dias)
SPRINT 5  →  Meta Ads OAuth + Sync        (10 dias)
SPRINT 6  →  Polish + Deploy + Cliente 1  (5 dias)

TOTAL: ~39 dias (5-6 semanas trabalhando focado)
```

---

## 🏁 SPRINT 1 — FOUNDATION LAYER

### Objetivo

Criar a base visual, autenticação e estrutura do projeto. Sem features, mas com TUDO funcionando esteticamente.

### Duração

**5 dias úteis** (1 semana)

### Entregáveis

```
✅ Estrutura de pastas completa
✅ Sistema de design implementado (componentes Glass)
✅ Auth funcionando (Magic Link + Google)
✅ Layouts admin e cliente prontos
✅ Páginas placeholder navegáveis
✅ Permissions helpers
✅ Middleware de proteção
✅ Tests E2E básicos (auth flow)
```

### Critérios de Aceite

```
☐ Login admin funciona
☐ Login cliente funciona
☐ Glass design 100% aplicado
☐ Mobile responsivo
☐ Zero erros TypeScript
☐ Zero warnings Biome
☐ Build production PASS
☐ Lighthouse 90+ em /login
```

### Riscos

```
🟡 Tailwind v4 + CSS vars: pode dar inconsistência → fallback inline-style
🟡 Supabase Auth + Next 15 cookies: API mudou → seguir docs oficiais 
🟢 Resto é executar bem feito
```

### Dependências Externas

```
- Supabase projeto criado e schema aplicado
- Vercel projeto conectado (mesmo sem domain custom)
- Gmail/Google OAuth configurado
```

### Demo Esperada

```
Vídeo curto (loom) mostrando:
1. Acessar /login
2. Inserir email → recebe magic link → loga
3. Vê /admin com sidebar
4. Navega entre tabs (Clientes, Auditoria, etc)
5. Logout
6. Mostra mobile responsivo
```

---

## 🎛️ SPRINT 2 — DASHBOARD ADMIN

### Objetivo

Dashboard admin COMPLETO com todas funcionalidades. Sem MCP ainda — usar mocks pra dados.

### Duração

**7 dias úteis** (1.5 semanas)

### Entregáveis

```
✅ Home Dashboard (/admin)
   ├─ Overview cards (mockados)
   ├─ Alertas + Aprovações
   └─ Live feed de claude_actions

✅ Gestão Clientes (/admin/clients)
   ├─ Lista grid + filtros + search
   ├─ Detalhe com 6 tabs
   └─ Wizard "Novo Cliente"

✅ Aprovações (/admin/approvals)
   ├─ Lista filtráveis
   └─ Modal de aprovação

✅ Auditoria (/admin/audit)
   ├─ Tabela densa
   ├─ Filtros pesados
   └─ Modal de detalhes

✅ Config Agente (/admin/agent-config)
   └─ Editor por cliente

✅ Relatórios (/admin/reports)
   ├─ Lista
   └─ Botão gerar (mock)

✅ Settings (/admin/settings)
   └─ 5 tabs
```

### Critérios de Aceite

```
☐ Tudo do PRD seção 3.1 implementado
☐ CRUD completo de clientes funciona
☐ Realtime mockado (atualiza com timer fake)
☐ Loading states em TUDO
☐ Empty states criativos
☐ Mobile responsive
☐ Animações 60fps
☐ Tabelas com pagination + sort
```

### Demo Esperada

```
Vídeo (5 min) mostrando:
1. Dashboard home com dados mockados
2. Criar cliente novo via wizard
3. Aprovar uma aprovação mock
4. Filtrar auditoria
5. Editar config de agente
6. Mobile preview
```

---

## 👥 SPRINT 3 — DASHBOARD CLIENTE + REALTIME

### Objetivo

Dashboard cliente white-label perfeito + integração Realtime real (Supabase).

### Duração

**5 dias úteis**

### Entregáveis

```
✅ Home Cliente (/cliente/[slug])
   ├─ Welcome com nome
   ├─ 4 metrics
   ├─ Gráfico 7d
   └─ Top 3 criativos

✅ Criativos
   ├─ Galeria
   ├─ Aprovação inline
   └─ Modal preview

✅ Histórico
   └─ Timeline read-only

✅ Investimento
   ├─ Gráfico mensal
   └─ Breakdown por campanha

✅ Mensagens
   └─ Chat simples bidirecional

✅ Realtime everywhere
   ├─ Hook customizado
   ├─ Subscribe automático
   └─ Optimistic updates

✅ Onboarding
   └─ Wizard 3 etapas

✅ White-label dinâmico
   ├─ Logo dinâmico
   └─ Cores via CSS vars
```

### Critérios de Aceite

```
☐ Cliente vê APENAS seus dados (RLS)
☐ Realtime <2s latência
☐ White-label visível
☐ Mobile-first impecável
☐ Aprovação executa via webhook
☐ Mensagens funcionam
```

### Demo Esperada

```
1. Login cliente
2. Vê home com seu logo + cores
3. Criativos atualizam em tempo real (em outra aba, admin altera)
4. Aprova um criativo
5. Manda mensagem pra agência
6. Mobile preview
```

---

## 🤖 SPRINT 4 — MCP SERVER

### Objetivo

MCP Server completo conectando Claude Desktop à plataforma. Inicialmente com Meta API mockada.

### Duração

**7 dias úteis**

### Entregáveis

```
✅ Estrutura monorepo apps/mcp
✅ Config + env validation
✅ Logger Winston
✅ 35+ tools implementadas:
   ├─ Clientes (5)
   ├─ Meta Accounts (3)
   ├─ Campanhas (7)
   ├─ Ad Sets (4)
   ├─ Ads (6)
   ├─ Performance (5)
   ├─ Alertas (3)
   ├─ Aprovações (2)
   └─ Relatórios (2)

✅ 8 resources expostos
✅ 5 prompts pré-definidos
✅ Error handling robusto
✅ Retry logic
✅ Tests unit (80% coverage)
✅ Documentation claude_desktop_config.json
```

### Critérios de Aceite

```
☐ Claude Desktop conecta sem erros
☐ Todas tools listadas no menu
☐ Cada tool valida input
☐ Cada tool log em claude_actions
☐ Aprovação flow end-to-end
☐ Realtime reflete na plataforma
☐ Erros tratados com graça
```

### Demo Esperada

```
Vídeo épico (10 min):
1. Abre Claude Desktop
2. Mostra "🔌 base-trafego" conectado
3. Pede: "Liste meus clientes"
4. Claude chama list_clients
5. Pede: "Cria campanha pro cliente X"
6. Claude executa, plataforma reflete
7. Pede algo que requer aprovação
8. Mostra aparecendo em /admin/approvals
9. Aprova → Claude continua execução
10. Tudo aparece em audit logs
```

---

## 📊 SPRINT 5 — META ADS REAL

### Objetivo

Trocar mocks por Meta API real. OAuth + sync + webhooks.

### Duração

**10 dias úteis** (2 semanas)

### Entregáveis

```
✅ Meta App configurado
✅ OAuth flow completo
✅ Tokens encriptados
✅ Sync inicial funcional
✅ Substituir TODOS mocks por API real:
   ├─ create_campaign
   ├─ update_campaign
   ├─ get_performance
   ├─ list_ads
   └─ ...

✅ Cron job a cada 15min
✅ Webhooks Meta
✅ Detecção de anomalias
✅ Auto-criação de alertas
✅ Error handling Meta-específico
```

### Critérios de Aceite

```
☐ OAuth funciona end-to-end
☐ Token armazenado encriptado
☐ Sync inicial popula banco completo
☐ Cron atualiza performance a cada 15min
☐ Webhook recebe e processa
☐ Claude cria campanha REAL em conta dev
☐ Métricas reais no dashboard
☐ Rate limit Meta tratado
```

### Riscos

```
🔴 Meta API tem peculiaridades (orçamento em centavos, etc)
🔴 Business Verification pode atrasar
🟡 Rate limits podem aparecer em escala
🟡 Webhooks Meta exigem validação rigorosa
```

### Mitigações

```
- Usar conta Meta Business em modo Dev primeiro (5 contas grátis)
- Testar com saldo baixo (R$ 50)
- Implementar circuit breaker
- Logs detalhados de cada Meta API call
```

### Demo Esperada

```
Vídeo (15 min):
1. Conectar conta Meta via OAuth
2. Sync inicial busca campanhas existentes
3. Criar campanha REAL via Claude Desktop
4. Verificar no Meta Ads Manager (apareceu)
5. Aguardar 15 min → ver performance atualizar
6. Forçar pause via Claude → ver mudança no Meta
7. Mostrar webhook recebendo evento
```

---

## 🚢 SPRINT 6 — POLISH + DEPLOY + CLIENTE 1

### Objetivo

Production-ready + onboardar primeiro cliente real.

### Duração

**5 dias úteis** + 2 dias buffer

### Entregáveis

```
✅ Landing page (/)
✅ Pricing page
✅ Termos + Privacidade + LGPD
✅ Notificações email (Resend)
✅ SEO completo
✅ Observabilidade (Sentry, PostHog)
✅ Performance (Lighthouse 95+)
✅ Acessibilidade (a11y 100)
✅ Deploy command.agenciabase.tech
✅ SSL + Domain
✅ Onboarding cliente real
✅ Documentação completa
```

### Critérios de Aceite

```
☐ Landing live e convertendo
☐ Lighthouse 95+ em todas páginas
☐ Zero erros Sentry últimos 7d
☐ 1 cliente real onboardado
☐ Cliente fez login e usou
☐ Manual do admin publicado
☐ Manual do cliente publicado
☐ Status page funcionando
```

### Cliente Inicial Sugerido

```
🎯 OPÇÃO A: Just Burn (cliente atual)
   ├─ Já existe relacionamento
   ├─ Tem campanhas rodando
   └─ Pode dar feedback honesto

🎯 OPÇÃO B: BASE Agência (interno)
   ├─ Sem risco
   ├─ Validação completa
   └─ Você decide tudo

RECOMENDAÇÃO: Começar por opção B (interno) por 1 semana, 
              depois opção A.
```

---

## 📅 CRONOGRAMA VISUAL

```
SEMANA 1 (5 dias)
├── Mon → Tue: Sprint 1 (foundation)
└── Wed → Fri: Sprint 1 (auth + layouts)

SEMANA 2 (5 dias)
└── Mon → Fri: Sprint 2 (dashboard admin)

SEMANA 3 (5 dias)
├── Mon → Wed: Sprint 2 (resto)
└── Thu → Fri: Sprint 3 (cliente)

SEMANA 4 (5 dias)
├── Mon → Wed: Sprint 3 (resto + realtime)
└── Thu → Fri: Sprint 4 (MCP setup)

SEMANA 5 (5 dias)
└── Mon → Fri: Sprint 4 (MCP completo)

SEMANA 6 (5 dias)
├── Mon → Tue: Sprint 5 (OAuth + sync)
└── Wed → Fri: Sprint 5 (resto)

SEMANA 7 (5 dias)
├── Mon → Wed: Sprint 5 (refinamento)
└── Thu → Fri: Sprint 6 (landing + polish)

SEMANA 8 (3 dias buffer)
├── Mon → Tue: Sprint 6 (deploy)
└── Wed: Onboarding cliente 1
```

---

## 🎯 KPIS DE SUCESSO PÓS-MVP

### 30 dias após go-live

```
☐ 5+ clientes ativos
☐ 100+ ações Claude/dia
☐ 99% uptime
☐ NPS 50+
☐ R$ 30k+ ad spend gerenciado
☐ 0 incidentes críticos
```

### 90 dias após go-live

```
☐ 20+ clientes ativos
☐ 500+ ações Claude/dia
☐ 99.5% uptime
☐ NPS 70+
☐ R$ 200k+ ad spend gerenciado
☐ Receita recorrente: R$ 50k+/mês
☐ Margem >85%
```

---

## 🚨 GESTÃO DE RISCOS

### Risco: Atraso em sprints

```
MITIGAÇÃO:
- Buffer de 20% em cada sprint
- Daily check-in (auto-relato)
- Re-priorizar features se atrasar (corte ANTES da qualidade)
```

### Risco: Bugs em produção

```
MITIGAÇÃO:
- Staging environment
- Smoke tests automáticos
- Feature flags
- Rollback em 1 click (Vercel)
```

### Risco: Meta API muda

```
MITIGAÇÃO:
- Versão fixada na API
- Subscriptions em changelog Meta
- Testes contra sandbox mensal
- Adapter pattern (facilita migração)
```

### Risco: Claude alucina e gasta dinheiro

```
MITIGAÇÃO:
- Sistema de aprovação obrigatório
- Limites por cliente
- Auto-pause se anomalia
- Rate limit por hora
- Audit log completo
```

---

## 🎓 LIÇÕES E PRINCÍPIOS

### Durante toda execução

```
1. Quality > Speed
   "Lento e bem feito" sempre vence "rápido e bagunçado"

2. Documentação como código
   Documenta enquanto faz, não depois

3. Testar manualmente cada feature
   Automação não substitui olho humano em UX

4. Feedback do cliente cedo
   Validar com Just Burn antes de generalizar

5. Mobile não é afterthought
   Cliente vai abrir no celular o tempo todo

6. Realtime é mágica
   Mas tem custo de complexidade — usar com critério

7. Glass não é tudo
   Usar com propósito, não em tudo

8. Claude é parceiro
   Mas tem limites — guardrails são essenciais
```

---

## 📞 SUPORTE DURANTE EXECUÇÃO

### Quando travar

```
1. Tenta 30 min sozinho
2. Pesquisa docs oficiais
3. Pergunta no Cursor (Claude)
4. Vai pra Discord da Anthropic / Supabase
5. Pergunta no Stack Overflow
6. ÚLTIMO RECURSO: simplificar a feature
```

### Quem consultar

```
- Bugs Next.js → Vercel Discord
- Bugs Supabase → Supabase Discord
- Bugs MCP → Anthropic Discord
- Bugs Meta API → Meta Developer Community
- Bugs design → este chat (Claude principal)
- Bugs estratégia → este chat
```

---

## 🎉 CELEBRAÇÃO DOS MARCOS

```
🏁 Sprint 1 done    → Pizza pra você
🏁 Sprint 2 done    → Saída com a esposa
🏁 Sprint 3 done    → Compra algo do desejo
🏁 Sprint 4 done    → Conquista massiva, marcar com social post
🏁 Sprint 5 done    → Festa em casa
🏁 GO LIVE          → Marca isso! Foto + post + brinde
🏁 1º cliente pago  → Celebração massiva
🏁 R$ 50k MRR       → Vai descansar 1 semana, mereceu
```

---

> **Bora executar! Comece pela Sprint 1 com calma e excelência. 🚀🔥**
