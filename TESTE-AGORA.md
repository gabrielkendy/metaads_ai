# 🧪 TESTE AGORA — 5 smoke tests em 10 minutos

> Faz na ordem. Cada um valida uma camada do sistema. Se passar todos os 5, **a plataforma está 100% operacional**.

---

## 🎬 Setup pra teste (1 min)

Abre **3 janelas/abas** lado a lado:

1. **Claude Desktop** — janela do Projeto BASE Tráfego Command (ou conversa nova)
2. **Browser ABA 1**: https://base-trafego-command.vercel.app/login
3. **Browser ABA 2**: https://supabase.com/dashboard/project/fhjkgbjavpitkhgptbvp/editor

Pronto.

---

## 🧪 TESTE 1 · Claude Desktop conectado ao MCP `base-trafego`

### Comando (digita no Claude Desktop)

```
Lista meus clientes da plataforma BASE
```

### Resposta esperada

Claude deve retornar **3 clientes** (Just Burn, Beat Life, Manchester) com plano e limite. Algo como:

> Você tem 3 clientes ativos:
>
> 1. **Just Burn Club** — Pro · R$ 15.000/mês · fitness
> 2. **Beat Life** — Pro · R$ 12.000/mês · supplements
> 3. **Manchester Burger** — Starter · R$ 4.500/mês · food

### ✅ Passou se

- Mostra 3 clientes
- Os nomes batem
- Não dá erro "tool not found" ou "MCP server not available"

### ❌ Se falhar

| Sintoma | Fix |
|---|---|
| "não tenho acesso a essa ferramenta" | MCP não conectou. Verifica `claude_desktop_config.json` + reinicia Claude |
| "TIMEOUT" ou "ECONNREFUSED" | Build MCP corrupto. Roda `cd apps/mcp && pnpm build` |
| Claude mostra clientes errados/diferentes | Provável que pegou doutro Supabase. Confere `SUPABASE_URL` no config |

---

## 🧪 TESTE 2 · Login real (magic link via Resend)

### Passos

1. **ABA 1** do browser: https://base-trafego-command.vercel.app/login
2. Email: `contato@kendyproducoes.com.br`
3. Clica **"Receber link mágico"**
4. Toast deve aparecer: "Link enviado. Verifique seu email."

### Verifica email (caixa de entrada de `contato@kendyproducoes.com.br`)

Email deve chegar em < 30s com:

- **De**: `BASE Tráfego Command <onboarding@resend.dev>` ✅ (era `noreply@mail.app.supabase.io`)
- **Assunto**: algo como "Seu link mágico" ou "Confirm your signup"
- **Conteúdo**: botão/link "Confirm your email"

5. Clica no link → cai em https://base-trafego-command.vercel.app/admin

### ✅ Passou se

- Email chega rápido
- Email vem com **"BASE Tráfego Command"** no remetente (não Supabase genérico)
- Link redireciona pra `/admin` e mostra o dashboard com 3 clientes

### ❌ Se falhar

| Sintoma | Fix |
|---|---|
| Email não chega | Spam folder + verifica logs em https://resend.com/emails |
| Email vem como `mail.app.supabase.io` | SMTP do Resend não foi salvo. Volta no Supabase Dashboard SMTP Settings |
| Link redireciona pra `/auth/error` | URL Configuration do Supabase tá errada. Verifica que tem `https://base-trafego-command.vercel.app/auth/callback` na lista |
| `/admin` mostra "não tem permissão" | Profile não foi promovido. Roda `node scripts/bootstrap.mjs` denovo |

---

## 🧪 TESTE 3 · Realtime flow — Claude registra, plataforma atualiza ao vivo

Esse é o teste mais legal. Você vai criar uma campanha **mock** via Claude e ver aparecer na plataforma **em tempo real**.

### Setup

- Browser **ABA 1**: já tá em `/admin/clients/just-burn` (do TESTE 2)
- Claude Desktop: nova conversa

### Comando no Claude Desktop

Cola exatamente isso:

```
Vamos fazer um TESTE: registra na plataforma uma campanha mock pro Just Burn 
chamada "TESTE-Smoke-001" com objetivo OUTCOME_SALES e R$ 100/dia. 

Usa register_campaign direto (sem chamar Meta API real). 
O meta_campaign_id é "mock_test_001". 

Antes disso, busca o UUID interno da meta_account primária do Just Burn 
via get_client_meta_account_uuid.

Reasoning: "Smoke test end-to-end pra validar Realtime funcionando"
```

### O que Claude deve fazer (você acompanha pelos turnos dele)

1. `get_client(slug="just-burn")` → pega `client_id`
2. Tentar `get_client_meta_account_uuid` → vai retornar **erro NOT_FOUND** (porque ainda não vinculamos conta Meta real ao Just Burn)
3. Claude vai te avisar: "Preciso primeiro vincular uma conta Meta. Quer que eu faça mock?"

### Continua

```
Perfeito. Antes faz link_meta_account com:
- meta_business_id: "test_bm_001"  
- meta_account_id: "test_acc_001"
- meta_account_name: "Just Burn — Conta Mock Teste"
- is_primary: true

Depois faz o register_campaign.
```

### Claude vai

1. `link_meta_account(...)` → cria meta_account, retorna o UUID interno
2. `register_campaign(client_id, meta_account_id=UUID_interno, meta_campaign_id="mock_test_001", name="TESTE-Smoke-001", ...)` → cria campanha
3. Confirma sucesso

### 🎯 AGORA — verifica plataforma

**Browser ABA 1** — https://base-trafego-command.vercel.app/admin/clients

- Deve aparecer card do **Just Burn Club** com **1 campanha ativa** (ou aguardando)

Vai em **Just Burn → Detalhes**:

- Aba **Contas Meta**: deve mostrar "Just Burn — Conta Mock Teste"
- Lista de campanhas: deve mostrar **"TESTE-Smoke-001"**

**Browser ABA 2** — Supabase SQL Editor — testa o que ficou no banco:

```sql
select id, name, status, daily_budget, created_by_claude, created_at 
from campaigns 
where client_id = '5f08f91d-5469-4893-84b0-babe9b6171c0';
```

Deve retornar 1 linha com a campanha de teste.

### ✅ Passou se

- Claude executou ambas tools sem erro
- Campanha aparece na plataforma em < 5s (sem refresh do browser, se browser estava aberto)
- SQL retorna a linha

### ❌ Se falhar

| Sintoma | Fix |
|---|---|
| `CROSS_TENANT_BLOCKED` | Você passou meta_account_id de outro cliente. Re-confirma |
| `INVALID_CLIENT_ID` | UUID malformado. Use exatamente o do `get_client` |
| Campanha não aparece na plataforma | F5 no browser. Se aparecer no F5 mas não live, Realtime tá desligado |

---

## 🧪 TESTE 4 · Mensagem cliente em tempo real

### Comando no Claude Desktop

```
Manda uma mensagem teste pro Just Burn dizendo que estamos validando 
o sistema. Use send_message_to_client. 

Sender: contato@kendyproducoes.com.br
Conteúdo: "🧪 TESTE: validando comunicação automática Claude → plataforma → cliente"
```

### Verifica

**ABA 1**: navega pra `https://base-trafego-command.vercel.app/cliente/just-burn/mensagens`

> ⚠️ Como super_admin, você consegue acessar a dashboard de qualquer cliente.

A mensagem deve aparecer no chat do cliente Just Burn instantaneamente.

### ✅ Passou se

- Mensagem aparece no painel do cliente
- Vem como sender = "Agência BASE"
- Timestamp recente

---

## 🧪 TESTE 5 · Performance snapshot + dashboard

### Comando no Claude Desktop

```
Registra um snapshot de performance fictício pro Just Burn pra teste:

- client_id: pega via get_client(slug="just-burn")
- period_start: hoje 00:00 UTC
- period_end: agora
- granularity: "day"
- impressions: 12500
- clicks: 342
- spend: 458.32
- conversions: 12
- conversion_value: 2400

Usa record_performance_snapshot. Não passa as métricas derivadas (ctr, cpc, etc) 
— deixa a plataforma calcular automaticamente.
```

### Verifica

**ABA 1**: vai em `https://base-trafego-command.vercel.app/cliente/just-burn`

Deve mostrar (em até alguns segundos):

- Card "Investido hoje": R$ 458,32
- Card "Impressões": 12.5k
- Card "Cliques": 342
- Card "ROAS hoje": 5.24x (calculado automaticamente: 2400/458.32)

### ✅ Passou se

- Métricas aparecem na home do cliente
- ROAS foi calculado certo
- Tudo em formato BR (R$, vírgulas)

---

## 🎉 SE PASSOU OS 5

```
✅ Claude Desktop conectado e operando
✅ MCP "base-trafego" funcionando com guards de segurança
✅ Auth real (magic link via Resend) entregando emails
✅ Realtime sync Claude → plataforma em < 5s
✅ Cliente vê tudo na dashboard sem F5
✅ Métricas derivadas calculadas server-side
```

**Você está oficialmente operando o sistema. 🔥**

Pode começar a:
1. Adicionar contas Meta REAIS dos seus clientes (`link_meta_account` com IDs verdadeiros)
2. Convidar clientes finais (admin → /admin/clients/[id] → aba Usuários)
3. Subir as primeiras campanhas reais

---

## 🧹 Limpar dados de teste depois

Quando estiver tudo validado, roda no Supabase SQL Editor:

```sql
-- Apaga só o que foi criado nos testes
delete from claude_actions where input_payload->>'name' like 'TESTE-%';
delete from campaigns where name like 'TESTE-%';
delete from messages where content like '%🧪 TESTE%';
delete from meta_accounts where meta_account_name like '%Mock Teste%';
delete from performance_snapshots where impressions = 12500 and clicks = 342;
```

Tudo limpo, banco pronto pra produção real.

---

## 🆘 Se algum teste falhar

Manda print do erro no Claude Desktop OU no browser que eu te ajudo. **Não tenta consertar sozinho** — pode ser bug que é melhor eu corrigir e re-deployar.
