# ⚡ REALTIME — Sincronização tempo real

> Como funciona a propagação `Claude Desktop → Plataforma BASE → Browser do cliente` em segundos. Ler junto com `SYSTEM-PROMPT.md` e `WORKFLOWS.md`.

---

## 🎯 O que "tempo real" significa nesta plataforma

```
┌──────────────────┐    < 200ms      ┌──────────────────┐
│  Claude Desktop  │  ────────────►  │   Supabase DB    │
│  (você + tools)  │  via service    │  (insert/update) │
└──────────────────┘    role MCP     └────────┬─────────┘
                                              │
                                              │ Postgres LOGICAL REPLICATION
                                              │ < 100ms
                                              ▼
                                     ┌──────────────────┐
                                     │ Realtime server  │
                                     │  (Supabase)      │
                                     └────────┬─────────┘
                                              │ WebSocket broadcast
                                              │ < 200ms
                                              ▼
                                     ┌──────────────────┐
                                     │ Browser cliente  │
                                     │ /cliente/<slug>  │
                                     │  (UI atualiza)   │
                                     └──────────────────┘

TOTAL: tipicamente < 500ms · pior caso 2-3s (rede ruim)
```

**Ou seja**: você (Claude) chama `register_campaign(...)`. Em < 1s o cliente final que está com a dashboard aberta vê a campanha aparecer **sem refresh**.

---

## 🔌 Quais tabelas têm Realtime ativo

Aplicado via `supabase/migrations/20260502000200_realtime_publication.sql`:

| Tabela | Por que tem Realtime |
|---|---|
| `alerts` | Cliente vê alerta crítico em segundos |
| `approvals` | Kendy aprova → Claude continua execução |
| `claude_actions` | Feed de ações em /admin (live) |
| `performance_snapshots` | Métricas atualizam dashboard |
| `ads` | Status mudou → galeria de criativos atualiza |
| `notifications` | Sino (toast) toca |
| `messages` | Chat cliente↔agência funciona |
| `audit_logs` | Auditoria em live |

---

## 🌊 Fluxos completos com latência esperada

### Fluxo A: "Claude lança campanha"

```
T=0ms   · Você (Claude) decide: vou criar campanha "Y" pro cliente X
T=10ms  · MCP oficial Meta: cria campanha no Meta Business Manager
T=2000ms · ↳ retorna meta_campaign_id
T=2010ms · Nosso MCP: register_campaign(client_id, meta_campaign_id, ...)
T=2050ms · Supabase INSERT em campaigns
T=2080ms · Postgres LOGICAL REPLICATION → Realtime server
T=2150ms · WebSocket broadcast pra todos browsers do client_id X
T=2200ms · Cliente final vê toast "Nova campanha lançada!" + card aparece

TEMPO TOTAL CLAUDE→CLIENTE: ~2.2s (limitado pela Meta API)
TEMPO PLATAFORMA→CLIENTE: ~150ms
```

### Fluxo B: "Cliente aprova criativo"

```
T=0ms   · Cliente clica "Aprovar" em /cliente/X/criativos
T=50ms  · Server Action approveCreativeAction
T=80ms  · Supabase UPDATE ads SET status='approved'
T=100ms · Postgres LOGICAL REPLICATION → Realtime
T=150ms · WebSocket broadcast pra Claude (próxima query) + admins

T=Xms   · Próxima conversa de Kendy:
        · "tem aprovação nova?"
        · list_ads(client_id, status="approved", since=last_check)
        · → Claude vê e pode ativar via MCP Meta
```

### Fluxo C: "Métrica anômala detectada"

```
T=0ms       · Cron job (futuro: edge function ou Claude Desktop manual)
            · roda detect-anomalies
T=500ms     · Calcula CTR drop > 40%
T=550ms     · Supabase: chama RPC create_alert
T=600ms     · INSERT em alerts + INSERT em notifications (admins)
T=650ms     · Realtime broadcast → admin dashboard
T=700ms     · Toast "🟠 CTR caiu 42% no JB-Conv-003"
T=750ms     · Sino notification badge atualiza

Kendy abre Claude Desktop:
T=Xms   · "Sino tá piscando, o que aconteceu?"
        · list_alerts(status="active")
        · → Claude analisa + sugere ação
```

---

## 🔧 Como Claude (você) consume Realtime

> **IMPORTANTE**: o Claude Desktop **NÃO tem WebSocket aberto** com Supabase. Você é um agente request-response. Pra "ver" novidades, você **POLLA** quando começa uma conversa.

### Padrão recomendado no início de cada conversa

```
QUANDO Kendy abrir conversa nova:

1. CHECK alerts ativos
   alerts = list_alerts(status="active", limit=20)
   if alerts: mostra resumo no início

2. CHECK approvals pendentes
   pending = list_pending_approvals()
   if pending: avisa Kendy quantas

3. CHECK ações suas que falharam
   (futuro: list_claude_actions(actor_id=me, status="failed"))

4. SE Kendy mencionar cliente específico:
   → WF-03 sync proativo de performance
```

### Quando Kendy disser "tem novidade?"

```
1. list_alerts(status="active", since=last_check) → o que apareceu nas últimas X horas
2. list_pending_approvals() → fila de decisão
3. (nosso MCP — ferramenta sugerida no futuro) get_recent_actions(since)
   → últimas N actions registradas no audit
```

---

## 📡 Como o BROWSER do cliente consume Realtime

Ele tem WebSocket aberto via Supabase JS. Toda mudança em tabela com Realtime ativo + RLS que permite SELECT pra esse user é PUSHADA imediatamente.

### Hook customizado em uso

`apps/web/src/hooks/use-realtime.ts`:

```typescript
export function useRealtimeList<T>({ table, filter, events, initialFetch }) {
  // 1. fetch inicial (await initialFetch)
  // 2. abre channel via supabase.channel(`${table}:${filter}`)
  // 3. .on("postgres_changes", { event, schema, table, filter }, callback)
  // 4. callback atualiza estado React
  // 5. cleanup em unmount
}
```

### Componentes que usam Realtime ao vivo

| Componente | Tabela | Filtro |
|---|---|---|
| `<ClaudeFeed>` | `claude_actions` | none (admin vê tudo) |
| `<LiveActivity>` | `claude_actions` | `client_id=eq.${clientId}` |
| `<TopCreatives>` | `ads` | `client_id=eq.${clientId}, status=in.(active,approved)` |
| `<ChatPanel>` | `messages` | `client_id=eq.${clientId}` |
| `<NotificationBell>` (futuro) | `notifications` | `user_id=eq.${userId}` |

---

## ⚠️ O que pode dar errado + como resolver

| Sintoma | Causa | Fix |
|---|---|---|
| Cliente não vê mudança em 10s | Realtime channel desconectado | F5 no browser do cliente; `wss://` não passa por proxy corp |
| Mudança aparece após F5 mas não antes | Tabela não está em `supabase_realtime` publication | Re-rode `_realtime_publication.sql` |
| Você (Claude) cria campanha mas plataforma não reflete | Esqueceu de chamar `register_*` após Meta API | Sempre chame em PARES — Meta + register |
| Mudança aparece pro admin mas não pro cliente | RLS policy do cliente não permite SELECT | Verifica `has_client_access()` policy |
| Realtime push 2x duplicado | Bug de subscribe sem cleanup | Verifique cleanup em `useEffect` retorna |
| Latência > 5s | Rede ruim do cliente OU região Supabase distante | Plataforma já em São Paulo (sa-east-1). Cliente PT precisa fibra |

---

## 🎯 Casos especiais

### Caso 1: Claude executa SEM Kendy presente (modo agendado)

Quando configurar agendamento (futuro: cron + Claude Code agentic), o fluxo é o mesmo MAS:
- `actor_email` em audit_logs vai ser `system@agenciabase.tech` 
- Cliente vê "Sistema atualizou..." em vez de "Kendy executou..."
- Mensagens automáticas vão com tom mais sóbrio

### Caso 2: Múltiplas conversas simultâneas

Se você (Claude Desktop) abrir 2 conversas mexendo no mesmo cliente:
- Cada conversa tem `conversation_id` diferente em `claude_actions`
- Não há lock — última ação ganha
- Kendy pode ver ambas no feed em /admin
- **Recomendado**: fechar/finalizar uma antes de abrir outra

### Caso 3: Cliente está offline quando ação acontece

- Mudança fica no banco
- Quando cliente voltar e abrir dashboard, vê tudo de uma vez
- Notification em `notifications` aparece como unread (badge no sino)
- Email (futuro: Resend webhook) avisa cliente que tem novidade

### Caso 4: Falha intermitente da Meta API

- (MCP oficial Meta) vai retornar erro 5xx ou timeout
- Você NÃO chama register_* (não há nada pra registrar)
- Você cria alert tipo `custom` severity warning explicando
- Tenta novamente em N minutos OU pede pra Kendy

---

## 🔬 Como testar Realtime manualmente

### Teste 1: dois browsers

1. Browser A: abre `/admin` em produção
2. Browser B: abre `/cliente/just-burn` em produção (login com cliente)
3. Você (Claude Desktop) chama:
   ```
   send_message_to_client(client_id="...", content="oi marina", sender_email="contato@kendyproducoes.com.br")
   ```
4. Browser B deve mostrar a mensagem no chat em < 1s SEM refresh

### Teste 2: API direta (sem Claude)

Pra debugar Realtime sem envolver MCP:

```bash
# Cria mensagem via SQL direto no Dashboard Supabase
INSERT INTO messages (client_id, sender_id, sender_role, content)
VALUES (
  '<UUID just-burn>',
  '<UUID Kendy admin>',
  'super_admin',
  'teste realtime via sql'
);
```

Se browser do cliente não atualizar em < 2s, há problema na publication ou WebSocket.

### Teste 3: log do MCP

Logs em `apps/mcp/logs/mcp-server.log` mostram cada `register_*` com timing:

```
2026-05-03T14:23:01 INFO  tool.invoke   { tool: "register_campaign", args: { ... } }
2026-05-03T14:23:01 INFO  guard.passed  { client_id: "...", checks: ["exists", "rate_limit"] }
2026-05-03T14:23:02 INFO  tool.success  { tool: "register_campaign", ms: 145 }
```

---

## 🚀 Otimizações futuras (roadmap)

### Quando implementar?

| Otimização | Quando | Como |
|---|---|---|
| **Subscribe Claude → alerts** | quando alerts virarem 50+/dia | Edge Function que envia push pro Claude Desktop via webhook |
| **Predictive sync** | quando tiver muitos clientes | Job background sync hourly mesmo sem Kendy ativo |
| **Cliente push (PWA)** | quando cliente quiser notif mobile | Web Push API + service worker |
| **Realtime search** | quando admin quiser filtrar live | Supabase full-text search + Realtime |
| **Diff visual** | "o que mudou desde ontem" | Snapshot diff + Realtime channel separado |

---

## 📊 Latência observada (benchmarks)

| Operação | P50 | P95 | P99 |
|---|---|---|---|
| `register_campaign` (Claude → DB) | 80ms | 200ms | 500ms |
| Realtime broadcast (DB → browser) | 100ms | 250ms | 800ms |
| **Total (Claude → cliente vê)** | **180ms** | **450ms** | **1.3s** |
| Meta API call (lado fora) | 800ms | 2000ms | 5000ms |

**Conclusão**: nossa stack é < 500ms. Bottleneck é sempre Meta API.

---

## 🧠 Como Claude (você) deve falar sobre Realtime com Kendy

Quando ele perguntar "isso aparece em tempo real?":

✅ **Sim, sempre que registrar via tool `register_*`. Cliente vê em < 1s.**
✅ **Mensagens via `send_message_to_client` aparecem instantaneamente no chat.**
✅ **Métricas só atualizam quando rodar `record_performance_snapshot` — não é automático.**

Quando ele perguntar "como sincronizo tudo agora?":

```
Eu posso fazer um sync geral:
1. PRA CADA cliente ativo:
2. (MCP Meta) get_insights(level="campaign", date_preset="today")
3. (nosso MCP) record_performance_snapshot pra cada
4. Já que estou aqui, also rodo detect_anomalies — se algo
   estranho, crio alert.

Quer que eu execute? Demora ~2-3min com 3 clientes.
```
