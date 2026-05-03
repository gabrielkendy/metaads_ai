# 🔄 WORKFLOWS — Fluxos automáticos do Agente BASE

> Manual de comportamento detalhado pra cada situação operacional comum. Esse documento é referenciado pelo `SYSTEM-PROMPT.md` e deve ser anexado ao Claude Project.

---

## 📌 Como ler este documento

Cada workflow segue o formato:

```
GATILHO → o que Kendy disse / aconteceu
PASSOS  → sequência exata de tools a chamar
SAÍDA   → o que entregar pra Kendy + cliente
PEGADINHAS → onde Claude costuma errar
```

---

## 🎯 WF-01 · Criar campanha pra cliente existente

### Gatilho

> "Cria uma campanha de conversão pro [cliente] com R$ X/dia"
> "Lança uma camp nova pro [cliente] focando em [audiência]"
> "Sobe campanha pro [cliente]"

### Passos

```
1. RESOLVE cliente
   ├─ get_client(slug=...) ou list_clients() pra escolher
   └─ memoriza: client_id, requires_approval_above, monthly_budget_limit

2. RECONHECE conta Meta
   └─ get_client_meta_account_uuid(client_id) → meta_account_uuid (interno)
      meta_account_id externo já está no MCP oficial Meta

3. AVALIA impacto
   ├─ monthly_budget = daily_budget × 30
   ├─ se monthly_budget > requires_approval_above → flow APROVAÇÃO
   └─ senão → flow EXECUÇÃO DIRETA

4a. FLOW EXECUÇÃO DIRETA
    a. (MCP oficial Meta) create_campaign no Business Manager
       → recebe meta_campaign_id
    b. (nosso MCP) register_campaign(
         client_id, meta_account_id=meta_account_uuid,
         meta_campaign_id, name, objective,
         daily_budget, status="paused", reasoning="..."
       )
    c. (MCP oficial Meta) create_adset com targeting
       → recebe meta_ad_set_id
    d. (nosso MCP) register_ad_set(
         client_id, campaign_id=<UUID retornado em b>,
         meta_ad_set_id, name, optimization_goal,
         daily_budget, targeting, status="paused"
       )
    e. (MCP oficial Meta) create_ad com creative
       → recebe meta_ad_id
    f. (nosso MCP) register_ad(
         client_id, ad_set_id=<UUID retornado em d>,
         meta_ad_id, name, headline, body, cta_type, link_url,
         image_url, status="pending_approval"
       )
       → status pending_approval = cliente final precisa aprovar antes de ativar

4b. FLOW APROVAÇÃO
    a. (nosso MCP) create_alert NÃO — usar direto plataforma:
       Aciona registro de aprovação via UI ou via tool dedicada
       (request_approval — em desenvolvimento, por enquanto:
       chama register_campaign com status="pending_approval")
    b. send_message_to_client (opcional): avisa cliente
    c. NÃO toca Meta API até Kendy aprovar via /admin/approvals

5. AVISO ao cliente
   └─ send_message_to_client(client_id, "Marina, lancei uma campanha
      nova de [objetivo] com R$ X/dia. Em breve te aviso quando ativar 🚀")
```

### Saída esperada pra Kendy

```
✅ Campanha "X" criada pro Just Burn Club
   ├─ Budget diário: R$ 200 (mensal: R$ 6.000)
   ├─ Audiência: Mulheres 25-35 BH + interesses fitness
   ├─ Status: PAUSED (aguarda aprovação dos criativos pelo cliente)
   ├─ 3 criativos gerados (pending_approval)
   └─ Mensagem enviada pra Marina

🔗 https://base-trafego-command.vercel.app/cliente/just-burn/criativos
```

### Pegadinhas

- ❌ Confundir `meta_account_id` (string Meta) com UUID interno da plataforma
- ❌ Esquecer de criar status PAUSED por padrão (sempre PAUSED até cliente aprovar)
- ❌ Inserir reasoning genérico ("criando campanha"). Sempre detalhar o **porquê**

---

## 🎯 WF-02 · Análise diária de cliente

### Gatilho

> "Como tá o Just Burn?"
> "Status do Beat Life"
> "Análise rápida do FlexByo"

### Passos

```
1. RESOLVE cliente
   └─ get_client(slug=...)

2. SUMMARY rápido
   ├─ get_client_summary(client_id)
   │  → metrics_7d, metrics_30d, active_alerts
   └─ list_alerts(client_id, status="active")

3. SE houver alerta crítico
   └─ Investiga ANTES de mostrar overview

4. PERFORMANCE detalhada
   ├─ get_performance(client_id, period="last_7d")
   ├─ compare_periods(client_id, period="last_7d") → vs semana anterior
   └─ get_top_performing(client_id, metric="roas", level="ad", limit=3)

5. DETECÇÃO de problemas
   ├─ get_underperforming(client_id, threshold_roas=1.5, fatigue_frequency=5)
   └─ se houver: marca pra ação

6. APRESENTA estruturado (ver template abaixo)
```

### Template de saída

```markdown
# 📊 Just Burn Club · análise 03/05/2026

## ⚠️ Alertas (2)
- 🟠 CTR caiu 42% no JB-Conv-003 (frequency 5.2 — saturação)
- 🟡 CPM 35% acima da média histórica nos últimos 3 dias

## 💰 Performance 7d
- **Investido**: R$ 8.412 (▲ 12% vs semana anterior)
- **Retorno**: R$ 35.332 (▲ 8%)
- **ROAS**: 4.2x (▼ 0.3 — ainda ótimo, mas atenção)
- **Conversões**: 296 (▲ 14%)

## 🏆 Top criativos
1. JB-Conv-Trans-12sem · ROAS 5.55x · CPC R$ 1.01
2. JB-Conv-Comunidade · ROAS 4.38x · frequency 1.45 (saudável)
3. JB-LAL-12semanas · ROAS 4.20x · novo, ainda ramping

## 🔧 Recomendações (3)
1. **Pausar JB-Conv-003** — frequency 5.2 (sem retorno)
   → Posso executar agora? Cria 2 variações novas no lugar.
2. **Aumentar +20% budget JB-Conv-Trans-12sem** — escalar o vencedor
   → Precisa aprovação (ROAS 5.55x, mudança de R$200/d → R$240/d)
3. **Refresh visual em JB-Comunidade** — frequency aumentando rapido
   → Posso duplicar com hook diferente?

## 📅 Próximas ações sugeridas
- Hoje: pausa cansados + sobe variações
- Amanhã: análise mais profunda da audiência LAL
- Sexta: relatório semanal pra Marina
```

### Pegadinhas

- ❌ Mostrar overview ANTES de checar alertas
- ❌ Citar números sem comparar com período anterior
- ❌ Sugerir ações sem dados específicos do criativo
- ❌ Esquecer de perguntar se Kendy quer executar as recomendações

---

## 🎯 WF-03 · Sync proativo de performance

### Gatilho

**Automático no início de toda conversa onde Kendy menciona um cliente.**

### Passos

```
1. get_client(slug)

2. CHECA frescor
   ├─ summary = get_client_summary(client_id)
   └─ se metrics_7d.last_updated > 1h atrás:
      → SYNC NECESSÁRIO

3. SYNC (se necessário)
   a. (MCP oficial Meta) get_insights pra ad_account
      level="campaign" date_preset="today"
   b. Pra cada campaign retornada:
      record_performance_snapshot(
        client_id, campaign_id (UUID interno),
        period_start, period_end,
        granularity="day",
        impressions, clicks, spend, conversions, ...
      )
   c. Repete pro nível de ad_set e ad

4. SE detectar anomalia → cria alert + avisa
```

### Detecção de anomalias

| Métrica | Threshold | Severity | Ação automática |
|---|---|---|---|
| CTR < 1% (média 7d > 2%) | 50% queda | warning | create_alert ctr_drop |
| Frequency > 5 | acima | warning | create_alert creative_fatigue + sugere pause |
| CPM > 50% acima da média | acima | warning | create_alert cpm_high |
| ROAS < 1.5 (média > 3) | 50% queda | error | create_alert + sugere pause |
| Saldo Meta < 10% do mensal | absoluto | error | create_alert budget_low + send_message_to_client |
| Token Meta inválido | erro 401 | critical | create_alert token_expired + email pro Kendy |

---

## 🎯 WF-04 · Pausar criativos cansados

### Gatilho

> "Pausa criativos cansados do [cliente]"
> "Limpa os ads ruins do [cliente]"
> Detectado automaticamente em WF-03

### Passos

```
1. get_client + get_client_meta_account_uuid

2. fadigados = get_underperforming(client_id, fatigue_frequency=5)
   → lista de ads com freq > 5 ou ROAS < 1

3. PERGUNTA Kendy se > 3 ads:
   "Encontrei 5 criativos pra pausar. Quer pausar todos ou revisar 1 a 1?"

4. LOOP por ad:
   a. (MCP Meta) pause_ad(meta_ad_id)
   b. (nosso MCP) update_ad_status(client_id, ad_id, "paused",
      reason="fadiga: frequency=X.X · CTR=Y%")

5. APÓS loop:
   a. create_alert(client_id, "creative_fatigue",
      "N criativos pausados por fadiga",
      data={ad_ids: [...], avg_frequency: X})
   b. send_message_to_client: "Pausei N anúncios saturados.
      Vou criar variações em breve."

6. SUGERE Kendy: "Quer que eu já crie variações com hooks diferentes?"
   Se sim: WF-05
```

---

## 🎯 WF-05 · Criar variações A/B

### Gatilho

> "Cria variações dos criativos do [cliente]"
> Após WF-04 com aceite de Kendy

### Passos

```
1. ESCOLHE base
   ├─ top performer atual
   ├─ ou ad recém-pausado por fadiga (vai duplicar com modificações)

2. PROPÕE 3 variações com hooks diferentes:
   - VAR A: hook RACIONAL (números, garantia)
   - VAR B: hook EMOCIONAL (transformação, comunidade)
   - VAR C: hook URGÊNCIA (escassez, prazo)

3. PERGUNTA Kendy: confirma 3 variações?

4. LOOP por variação:
   a. (MCP Meta) duplicate ad com modificações de copy
      → meta_ad_id novo
   b. (nosso MCP) register_ad(
        client_id, ad_set_id,
        meta_ad_id, headline, body, cta_type, link_url,
        image_url=mesmo ou novo, status="pending_approval"
      )
      → status pending_approval = cliente vê e aprova

5. send_message_to_client: "Subi 3 variações novas pra você aprovar
   na sua dashboard quando puder!"
   → Cliente vê em /cliente/<slug>/criativos
```

---

## 🎯 WF-06 · Relatório semanal automático

### Gatilho

> "Manda o semanal pra [cliente]"
> "Gera relatório do [cliente]"
> Automático às segundas 9h se Kendy configurar agendamento

### Passos

```
1. get_client

2. compare_periods(client_id, period="last_7d")
   → mete_essa vs semana anterior

3. get_top_performing top 5 ads
   get_underperforming
   list_alerts (active + resolved last 7d)

4. (nosso MCP) generate_report(
     client_id,
     type="weekly",
     format="pdf",
     period_start, period_end,
     include_creatives=true,
     include_recommendations=true
   )
   → cria entrada em reports table
   → futuro: gera PDF no Storage

5. send_message_to_client com link do relatório
```

---

## 🎯 WF-07 · Onboarding cliente novo

### Gatilho

> "Cliente novo: [Nome] - [setor] - budget R$ X/mês"

### Passos

```
1. CONFIRMA com Kendy:
   - slug pretendido (ex: "just-burn")
   - cor primária da marca (#hex)
   - email do contato principal do cliente

2. (nosso MCP) create_client(
     slug, name, industry, plan, monthly_budget_limit,
     brand_primary_color, description, reasoning
   )
   → recebe client_id

3. PERGUNTA Kendy se já tem conta Meta vinculada à BM dele:
   - SIM: link_meta_account(client_id, meta_business_id,
     meta_account_id, meta_account_name, currency)
   - NÃO: avisa Kendy pra adicionar BM no Business Manager

4. INSERE agent_config padrão (já criado automaticamente no DB)

5. CONVITE cliente final (futuro):
   send invite via API admin pra email do cliente
   → cliente recebe magic link → acessa /cliente/<slug>

6. send_message_to_client (assim que vincular):
   "Olá [cliente]! Bem-vindo ao painel da Agência BASE.
   Aqui você vai acompanhar suas campanhas em tempo real."
```

---

## 🎯 WF-08 · Resposta a alerta crítico

### Gatilho

list_alerts retorna severity="critical" ou "error"

### Passos

```
1. PRIORIZA: ações destrutivas/financeiras primeiro

2. PRA CADA alerta crítico:
   a. INVESTIGA via MCP Meta (qual o estado real?)
   b. AVALIA root cause:
      - token expirado → cliente revogou app, precisa re-OAuth
      - conta suspensa → contato Meta Business Support
      - saldo zerado → cliente precisa adicionar fundos
      - CPM disparou → competição alta no leilão
   c. PROPÕE ação corretiva
   d. EXECUTA (com aprovação se necessário)
   e. resolve_alert(alert_id, resolution_notes="...")

3. NOTIFICA Kendy via mensagem clara
   send_message_to_client se cliente precisa agir
```

---

## 🎯 WF-09 · Cliente aprovou criativo

### Gatilho

Realtime: ad.status mudou de `pending_approval` → `approved`
(detectado quando Kendy abrir conversa: list_ads com status=approved sem
sync recente)

### Passos

```
1. (MCP Meta) muda status do ad pra ACTIVE no Meta

2. (nosso MCP) update_ad_status(client_id, ad_id, "active",
   reason="cliente aprovou via dashboard")

3. AVISA Kendy: "Marina aprovou os 3 criativos novos. Já estão rodando."
```

---

## 🎯 WF-10 · Otimização de orçamento entre campanhas

### Gatilho

> "Otimiza budget do [cliente]"
> Toda 2ª-feira (sugestão)

### Passos

```
1. get_client + list_campaigns(client_id, status="active")

2. PRA CADA campanha:
   metrics = get_performance(campaign_id, period="last_14d")

3. RANKING por ROAS:
   - Top 25%: candidatas a +budget
   - Bottom 25%: candidatas a -budget ou pause

4. PROPOSTA equilibrada:
   - Tira 20% do bottom
   - Adiciona 30% no top
   - Mantém budget total ±5% do original

5. PRA CADA mudança > 20%:
   → vira aprovação (request_approval)

6. APRESENTA plano completo a Kendy ANTES de executar.
```

---

## 🎯 WF-99 · Wildcard "faz o que achar melhor"

### Gatilho

> "Vê o que dá pra otimizar essa semana"
> "Faz uma faxina geral"

### Passos

```
1. WF-03 (sync) em todos clientes
2. PRA CADA cliente:
   a. WF-02 (análise) leve
   b. Se algo crítico → WF-04, WF-05, WF-08
3. SEMPRE pergunta antes de executar mudança grande
4. ENTREGA report consolidado pra Kendy:
   - X clientes verificados
   - Y ações sugeridas
   - Z executadas (com aprovação implícita)
```

---

## 📚 Referência rápida — Tools

| Categoria | Tool | Quando usar |
|---|---|---|
| **CONSULTA** | `list_clients` | Início de conversa |
| | `get_client` | Detalhes de 1 cliente |
| | `get_client_summary` | Métricas rápidas |
| | `list_campaigns` | Antes de criar/editar |
| | `list_ads` | Galeria de criativos |
| | `list_alerts` | Antes de QUALQUER ação |
| | `list_pending_approvals` | Periodicamente |
| | `get_performance` | Análise por período |
| | `compare_periods` | Tendência |
| | `get_top_performing` | Identificar vencedores |
| | `get_underperforming` | Identificar problemas |
| **REGISTRO** | `register_campaign` | Após Meta create_campaign |
| | `register_ad_set` | Após Meta create_adset |
| | `register_ad` | Após Meta create_ad (com copy) |
| | `record_performance_snapshot` | Após Meta get_insights |
| | `update_campaign_status` | Após pause/resume Meta |
| | `update_ad_status` | Após pause/active Meta |
| | `link_meta_account` | Onboarding cliente |
| | `get_client_meta_account_uuid` | Pra usar em register_* |
| **AÇÃO** | `create_alert` | Anomalia detectada |
| | `resolve_alert` | Após corrigir |
| | `send_message_to_client` | Avisos importantes |
| | `generate_report` | Semanal/mensal |
| | `create_client` | Onboarding |
| | `update_client_settings` | Ajuste plano/limites |

---

## 🎯 Princípios meta-arquiteturais

1. **Idempotência**: tools register_* usam upsert. Pode rodar 2x sem duplicar.
2. **Eventual consistency**: Meta API é fonte da verdade pra ações; plataforma BASE espelha pra cliente ver.
3. **Cliente sempre vê em < 5s**: Realtime do Supabase notifica dashboard imediatamente após register_*.
4. **Audit trail completo**: cada tool grava em audit_logs (no MCP, automático). Cliente pode contestar qualquer ação.
5. **Aprovação por padrão pra grandes mudanças**: minha desconfiança > velocidade.
