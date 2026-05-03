# ⚡ QUICK START — Configurar Claude Desktop em 10 minutos

> Passo-a-passo prático com prints + comandos. Após esse setup, você terá o agente "Agente BASE" rodando no Claude Desktop, sincronizando com a plataforma BASE em tempo real.

---

## ✅ Checklist inicial

```
☐ Claude Desktop instalado (Plus/Max/Team plan)
☐ Schema Supabase aplicado (já fiz ✓)
☐ Bootstrap rodado (já fiz ✓ — admin + 3 clientes seed)
☐ Plataforma deployada em https://base-trafego-command.vercel.app (já fiz ✓)
☐ MCP server buildado em apps/mcp/dist/ (já fiz ✓)
☐ MCP oficial Meta já conectado no seu Claude Desktop
```

---

## 1️⃣ Abrir o config do Claude Desktop (1 min)

### Windows

Pressione `Win + R`, cola:

```
%APPDATA%\Claude\claude_desktop_config.json
```

Abre no editor (VS Code ou Notepad).

### Se o arquivo não existir

Cria ele com conteúdo `{ "mcpServers": {} }`. Vai aparecer depois de abrir Claude Desktop pela primeira vez.

---

## 2️⃣ Adicionar nosso MCP (2 min)

O arquivo já está pronto em:

```
C:\Users\Gabriel\Downloads\TEMPLATES GERAIS IA\saastrafego\base-trafego-command\local-config\claude_desktop_config.json
```

**Opção A — Substituir tudo** (mais rápido se você não tem outros MCPs além do Meta):

Copia o conteúdo de `local-config/claude_desktop_config.json` direto pro `%APPDATA%\Claude\claude_desktop_config.json`.

**Opção B — Mesclar com config existente**:

Se você já tem `mcpServers` com o MCP oficial do Meta, ADICIONA dentro de `mcpServers`:

```json
{
  "mcpServers": {
    "meta-marketing": {
      ... (sua config existente do Meta) ...
    },
    "base-trafego": {
      "command": "node",
      "args": [
        "C:\\Users\\Gabriel\\Downloads\\TEMPLATES GERAIS IA\\saastrafego\\base-trafego-command\\apps\\mcp\\dist\\index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://fhjkgbjavpitkhgptbvp.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoamtnYmphdnBpdGtoZ3B0YnZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc4NTI2NCwiZXhwIjoyMDkzMzYxMjY0fQ.tiSM2NcsZeUZAlPBQFpg2GQaSEPuqGVFSvzay8ld3W0",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoamtnYmphdnBpdGtoZ3B0YnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3ODUyNjQsImV4cCI6MjA5MzM2MTI2NH0.8PkQesCLq83X4VGWczcHZSAGxcNMx7qZuLdnuc20uvM",
        "SUPABASE_ENCRYPTION_KEY": "b7512bee6bfe4b0541b7f9c9656dcf85c3f6a8110d4861d9637771bd26153908",
        "USE_META_MOCK": "true",
        "META_API_VERSION": "v22.0",
        "PLATFORM_URL": "https://base-trafego-command.vercel.app",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

> ⚠️ Cuidado com vírgulas: JSON exige vírgula entre objetos mas NÃO depois do último.

---

## 3️⃣ Reiniciar Claude Desktop (30 seg)

- Botão direito no ícone do Claude na bandeja → **Quit**
- Reabre Claude Desktop

---

## 4️⃣ Validar conexão (1 min)

Abre uma conversa nova e digita:

```
Lista meus clientes
```

**Resposta esperada**:

```
Você tem 3 clientes ativos:

1. **Just Burn Club** — Pro · R$ 15k/mês · fitness · BH
2. **Beat Life** — Pro · R$ 12k/mês · suplementos
3. **Manchester Burger** — Starter · R$ 4.5k/mês · alimentação

Algum específico que quer analisar?
```

✅ Se aparecer isso, MCP conectado. Ir pro passo 5.
❌ Se Claude disser "não tenho acesso a essa ferramenta", revisa passo 2.

---

## 5️⃣ Criar Claude Project (2 min)

Pra ter contexto persistente sem precisar repetir o system prompt em cada conversa:

1. Claude Desktop → painel esquerdo → **Projects** → **+ New Project** (ou abre o existente)
2. **Name**: `Meta Ads AI` (ou outro — o nome em si não muda comportamento)
3. **Description**: `Operação Meta Ads multi-cliente da Agência BASE`
4. Clica **Create Project**

### Adicionar Custom Instructions

1. No projeto criado → **Project Knowledge** → **Custom Instructions**
2. Cola o conteúdo entre `─── INÍCIO ───` e `─── FIM ───` de:
   ```
   docs/claude-desktop/SYSTEM-PROMPT.md
   ```
3. **Save**

### Adicionar arquivos como conhecimento

1. **Project Knowledge** → **Add Files**
2. Faz upload de:
   - `docs/claude-desktop/WORKFLOWS.md`
   - `docs/claude-desktop/REALTIME.md`
   - `docs/claude-desktop/TOOLS-REFERENCE.md` (se já criado)
   - `docs/SECURITY.md`
3. Claude vai usar esses como referência em toda conversa do projeto

---

## 6️⃣ Primeira conversa "real" (3 min)

Dentro do projeto criado, abre nova conversa:

### Teste 1 — analisar cliente

```
Como tá o Just Burn?
```

Esperado: Claude busca via `get_client_summary`, mostra alertas (se houver), métricas, recomendações estruturadas.

> **Nota**: como ainda não rodou nenhuma campanha real e não há `performance_snapshots` no banco, vai mostrar "sem dados ainda — quer que eu sincronize agora via MCP Meta?"

### Teste 2 — registrar campanha (modo dry-run)

```
Hipoteticamente, vou criar uma campanha conversão pro Just Burn 
R$ 200/dia. Me explica o passo-a-passo que você seguiria.
```

Esperado: Claude descreve workflow WF-01 sem executar (porque você disse "hipoteticamente").

### Teste 3 — sync de performance

```
Sincroniza dados Meta dos meus 3 clientes pra plataforma agora
```

Esperado: 
1. Claude itera os 3 clientes
2. Pra cada um chama Meta `get_insights` (via outro MCP)
3. Chama nosso `record_performance_snapshot` por cada nível (campaign, ad_set, ad)
4. Reporta sucesso

### Teste 4 — vincular conta Meta dos seus clientes reais

```
Vou conectar minha conta Meta da Just Burn (você já tem acesso 
via Business Manager). Preciso vincular ela ao client_id do Just Burn 
na plataforma.

Meta Business ID: <ID que você pega no Business Manager>
Ad Account ID:    <act_xxxx — o número, sem o "act_">
Nome:             Just Burn — BM Principal
```

Esperado: Claude chama `link_meta_account(client_id, meta_business_id, meta_account_id, ...)` e vincula.

---

## 7️⃣ Login real na plataforma (2 min)

Em paralelo ao Claude Desktop:

1. Abre **https://base-trafego-command.vercel.app/login**
2. Digita: `contato@kendyproducoes.com.br`
3. Recebe magic link por email (Resend)
4. Clica → entra em `/admin`
5. Vê os 3 clientes, feed Claude (vai aparecer atividade conforme você usa)

---

## 8️⃣ Configurar Resend SMTP (3 min — opcional, recomendado)

Pra emails saírem com a marca BASE em vez de `noreply@mail.app.supabase.io`:

1. Abre: **https://supabase.com/dashboard/project/fhjkgbjavpitkhgptbvp/auth/providers**
2. Scroll até **SMTP Settings** → toggle ON
3. Preenche:
   ```
   Sender email:    onboarding@resend.dev
   Sender name:     BASE Tráfego Command
   Host:            smtp.resend.com
   Port:            465
   Username:        resend
   Password:        re_44mRzm3d_4ieDAt8nVR3MPyxUmwXwq2DZ
   ```
4. **Save**
5. **Send test email** pra `contato@kendyproducoes.com.br` → verifica chegada

---

## 🎯 Workflow diário sugerido

### Toda manhã (5 min)

```
Você abre Claude Desktop → projeto Meta Ads AI → digita:

"Bom dia, faz um sync geral e me passa o resumo da operação"
```

Claude:
1. Sincroniza performance dos 3 clientes (lê Meta + registra plataforma)
2. Detecta anomalias e cria alerts
3. Lista aprovações pendentes
4. Mostra top performers da noite
5. Sugere 3-5 ações pro dia

### Quando algo importante acontecer

Cliente abre dashboard, vê em tempo real. Você recebe alerta no Claude:

```
"Tem alerta novo, o que aconteceu?"
```

Claude analisa, sugere fix, executa com aprovação.

### Toda sexta (10 min)

```
"Gera relatórios semanais pros 3 clientes e manda mensagem pra cada um"
```

Claude:
1. WF-06 pra cada cliente
2. send_message_to_client com link do report
3. Cliente vê email + dashboard

---

## 🔍 Troubleshooting

### Claude diz "não tenho a tool register_campaign"

→ Build do MCP travou. Roda:
```bash
cd "c:/Users/Gabriel/Downloads/TEMPLATES GERAIS IA/saastrafego/base-trafego-command"
pnpm --filter @base-trafego/mcp run build
```
Reinicia Claude Desktop.

### Claude erro `CROSS_TENANT_BLOCKED`

→ Você tentou passar campaign_id de cliente A com client_id de cliente B. Isso é proteção. Re-confirma o cliente correto.

### Claude erro `RATE_LIMIT`

→ Você está chamando muito rápido. Espere ~30s e tente novamente.

### Plataforma não atualiza ao vivo

→ Verifica que o navegador tem WebSocket aberto (DevTools → Network → WS):
- Deve ter conexão ativa pra `wss://fhjkgbjavpitkhgptbvp.supabase.co/realtime/v1/websocket`
- Se não tiver: F5, ou problema de proxy corp

### Magic link não chega

→ 1) Spam folder
→ 2) Resend SMTP configurado? (passo 8)
→ 3) Auth → Logs no Supabase Dashboard

---

## 📚 Próximos passos

1. **Conectar contas Meta reais** dos clientes via `link_meta_account` (passo 6.4)
2. **Convidar clientes finais** pra usar dashboard:
   - Admin → /admin/clients/[id] → aba Usuários → email
   - Cliente recebe magic link pra acessar /cliente/<slug>
3. **Configurar agent_configs** customizadas por cliente em /admin/agent-config
4. **Testar primeira campanha real** (com budget pequeno R$ 50/dia pra validar fluxo end-to-end)

---

## 🎉 Você está pronto!

Resumo do que tá no ar:

```
✅ Plataforma deployada em produção (Vercel)
✅ Banco Supabase com schema completo + RLS + Realtime
✅ Conta super_admin: contato@kendyproducoes.com.br
✅ 3 clientes seed pra testar
✅ MCP server buildado (44 tools)
✅ Claude Desktop configurado com agente "Agente BASE"
✅ Sync em tempo real (< 500ms Claude → cliente)
✅ Audit trail completo
✅ Hardening multi-tenant (cross-tenant block ativo)
```

**Bora operar! 🚀**
