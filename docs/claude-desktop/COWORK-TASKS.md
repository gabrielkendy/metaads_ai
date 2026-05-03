# ⏰ COWORK — Tarefas agendadas automáticas

> O **Cowork** (Claude Desktop scheduled tasks) já tá habilitado no seu config (`coworkScheduledTasksEnabled: true`). Esse doc lista 5 tarefas prontas pra você criar — Claude roda em background, mantém plataforma BASE atualizada **automaticamente sem você pedir**.

---

## 🎯 O que é Cowork?

Tarefas agendadas que rodam dentro do Claude Desktop em background. Você define:
- **Quando rodar** (cron)
- **Prompt que Claude vai executar**
- Claude executa autonomamente, usa MCPs, cria alerts

Resultado: você abre Claude de manhã e já encontra **sync feito + relatório das anomalias da noite**. Sem precisar disparar manualmente.

---

## 📋 Como criar tarefa Cowork

1. Claude Desktop → ícone **Cowork** (relógio/calendário na barra inferior ou sidebar)
2. **+ New Scheduled Task**
3. Define:
   - **Name**: nome curto
   - **Schedule**: cron expression OU intervalo
   - **Project**: `Meta Ads AI` (importante! seleciona EXATAMENTE o nome do teu projeto Claude — assim Cowork usa o System Prompt + arquivos anexados)
   - **Prompt**: cola o texto de cada tarefa abaixo

> ⚠️ Cowork pode mudar de UI conforme Anthropic atualiza. Se não achar, procure por **"Scheduled Tasks"** ou **"Automations"** ou **"Background Tasks"**.

---

## 🌅 TAREFA 1 · Sync Diário Matinal (a mais importante)

### ⏰ Schedule
```
Toda segunda a sexta às 07:00 (horário Brasília)
```

Cron: `0 7 * * 1-5`

### 📝 Prompt pra colar

```
Bom dia! Faz a rotina matinal de sync e diagnóstico:

1. Lista clientes que precisam sync usando list_clients_needing_sync(threshold_hours=12)

2. PRA CADA cliente retornado:
   a. (MCP oficial Meta) busca tudo do cliente:
      - get_campaigns nivel campaign
      - get_adsets nivel adset  
      - get_ads nivel ad
      - get_insights date_preset="yesterday" pra cada nivel
      
   b. Monta payload completo e chama:
      bulk_register_meta_data({
        client_id, meta_account_id (UUID interno),
        campaigns: [...todos com ad_sets aninhados com ads e métricas],
        sync_period_start: ontem 00:00 UTC,
        sync_period_end: ontem 23:59 UTC,
        reasoning: "Sync matinal automático via Cowork"
      })
   
   c. Detecta anomalias e cria alerts:
      - CTR caiu > 40% vs média 7d → create_alert("ctr_drop", "warning")
      - Frequency > 5 → create_alert("creative_fatigue", "warning")  
      - CPM > 50% acima média → create_alert("cpm_high", "warning")
      - ROAS < 1 (alvo > 3) → create_alert("custom", "error")
      - Saldo Meta < 10% mensal → create_alert("budget_low", "error")
   
   d. log_sync_run(client_id, scope="single_client", 
                   status="success" ou "partial",
                   triggered_by="cowork",
                   summary="N camps, M ads, X anomalias detectadas")

3. Resumo final em audit:
   log_sync_run(scope="all_clients", status="success", triggered_by="cowork",
                summary="Sync matinal: N clientes, M alerts criados")

Importante:
- Se algum cliente der erro de Meta API (token expirado), cria alert critical
  e CONTINUA com os outros (não para tudo)
- Não envia mensagens pra clientes nessa rotina (só sync silencioso)
- No final, não me pede confirmação — esta é tarefa autônoma
```

### O que isso faz

Toda manhã antes você chegar:
- Plataforma BASE tá ATUALIZADA com dados de ontem
- Alertas críticos já estão criados
- Você abre `/admin` e vê tudo pronto

---

## 🚨 TAREFA 2 · Detecção de Anomalias (mid-day)

### ⏰ Schedule
```
A cada 4h durante horário comercial (8h-20h)
```

Cron: `0 8,12,16,20 * * 1-5`

### 📝 Prompt

```
Faz check rápido de anomalias em clientes ativos (sem refazer sync completo):

1. PRA CADA cliente em list_clients(status="active"):
   a. (MCP Meta) get_insights(level="campaign", date_preset="today",
      breakdown="hour") — só métricas de HOJE até agora
   
   b. Compara com últimas 6 horas pra detectar:
      - Spike anormal de gasto (>30% acima da média)
      - Queda súbita de impressões/cliques (>40% queda)
      - CTR despencando em tempo real
   
   c. Se detectar algo grave → create_alert imediatamente

2. Atualiza performance_snapshots pra cada campanha com granularity="hour"
   via record_performance_snapshot

3. log_sync_run(scope="anomaly_check", status="success",
                triggered_by="cowork",
                summary="Check anomalias N clientes")

Não me notifica se tudo normal. Só alerta se detectar algo.
```

---

## 📊 TAREFA 3 · Relatório Semanal Automático

### ⏰ Schedule
```
Toda segunda-feira às 08:30
```

Cron: `30 8 * * 1`

### 📝 Prompt

```
Gera e envia relatórios semanais pra todos clientes ativos:

PRA CADA cliente em list_clients(status="active"):

1. compare = compare_periods(client.id, period="last_7d")

2. top = get_top_performing(client.id, metric="roas", level="ad", limit=5)
   bottom = get_underperforming(client.id)

3. generate_report({
     client_id, type="weekly", format="pdf",
     period_start: 7 dias atrás, period_end: ontem,
     include_creatives: true,
     include_recommendations: true
   })

4. send_message_to_client({
     client_id,
     content: "Olá [nome cliente]! Seu relatório semanal está pronto:
              📊 [link do relatório]
              
              Highlights:
              - ROAS: X.Xx (▲/▼ Y% vs semana anterior)
              - Investido: R$ Z (▼/▲ W%)
              - Top criativo: [nome] · ROAS X.Xx
              
              Qualquer dúvida me chama por aqui! 🚀",
     sender_email: "contato@kendyproducoes.com.br"
   })

5. log_sync_run(client_id, scope="single_client", status="success",
                triggered_by="cowork", summary="Relatório semanal enviado")

Quando terminar, manda resumo final pra Kendy:
- N clientes receberam relatório
- M aprovações pendentes da semana passada
- X alerts criados na semana
```

---

## ⚡ TAREFA 4 · Sync de Performance Real-Time (intra-dia)

### ⏰ Schedule
```
A cada 15min durante horário comercial
```

Cron: `*/15 8-22 * * *`

### 📝 Prompt

```
Sync rápido de performance APENAS pros clientes com campanhas ativas
no momento. Não precisa puxar estrutura completa — só métricas frescas.

1. ativos = list_clients(status="active")

2. PRA CADA cliente:
   a. campaigns = list_campaigns(client.id, status="active")
   
   b. Se não houver campaigns ativas, pula esse cliente
   
   c. Pra cada campaign:
      (MCP Meta) get_insights(meta_campaign_id, date_preset="today")
      
   d. record_performance_snapshot pra cada com granularity="hour"
      OU bulk_register_meta_data se preferir batch

3. Não cria alerts nesta rotina (a tarefa #2 já faz)
4. log_sync_run apenas se algo mudou drasticamente

Esta tarefa mantém os dashboards do cliente ATUALIZADOS em tempo real
quando ele abre o navegador.
```

> ⚠️ **Atenção**: rate limit do Meta API é ~200 calls/h por app. Com 3 clientes × 4 vezes/h = 12 calls — bem dentro do limite.

---

## 🎬 TAREFA 5 · Onboarding Cliente Novo (sob demanda)

Esta NÃO é agendada — é template pra você invocar manualmente quando adicionar cliente.

### Como invocar

No Claude Desktop, abre conversa no projeto Meta Ads AI e cola:

```
Onboarding cliente novo:

INFO BÁSICA:
- Nome: [Nome do Cliente]
- Slug pretendido: [slug-em-kebab-case]
- Setor: [fitness/food/saas/etc]
- Plano: [starter/pro/premium]
- Budget mensal: R$ [valor]
- Cor primária da marca: [#hex]

META BUSINESS:
- BM ID: [123456789012345]
- Ad Account ID: [987654321 — sem o "act_"]
- Nome da conta: [Nome — BM Principal]

EXECUTE:

1. create_client({
     slug, name, industry, plan, monthly_budget_limit,
     brand_primary_color, description: "...",
     reasoning: "Onboarding novo cliente"
   })

2. link_meta_account({
     client_id (do passo 1),
     meta_business_id, meta_account_id, meta_account_name,
     is_primary: true,
     currency: "BRL"
   })

3. (MCP Meta) get_campaigns + get_adsets + get_ads do Meta
   pra puxar estrutura existente

4. bulk_register_meta_data com TUDO

5. send_message_to_client({
     client_id, sender_email: "contato@kendyproducoes.com.br",
     content: "Olá [Nome]! Bem-vindo ao painel da Agência BASE 🎉
              Aqui você acompanha suas campanhas em tempo real.
              Qualquer dúvida me chama por aqui!"
   })

6. log_sync_run(scope="single_client", status="success",
                summary="Onboarding completo")

7. Me retorna resumo:
   - Cliente criado: <id>
   - Conta Meta vinculada
   - N campanhas existentes registradas
   - URL de acesso: https://base-trafego-command.vercel.app/cliente/<slug>
```

---

## 🛠️ Tarefas extras (sob demanda)

### Otimização de orçamento (toda 2ª-feira após relatório)

```
Otimização semanal de budget:

PRA CADA cliente:
1. campaigns = list_campaigns(client.id, status="active")
2. Pra cada: get_performance(campaign_id, period="last_14d")
3. Identifica:
   - Top 25% por ROAS → candidatas a +budget (+30%)
   - Bottom 25% → candidatas a -budget (-20%) ou pause
4. Pra mudanças > 20%, NÃO executa direto:
   - Cria proposta detalhada
   - Mostra pra Kendy aprovar manualmente
5. Pra mudanças < 20%, pode executar direto:
   - (MCP Meta) update_budget
   - bulk_register_meta_data com novos budgets
   
Apresenta plano pra Kendy revisar.
```

### Limpeza de criativos cansados (toda 2ª-feira de manhã)

```
Limpeza criativos cansados:

PRA CADA cliente em list_clients(status="active"):
1. fadigados = get_underperforming(client.id, fatigue_frequency=5)
2. SE fadigados.length > 3: cria approval (não pause direto)
3. SE <= 3:
   pause cada um via (MCP Meta) pause_ad
   update_ad_status no nosso MCP
4. send_message_to_client se pausou algum
5. Sugere variações novas (não cria — pede aprovação Kendy)
```

---

## 🚦 Como saber se Cowork tá rodando

### Confere logs

1. Claude Desktop → ícone Cowork → **History** ou **Recent Runs**
2. Vê última execução, duração, sucesso/erro
3. Se errou: lê o erro, ajusta prompt

### Confere resultado na plataforma BASE

1. https://base-trafego-command.vercel.app/admin
2. Aba Auditoria → filtra por `actor_type = claude`
3. Vê todas execuções com timestamp + resumo

```sql
-- Query Supabase pra ver runs do Cowork:
select created_at, action, metadata
from audit_logs
where actor_type = 'claude'
  and metadata->>'triggered_by' = 'cowork'
order by created_at desc
limit 50;
```

### Confere alerts criados em background

1. https://base-trafego-command.vercel.app/admin
2. Sino de notificações no canto superior direito
3. Ou aba "Alertas" se houver

---

## 🆘 Troubleshooting

| Sintoma | Causa | Fix |
|---|---|---|
| Cowork rodou mas plataforma não atualizou | Claude esqueceu de chamar `bulk_register_*` | Reforça no prompt: "OBRIGATÓRIO chamar bulk_register_meta_data" |
| Alerta criado mas não aparece em /admin | Realtime quebrou | F5 no browser; verifica publication SQL |
| Cowork falha com "rate limit Meta" | Muitas calls em pouco tempo | Aumenta intervalo entre tarefas; ou adiciona retry com backoff no prompt |
| Sync incompleto (só algumas campanhas) | Erro silencioso no meio | Cowork deve usar try/catch e log_sync_run com status="partial" |
| Token Meta expirou | Cliente revogou app | create_alert critical + Kendy precisa pedir cliente reconectar |

---

## 📈 Resultado esperado após 1 semana com Cowork ativo

```
✓ Plataforma BASE com dados de TODOS clientes atualizados < 15 min de delay
✓ Alerts críticos detectados em < 4h após acontecer
✓ Relatórios semanais entregues automaticamente toda segunda
✓ Você gasta 80% MENOS tempo "rodando coisas manualmente"
✓ Cliente abre dashboard a qualquer hora e vê dados frescos
✓ Auditoria completa de TUDO que aconteceu (cada run loggada)
```

**Bora colocar o robô pra trabalhar 24/7 pra você. 🤖**
