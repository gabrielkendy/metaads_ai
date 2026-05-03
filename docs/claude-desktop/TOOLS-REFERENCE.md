# 🛠️ TOOLS REFERENCE — Manual completo do MCP "base-trafego"

> 44 tools disponíveis. Use como referência ao montar workflows. Cada tool tem: assinatura, exemplo, regras de uso, retorno.

---

## 🗂️ Índice por categoria

```
🔍 CONSULTA (read-only)
   ├─ list_clients · get_client · get_client_summary
   ├─ list_campaigns · get_campaign
   ├─ list_ads · get_ad_preview
   ├─ list_ad_sets · get_ad_set_performance
   ├─ list_alerts · list_pending_approvals · get_approval
   ├─ get_meta_accounts · check_meta_balance
   ├─ get_performance · get_top_performing · get_underperforming
   ├─ compare_periods · get_audience_breakdown
   └─ list_reports

📝 REGISTRO (modo ledger — sem chamar Meta API)
   ├─ link_meta_account
   ├─ register_campaign · register_ad_set · register_ad
   ├─ record_performance_snapshot
   ├─ update_campaign_status · update_ad_status
   ├─ get_client_meta_account_uuid
   └─ send_message_to_client

⚡ EXECUÇÃO (chama Meta API — usar com cuidado)
   ├─ create_campaign · update_campaign · pause_campaign · resume_campaign · delete_campaign
   ├─ create_creative · duplicate_creative · pause_ad · upload_creative_asset
   ├─ create_ad_set · update_ad_set
   └─ sync_meta_account

🚨 OPERAÇÃO
   ├─ create_alert · resolve_alert
   ├─ create_client · update_client_settings
   └─ generate_report
```

> 💡 **Dica**: prefira tools de REGISTRO (`register_*`) quando estiver usando junto com MCP oficial Meta. Use tools de EXECUÇÃO só quando quiser que o nosso MCP chame Meta API direto (modo standalone, sem MCP oficial).

---

## 🔍 CONSULTA

### `list_clients`

Lista todos clientes da agência.

```
Args: { status?: "active"|"paused"|"onboarding"|"churned", limit?: 50 }
Returns: { clients: [{ id, slug, name, status, plan, industry, monthly_budget_limit, brand_primary_color }] }
```

**Exemplo**:
```
list_clients({ status: "active" })
```

### `get_client`

Detalhes completos de 1 cliente, incluindo contas Meta vinculadas.

```
Args: { client_id?: UUID, slug?: string } (precisa um dos dois)
Returns: client + meta_accounts[]
```

**Exemplo**:
```
get_client({ slug: "just-burn" })
```

### `get_client_summary`

Resumo executivo: métricas 7d/30d, campanhas ativas, alertas, aprovações pendentes.

```
Args: { client_id: UUID }
Returns: { client, metrics_7d, metrics_30d, active_campaigns, active_ads, active_alerts }
```

### `list_campaigns`

```
Args: { client_id: UUID, status?, limit?: 50 }
Returns: { campaigns: [{ id, name, objective, status, daily_budget, total_spent }] }
```

### `get_campaign`

```
Args: { campaign_id: UUID }
Returns: campaign + ad_sets[]
```

### `list_ads`

```
Args: { client_id: UUID, status? }
Returns: { ads: [{ id, name, status, headline, body, image_url, approved_by_client }] }
```

### `list_alerts`

```
Args: { client_id?: UUID, status?: "active"|"acknowledged"|"resolved", limit?: 20 }
Returns: { alerts: [{ id, type, severity, status, title, message, data, created_at }] }
```

**SEMPRE chame no início da análise de cliente.**

### `list_pending_approvals`

```
Args: { client_id?: UUID, limit?: 20 }
Returns: { approvals: [{ id, type, title, claude_reasoning, payload, expires_at }] }
```

### `get_performance`

Métricas consolidadas em período.

```
Args: { client_id: UUID, period: "today"|"yesterday"|"last_7d"|"last_14d"|"last_30d"|"last_90d" }
Returns: { period, metrics: { spend, impressions, clicks, conversions, ctr, cpc, cpa, roas, frequency } }
```

### `get_top_performing`

```
Args: { client_id, metric: "roas"|"ctr"|"cpa"|"spend", level: "campaign"|"ad_set"|"ad", limit: 5, period: "last_7d"|"last_30d" }
Returns: { items: [{ metric_value, name, ... }] }
```

### `get_underperforming`

```
Args: { client_id, threshold_roas: 1.0, threshold_ctr: 0.01, fatigue_frequency: 5 }
Returns: { underperformers: [...] }
```

### `compare_periods`

Performance current vs período anterior.

```
Args: { client_id, period: "last_7d"|"last_30d" }
Returns: { current: {...}, previous: {...} }
```

### `get_audience_breakdown`

```
Args: { client_id, dimension: "age"|"gender"|"placement"|"device"|"country", period }
Returns: { dimension, items: [{ breakdown_value, metrics }] }
```

### `get_meta_accounts`

```
Args: { client_id: UUID }
Returns: { accounts: [{ id, meta_account_id, meta_account_name, current_balance, currency }] }
```

### `check_meta_balance`

Saldo atual + estimativa em tempo real.

```
Args: { client_id: UUID }
Returns: { account_id, currency, balance_cached, balance_estimated_now, daily_cap }
```

---

## 📝 REGISTRO (modo ledger)

> **Use essas tools APÓS executar ações no MCP oficial Meta.** Elas registram no banco BASE pra cliente ver na dashboard em tempo real.

### `link_meta_account`

Vincula conta Meta Business a cliente — sem precisar de OAuth (Claude já tem acesso via BM).

```
Args: {
  client_id: UUID,
  meta_business_id: string,           // BM ID
  meta_account_id: string,            // ad account ID sem "act_"
  meta_account_name?: string,
  currency?: "BRL",
  is_primary?: true
}
Returns: { meta_account: {...} }
```

**Exemplo**:
```
link_meta_account({
  client_id: "5f08f91d-...",
  meta_business_id: "123456789012345",
  meta_account_id: "987654321",
  meta_account_name: "Just Burn — BM Principal"
})
```

### `register_campaign`

Registra campanha que VOCÊ acabou de criar via MCP oficial Meta.

```
Args: {
  client_id: UUID,
  meta_account_id: UUID,              // ⚠️ UUID INTERNO da meta_account, não o ID do Meta!
  meta_campaign_id: string,           // o ID retornado pelo Meta
  name: string,
  objective: enum,                    // OUTCOME_SALES, OUTCOME_LEADS, etc
  daily_budget?: number,
  status?: "paused"|"active",
  targeting?: {...},
  reasoning: string                   // OBRIGATÓRIO
}
Returns: { campaign: {...} }
```

**⚠️ Regra de ouro**: SEMPRE use `get_client_meta_account_uuid` primeiro pra pegar `meta_account_id` (UUID interno).

### `register_ad_set`

```
Args: {
  client_id: UUID,
  campaign_id: UUID,                  // UUID interno da campanha
  meta_ad_set_id: string,             // ID do Meta
  name, optimization_goal, daily_budget,
  targeting,
  status?: "paused",
  reasoning: string
}
```

### `register_ad`

Registra criativo. Carrega o COPY que cliente vai aprovar.

```
Args: {
  client_id, ad_set_id (UUID interno),
  meta_ad_id, meta_creative_id?,
  name, headline, body, cta_type, link_url,
  image_url?, video_url?, thumbnail_url?,
  status?: "pending_approval",         // default: cliente precisa aprovar antes de ativar
  reasoning: string
}
```

**Status flow**:
```
pending_approval → cliente aprova → "approved"
                → cliente rejeita → "rejected"
              ↓
           você ativa Meta → "active"
```

### `record_performance_snapshot`

Métricas que você coletou via Meta `get_insights`.

```
Args: {
  client_id, campaign_id?, ad_set_id?, ad_id?,
  period_start, period_end, granularity: "day",
  impressions, reach, clicks, spend, conversions, conversion_value,
  ctr?, cpc?, cpm?, cpa?, roas?, frequency?,
  breakdown_dimension?, breakdown_value?
}
```

> Métricas derivadas (ctr, cpc, etc) são calculadas automaticamente se não passar.

### `update_campaign_status`

Após pausar/retomar via Meta API.

```
Args: { client_id, campaign_id, new_status: "active"|"paused"|"completed", reason: string }
```

### `update_ad_status`

```
Args: { client_id, ad_id, new_status: "active"|"paused"|"approved"|"rejected", reason }
```

### `get_client_meta_account_uuid`

```
Args: { client_id, meta_account_id?: string (default is_primary) }
Returns: { uuid, meta_account_id, meta_business_id, name }
```

### `send_message_to_client`

Manda mensagem pro chat do cliente. Aparece em tempo real.

```
Args: {
  client_id: UUID,
  content: string,
  sender_email: string                // email do admin remetente
}
```

**Exemplo**:
```
send_message_to_client({
  client_id: "5f08f91d-...",
  content: "Marina, lancei 3 variações novas. Passa lá pra aprovar quando puder! 🚀",
  sender_email: "contato@kendyproducoes.com.br"
})
```

---

## ⚡ EXECUÇÃO (chama Meta API)

> **Use essas tools quando estiver no modo standalone (USE_META_MOCK=false).** Hoje USE_META_MOCK=true → essas tools usam dados mock.

### `create_campaign`

Cria campanha NO META + registra em 1 step. Use só se NÃO for usar MCP oficial Meta.

```
Args: { client_id, name, objective, daily_budget, targeting?, reasoning, ... }
```

> **Recomendação atual**: prefira fluxo `(MCP Meta) create + register_campaign` que dá mais controle.

### `update_campaign`, `pause_campaign`, `resume_campaign`, `delete_campaign`

Mesma lógica.

### `create_creative`, `duplicate_creative`, `pause_ad`

Mesma lógica.

### `create_ad_set`, `update_ad_set`

Mesma lógica.

### `sync_meta_account`

Força re-sync com Meta API.

```
Args: { client_id, meta_account_id?: UUID }
Returns: { success, account_id, message }
```

> **Atual**: dispara intent de sync. Em produção, dispara worker async.

---

## 🚨 OPERAÇÃO

### `create_alert`

```
Args: {
  client_id: UUID,
  type: "ctr_drop"|"cpm_high"|"budget_low"|"creative_fatigue"|"audience_overlap"|"account_suspended"|"token_expired"|"custom",
  severity: "info"|"warning"|"error"|"critical",
  title: string (3-140),
  message: string (10-1000),
  campaign_id?, ad_id?,
  data?: { ... }
}
Returns: { success, alert_id }
```

### `resolve_alert`

```
Args: { alert_id: UUID, resolution_notes: string }
```

### `create_client`

Onboarding cliente novo. Só super_admin/admin via MCP.

```
Args: {
  slug: string (regex /^[a-z0-9-]+$/),
  name, legal_name?, industry?, plan: "starter"|"pro"|"premium",
  monthly_budget_limit?, description?,
  reasoning: string
}
```

### `update_client_settings`

```
Args: {
  client_id,
  updates: { name?, plan?, status?, monthly_budget_limit?, requires_approval_above?, auto_approve_creatives? },
  reasoning
}
```

### `generate_report`

```
Args: {
  client_id,
  type: "weekly"|"monthly"|"executive"|"custom",
  format: "pdf"|"csv"|"web_link",
  period_start, period_end,
  include_creatives?: true,
  include_recommendations?: true
}
Returns: { success, report_id }
```

---

## 🎯 RESOURCES disponíveis (read via Claude)

Além de tools, você (Claude) pode READ estes resources como contexto:

```
base://clients                                    → lista clientes ativos JSON
base://client/{id}                                → detalhes cliente
base://client/{id}/campaigns                      → campanhas
base://client/{id}/performance/last-7-days        → métricas
base://alerts/active                              → todos alertas ativos
base://approvals/pending                          → fila aprovações
base://templates/creatives                        → templates de copy
base://config/agent/{client_id}                   → config IA do cliente
```

**Uso**: o Claude Desktop pode ler resources sem chamar tool — passe pra ele como referência inicial.

---

## 🎓 PROMPTS PRÉ-DEFINIDOS

Slash commands prontos no Claude Desktop após conectar o MCP:

| Comando | Args | O que faz |
|---|---|---|
| `/analise-cliente` | client_slug, period? | WF-02 análise completa |
| `/criar-campanha` | client_slug, objective, budget | WF-01 |
| `/pausar-criativos-cansados` | client_slug | WF-04 |
| `/relatorio-semanal` | client_slug | WF-06 |
| `/otimizar-orcamento` | client_slug | WF-10 |

**Exemplo**:
```
/analise-cliente client_slug=just-burn period=7d
```

Claude executa o workflow inteiro automaticamente.

---

## 🔐 GUARDS automáticos (não você)

Toda tool sensível passa por:

1. **`assertClientExists`**: client_id válido + status != churned
2. **`assertResourceBelongsToClient`**: campaign_id pertence ao client_id declarado (cross-tenant block)
3. **`rateLimit`**: max N calls/min por cliente
4. **`assertDailyActionLimit`**: max ações/dia (configurável em agent_config)
5. **`sanitizeString`**: remove control chars, trunca

Se falhar:
- `INVALID_CLIENT_ID` → você passou UUID inválido
- `NOT_FOUND` → cliente/campanha não existe
- `CROSS_TENANT_BLOCKED` → 🚨 você confundiu clientes! re-confirma
- `RATE_LIMIT` → muitas ações em pouco tempo, espera
- `DAILY_LIMIT_REACHED` → cliente atingiu limite diário

---

## 📊 IDs úteis (do bootstrap)

```
admin Kendy:    72f0334f-2f22-4112-a0a2-9568537e912d
                contato@kendyproducoes.com.br

cliente Just Burn:        5f08f91d-5469-4893-84b0-babe9b6171c0
cliente Beat Life:        9697b2a6-c5a5-4d30-b5f9-d365a6f64fde
cliente Manchester:       2fd8d2c8-60db-4008-91de-613e3ff88b5c
```

> Esses IDs são úteis pra teste. Em produção, sempre busque via `get_client(slug=...)`.

---

## 🧪 Exemplos completos

### Exemplo 1: Sync manual de performance pra Just Burn

```
1. client = get_client(slug="just-burn")
   → client_id = "5f08f91d-5469-4893-84b0-babe9b6171c0"

2. (MCP oficial Meta)
   insights = get_insights(
     account_id="act_<id-meta>",
     level="campaign",
     date_preset="today"
   )

3. Pra cada campaign in insights.data:
   record_performance_snapshot({
     client_id: "5f08f91d-...",
     campaign_id: <UUID interno — buscar com list_campaigns>,
     period_start: "2026-05-03T00:00:00Z",
     period_end: "2026-05-03T14:00:00Z",
     granularity: "day",
     impressions: 12500,
     clicks: 342,
     spend: 458.32,
     conversions: 12,
     conversion_value: 2400.00,
     ctr: 2.74,
     frequency: 1.45
   })
```

### Exemplo 2: Lançar campanha + ad set + 3 ads

```
1. client = get_client(slug="just-burn")
2. meta_uuid = get_client_meta_account_uuid({ client_id: client.id })
   → meta_uuid.uuid = UUID interno

3. (MCP Meta) create_campaign(...) → meta_campaign_id

4. register_campaign({
     client_id: client.id,
     meta_account_id: meta_uuid.uuid,
     meta_campaign_id: meta_campaign_id,
     name: "JB-Conv-Black-Friday",
     objective: "OUTCOME_SALES",
     daily_budget: 200,
     status: "paused",
     reasoning: "Black Friday — escalar lookalike 1% que tá com ROAS 4.6x"
   })
   → retorna campaign.id (UUID interno)

5. (MCP Meta) create_adset(...) → meta_ad_set_id

6. register_ad_set({
     client_id, campaign_id: <UUID retornado em 4>,
     meta_ad_set_id, name, optimization_goal, daily_budget,
     targeting: { age_range: "25-45", genders: ["female"], geo: ["BH"], ... },
     reasoning: "Audiência core que mais converte"
   })
   → retorna ad_set.id

7. PRA CADA variação (3x):
   a. (MCP Meta) create_ad com creative
   b. register_ad({
        client_id, ad_set_id: <UUID 6>,
        meta_ad_id, name, headline, body, cta_type, link_url,
        image_url, status: "pending_approval",
        reasoning: "Hook emocional/racional/urgência"
      })

8. send_message_to_client({
     client_id, sender_email: "contato@kendyproducoes.com.br",
     content: "Marina, lancei a Black Friday! 3 variações de copy
              esperando você aprovar. https://base-trafego-command.vercel.app/cliente/just-burn/criativos"
   })
```

---

## 🚀 Roadmap (próximas tools planejadas)

| Tool | Quando | Pra que |
|---|---|---|
| `request_approval` | em breve | Tool dedicada pra criar approvals (hoje vai via register_campaign status=pending_approval) |
| `bulk_register_performance` | quando syncs ficarem comuns | Insert batched pra reduzir round-trips |
| `subscribe_to_alerts` | quando tiver Push Notifications | Webhook pro Claude Desktop |
| `query_audit` | quando precisar forense | Filtra audit_logs por critérios |
| `clone_client_setup` | onboarding rápido | Copia config de cliente existente |
| `forecast_budget` | análise preditiva | Projeta spend baseado em ramp-up |
