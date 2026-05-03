# 🌐 Remote Connector — usando o agente "Meta Ads AI" no claude.ai web

> Conecta o MCP `base-trafego` como **custom connector** no claude.ai/web, claude.ai/mobile, ou em outros clientes MCP que suportam HTTP. Isso te dá acesso ao agente de qualquer dispositivo, sem depender do Claude Desktop.

---

## 🎯 Quando usar Remote Connector vs Claude Desktop

| | Claude Desktop (stdio) | Remote Connector (HTTP) |
|---|---|---|
| Funciona em desktop (PC) | ✅ | ✅ |
| Funciona no celular | ❌ | ✅ |
| Funciona no claude.ai/web | ❌ | ✅ |
| Cowork (tarefas agendadas) | ✅ | ❌ |
| Latência | ~instantânea (local) | ~200-500ms (rede) |
| Setup | `claude_desktop_config.json` | URL + Token |

**Recomendação prática**: configura **os dois**. Desktop pra automação Cowork rodando 24/7, web/mobile pra consultas de qualquer lugar.

---

## ⚙️ Pré-requisitos

Antes de configurar o connector no claude.ai, **a env var `MCP_AUTH_TOKEN`** precisa estar setada na Vercel.

### Passo 1 — adicionar a env var na Vercel

1. Abre: **https://vercel.com/kps-projects-b5c26735/base-trafego-command/settings/environment-variables**
2. Clica **Add New** → tipo **Plaintext**
3. Preenche:

   | Campo | Valor |
   |---|---|
   | Name | `MCP_AUTH_TOKEN` |
   | Value | `NuTT3A9gq5HZVGinojL-wvRfluVbSHTGIDqlyu4GXUw` |
   | Environments | ✅ Production, Preview, Development |

4. **Save**
5. **Redeploy** (Vercel → Deployments → último deploy → "..." → Redeploy) — necessário pra env entrar em produção

> ⚠️ **Mantém esse token secreto**. Quem tiver ele pode operar 100% do seu MCP. Se vazar, regera (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`) e atualiza na Vercel + no connector.

### Passo 2 — verifica que tá no ar

```bash
curl -X POST "https://base-trafego-command.vercel.app/api/mcp" \
  -H "Authorization: Bearer NuTT3A9gq5HZVGinojL-wvRfluVbSHTGIDqlyu4GXUw" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": { "name": "curl-test", "version": "1.0" }
    }
  }'
```

Resposta esperada (200 OK):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {}, "resources": {...}, "prompts": {...} },
    "serverInfo": { "name": "base-trafego", "version": "1.0.0" }
  }
}
```

Se receber **401**: token errado. Confere na Vercel.
Se receber **500**: env var ausente — confere `MCP_AUTH_TOKEN` na Vercel + redeploy.

---

## 🔌 Configurar no claude.ai (web)

1. Abre **https://claude.ai/**
2. Avatar (canto inferior esquerdo) → **Settings** → **Connectors**
3. Scroll até **Custom Connectors** → **Add custom connector**
4. Preenche:

   | Campo | Valor |
   |---|---|
   | **Name** | `Meta Ads AI — BASE` |
   | **Description** (opcional) | `Plataforma BASE Tráfego Command — registra ações Meta Ads, sincroniza dashboards, dispara alertas` |
   | **MCP Server URL** | `https://base-trafego-command.vercel.app/api/mcp` |
   | **Authentication** | `OAuth` ❌ — escolhe **No authentication** (nosso esquema é Bearer custom no header) |
   | **Custom HTTP Headers** | adiciona: `Authorization` = `Bearer NuTT3A9gq5HZVGinojL-wvRfluVbSHTGIDqlyu4GXUw` |

5. **Add connector**
6. Aguarda Claude testar a conexão (deve passar em ~3s)
7. Após conectado, **toggle ON** o connector

> 💡 Algumas versões do claude.ai exigem OAuth pra connectors custom. Se a opção "Custom HTTP Headers" não aparecer, você precisa esperar o suporte habilitar (atualmente em rollout) ou usar o Claude Desktop temporariamente.

---

## 🧪 Testar dentro do claude.ai

Em qualquer conversa do `Meta Ads AI` project (ou nova convo na web):

```
Lista meus clientes
```

Esperado: Claude usa a tool `list_clients` via remote connector e retorna os 3 clientes (Just Burn, Beat Life, Manchester).

```
Quantas tools de base-trafego tô vendo?
```

Esperado: Claude lista as 48 tools registradas (12 categorias).

---

## 🔐 Segurança — o que tá protegido

| Camada | Defesa |
|---|---|
| Transport | TLS 1.3 (Vercel default) |
| Auth | Bearer token de 256 bits — sem token, 401 |
| Tools | Cross-tenant block (resource_id deve bater com client_id) |
| DB | RLS Postgres + Service Role atrás do MCP (cliente nunca tem service key) |
| Audit | Toda chamada vira `tool.invoke` no log + audit_log no Postgres |
| Rate limit | `rateLimit()` em tools sensíveis (write/destructive) |
| Logs | Vercel Logs (filtra por path `/api/mcp`) |

### O que **não** acontece via remote connector

- ❌ Cliente nunca acessa Supabase service_role_key (fica na Vercel)
- ❌ Tools que requerem credenciais Meta (oauth) não rodam aqui — Meta API real só via MCP oficial Meta no Claude Desktop
- ❌ Operações destructivas (delete) sempre com guard adicional + audit_log

---

## 🛠️ Como usar bem em paralelo (web + desktop)

**Cenário ideal**:

```
Claude Desktop (PC do Kendy):
├─ MCP oficial Meta (stdio) ─ cria/edita campanhas reais
├─ MCP base-trafego (stdio) ─ registra na plataforma
└─ Cowork agendado ─ sync matinal + alerts + report semanal

Claude.ai web (qualquer device):
└─ MCP base-trafego (remote HTTP) ─ leitura, status, mensagens pra clientes
```

**Tarefas que dão match no web/mobile**:

- ✅ "Como tá o Just Burn agora?"
- ✅ "Lista alertas ativos"
- ✅ "Manda mensagem pra Marina avisando que aprovei o criativo"
- ✅ "Gera report semanal pro Beat Life"
- ✅ "Compara performance Manchester últimos 7d vs 14d"

**Tarefas que continuam mais ergonômicas no Desktop**:

- 🎯 Criar/editar campanha real (precisa MCP Meta)
- 🎯 Sincronizar massivamente (Cowork dispara automático)
- 🎯 Operações longas (timeout 60s no remote, 5min+ no Desktop)

---

## 🆘 Troubleshooting

### Claude.ai diz "Failed to connect"

1. Testa o curl do passo 2 acima — se falhar, problema é Vercel
2. Confere log Vercel: https://vercel.com/kps-projects-b5c26735/base-trafego-command/logs?path=/api/mcp
3. Se 401: token errado no header
4. Se 500: env var ausente
5. Se timeout: deploy ainda buildando ou travado — espera 2min, tenta de novo

### Tool retorna `RATE_LIMIT`

Você chamou demais. O guard local da MCP tem cap de ~30 calls/min em tools destrutivas. Espera 30s.

### Tool retorna `CROSS_TENANT_BLOCKED`

Passou um `campaign_id` (ou similar) de cliente A com `client_id` de cliente B. É proteção. Confere o cliente.

### Resposta vem em SSE chunks ilegíveis

Configure o connector com `Accept: application/json` (sem `text/event-stream`). Nossa rota tá em modo `enableJsonResponse: true`, então sempre devolve JSON unitário.

### Token vazou — preciso revogar

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

→ atualiza `MCP_AUTH_TOKEN` na Vercel → redeploy → atualiza header em todos os connectors que usavam.

---

## 📊 Monitoramento

- **Logs em tempo real**: https://vercel.com/kps-projects-b5c26735/base-trafego-command/logs
- **Filtra por rota**: filtro `path:/api/mcp`
- **Audit log no DB**: tabela `audit_log` no Supabase (toda tool.invoke é registrada lá com `client_id`, `tool_name`, `actor=mcp-server`)

---

## 🔄 Trocando de token

Quando quiser rotacionar (boa prática a cada 90 dias):

1. Gera novo token: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
2. Vercel → Env Vars → edita `MCP_AUTH_TOKEN` → cola novo valor → Save
3. Vercel → Deployments → ultimo → Redeploy
4. claude.ai → Settings → Connectors → `Meta Ads AI — BASE` → Edit → atualiza header
5. Testa: `curl ... initialize` com novo token

---

**Pronto pra operar de qualquer lugar! 🚀**
