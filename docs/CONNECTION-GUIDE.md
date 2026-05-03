# 🔌 GUIA DE CONEXÃO DE CONTAS — BASE Tráfego Command

> Passo-a-passo pra plugar **Supabase + Meta + Anthropic + Resend + Vercel + Claude Desktop** no projeto que acabou de ser construído.
> Tempo estimado: **60-90 minutos** (com calma).
>
> Ao final, você terá MVP completo no ar — admin operando + cliente vendo realtime + Claude Desktop comandando Meta Ads via MCP.

---

## ✅ Pré-requisitos (instalações locais)

```bash
# Node 20 LTS+
node -v          # >= 20.0

# Bun (recomendado)
# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Supabase CLI
# Windows (scoop)
scoop install supabase
# macOS
brew install supabase/tap/supabase

# Git, Cursor / VS Code, Claude Desktop instalados
```

---

## 1️⃣ Supabase (15 min)

### 1.1 Criar projeto

1. https://supabase.com → **New Project**
2. Nome: `base-trafego-command`
3. DB Password: gere e GUARDE (1Password / cofre)
4. Region: **South America (São Paulo)** — `sa-east-1`
5. Plano: **Free** pra começar (depois Pro $25/mês)
6. Aguarda ~2 min

### 1.2 Pegar credenciais

- Vá em **Settings → API**
- Copie:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` (perigoso!) → `SUPABASE_SERVICE_ROLE_KEY`
- Vá em **Settings → Database** → copie `Connection string` se precisar

### 1.3 Aplicar schema

```bash
cd base-trafego-command

# Vincula a CLI ao seu projeto
supabase link --project-ref <project-ref>
# Será pedido o DB password — use o do passo 1.1

# Aplica todas as migrations
supabase db push
```

> Alternativa manual: cole `supabase/migrations/20260502000000_initial_schema.sql`,
> depois `_storage_buckets.sql`, `_realtime_publication.sql`, `_extensions_and_helpers.sql`
> no SQL Editor do Dashboard, em ordem.

### 1.4 Configurar Auth providers

Dashboard Supabase → **Authentication → Providers**:

```
☑ Email
   - Enable Email provider: ON
   - Confirm email: ON
   - Magic link: ON

☑ Google OAuth (opcional)
   - Crie OAuth client em https://console.cloud.google.com/apis/credentials
   - Authorized redirect URI:
     https://<project-ref>.supabase.co/auth/v1/callback
   - Cole Client ID e Secret no Supabase

URL Configuration:
   Site URL: http://localhost:3000  (dev)
   Site URL: https://command.agenciabase.tech  (prod)
   Redirect URLs (uma por linha):
     http://localhost:3000/auth/callback
     https://command.agenciabase.tech/auth/callback
```

### 1.5 Verificar Realtime + Storage

- **Database → Replication**: confirme que `alerts`, `approvals`, `claude_actions`,
  `performance_snapshots`, `ads`, `notifications`, `messages` estão habilitados
  (já estão via migration `_realtime_publication.sql`).
- **Storage**: confirme buckets `creatives`, `reports`, `avatars`, `client-logos`.

### 1.6 Criar primeiro admin

1. Authentication → **Users → Add user** → email `kendy@agenciabase.tech` (ou seu)
2. SQL Editor:
   ```sql
   update profiles
   set role = 'super_admin', full_name = 'Kendy'
   where email = 'kendy@agenciabase.tech';
   ```

### 1.7 Gerar tipos TypeScript

```bash
# Setando env var
SUPABASE_PROJECT_ID=<project-ref> bun run db:types
```

---

## 2️⃣ Anthropic API (5 min)

1. https://console.anthropic.com
2. **Create Key** → cole em `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
3. (Opcional) Setar limite de gasto em Settings → Limits.

> **Nota**: o MCP server NÃO usa o Anthropic SDK por padrão (Claude Desktop é quem faz isso).
> Essa key fica disponível pra futuras tools que precisem invocar Claude programaticamente.

---

## 3️⃣ Meta Marketing API (20 min)

### 3.1 Criar App

1. https://developers.facebook.com → **My Apps → Create App**
2. Type: **Business** · Name: `BASE Trafego Command`
3. Após criar, em **Add Product → Marketing API → Set Up**

### 3.2 Permissões + Verificação

Marketing API → Tools → **Generate Access Token**:

```
☑ ads_management
☑ ads_read
☑ business_management
☑ pages_show_list
☑ pages_read_engagement
☑ instagram_basic
☑ instagram_content_publish
```

Em modo **Development**, você pode testar com até 5 contas Meta sem precisar de
Business Verification. Pra liberar pra clientes externos, faça Business Verification
(pode demorar 7-15 dias).

### 3.3 Configurar Settings → Basic

- **App ID** → `META_APP_ID`
- **App Secret** (clique em Show) → `META_APP_SECRET`
- **Privacy Policy URL** → `https://command.agenciabase.tech/privacy`
- **Terms of Service URL** → `https://command.agenciabase.tech/terms`

### 3.4 Adicionar Redirect URI (Facebook Login)

Add Product → **Facebook Login → Set Up → Settings**:

```
Valid OAuth Redirect URIs:
   http://localhost:3000/api/auth/meta/callback
   https://command.agenciabase.tech/api/auth/meta/callback
```

### 3.5 Webhook (opcional, mas recomendado)

Add Product → **Webhooks → Edit subscription**:

```
Callback URL:  https://command.agenciabase.tech/api/webhooks/meta
Verify Token:  <gere uma string aleatória>  → cole em META_VERIFY_TOKEN
Subscribe:     ad_account, page (eventos relevantes)
```

> Em local dev, use ngrok pra expor `/api/webhooks/meta`.

---

## 4️⃣ Resend (envio de email) — 5 min

1. https://resend.com → cria conta
2. **API Keys → Create API Key** → cole em `RESEND_API_KEY`
3. **Domains → Add Domain** → `agenciabase.tech` → siga DNS instructions
   (SPF/DKIM/MX no Cloudflare)
4. Após verificar, use `command@agenciabase.tech` como `RESEND_FROM_EMAIL`

> Opcional: configurar Resend como SMTP custom no Supabase Auth pra magic links com sua marca.

---

## 5️⃣ Vercel (deploy) — 10 min

### 5.1 Preparar repo

```bash
cd base-trafego-command
git init
git add .
git commit -m "feat: initial scaffold"
gh repo create base-trafego-command --private --source=. --remote=origin --push
```

### 5.2 Conectar no Vercel

1. https://vercel.com/new
2. Import `base-trafego-command`
3. Framework: **Next.js** (auto-detect)
4. **Root Directory**: `apps/web`
5. Build Command: `cd ../.. && bun install && bun run build --filter=@base-trafego/web`
6. Output Directory: `.next`

### 5.3 Variáveis de ambiente (Vercel)

Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ENCRYPTION_KEY        ← string aleatória 32+ chars
ANTHROPIC_API_KEY
META_APP_ID
META_APP_SECRET
META_API_VERSION = v22.0
META_VERIFY_TOKEN
RESEND_API_KEY
RESEND_FROM_EMAIL = command@agenciabase.tech
NEXT_PUBLIC_APP_URL = https://command.agenciabase.tech
CRON_SECRET                     ← string aleatória pra autenticar /api/cron/*
```

### 5.4 Custom domain

Vercel → Domains → Add `command.agenciabase.tech`

Cloudflare DNS:
```
CNAME  command  cname.vercel-dns.com   (Somente DNS)
```

### 5.5 Cron habilitar

`apps/web/vercel.json` já está configurado com:
```
*/15 * * * *   /api/cron/meta-sync          (a cada 15min)
0 */6 * * *    /api/cron/detect-anomalies   (a cada 6h)
```
Eles ativam automático no plano Pro/Enterprise (Hobby tem limites).

---

## 6️⃣ MCP Server + Claude Desktop (10 min)

### 6.1 Build local

```bash
cd apps/mcp
cp .env.example .env
# Edite .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, USE_META_MOCK=true (pra começar)

bun install
bun run build
```

### 6.2 Configurar Claude Desktop

Localização do config:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Adicione (substitua o caminho!):

```json
{
  "mcpServers": {
    "base-trafego": {
      "command": "node",
      "args": [
        "C:\\Users\\Gabriel\\Downloads\\TEMPLATES GERAIS IA\\saastrafego\\base-trafego-command\\apps\\mcp\\dist\\index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJ...",
        "SUPABASE_ENCRYPTION_KEY": "matenha-igual-do-vercel",
        "META_APP_ID": "",
        "META_APP_SECRET": "",
        "META_API_VERSION": "v22.0",
        "ANTHROPIC_API_KEY": "sk-ant-api03-...",
        "PLATFORM_URL": "https://command.agenciabase.tech",
        "PLATFORM_WEBHOOK_SECRET": "",
        "USE_META_MOCK": "true",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

> 🪟 **Windows**: use `\\` (escape de barras) ou caminhos com `/` no JSON.

### 6.3 Testar

1. **Reinicie o Claude Desktop** (importante!)
2. Nova conversa
3. Digite `/` → você verá `analise-cliente`, `criar-campanha`, etc. listados
4. Pergunte: "Liste meus clientes"
5. Claude deve invocar `list_clients` e retornar os 3 demos do seed

Se aparecer erro:
- Veja logs em `apps/mcp/logs/mcp-server.log`
- Confira que `dist/index.js` existe (rode `bun run build` de novo)
- Confira que SUPABASE_SERVICE_ROLE_KEY está correto

### 6.4 Sair do modo MOCK

Quando `META_APP_ID` e `META_APP_SECRET` estiverem corretos e a primeira conta Meta
estiver conectada via OAuth (`/admin/clients/<id>` → "Conectar Meta Business"), troque:

```
"USE_META_MOCK": "false"
```

E reinicie Claude Desktop. Agora as tools chamam a Meta API real.

---

## 7️⃣ Conectar primeiro cliente real

1. Em produção: `https://command.agenciabase.tech/admin/clients/new`
2. Preencha: nome, slug, plano, limites
3. Detalhe do cliente → aba **Contas Meta** → **Conectar Meta Business**
4. Autorize via Facebook
5. Voltará pra o admin com `?meta_connected=1`
6. Aba **Usuários** → convide email do cliente
7. Cliente recebe magic link, loga em `command.agenciabase.tech/cliente/<slug>`

---

## ✅ Smoke test final

```bash
# 1. Health check
curl https://command.agenciabase.tech/api/health
# {"status":"ok",...}

# 2. Login com seu email no /login → recebe magic link → entra em /admin

# 3. Claude Desktop:
#    - "/analise-cliente client_slug=just-burn"
#    - Deve chamar 5+ tools sem erro

# 4. Cron manual (admin):
curl -H "Authorization: Bearer $CRON_SECRET" https://command.agenciabase.tech/api/cron/meta-sync
```

---

## 🚨 Troubleshooting

| Sintoma | Possível causa | Ação |
|---|---|---|
| `Invalid API key` no Supabase | URL ou key trocados | Confira `.env.local` |
| Auth callback redireciona pra `/auth/error` | Redirect URL não cadastrado | Supabase → Auth → URL Configuration |
| Realtime não atualiza | Tabela não está na publication | Rode `_realtime_publication.sql` de novo |
| Claude Desktop não vê o servidor | Caminho errado ou build falhou | `apps/mcp/logs/mcp-server.log` |
| Meta OAuth retorna `invalid_state` | Cookie expirou (>10min) | Tente de novo |
| Token Meta dá `decrypt_failed` | `SUPABASE_ENCRYPTION_KEY` mudou | Use a mesma key em web + mcp |
| Cron não dispara | Plano Vercel Hobby limita | Use Pro ou external scheduler (cron-job.org) |

---

## 🎉 Pronto!

Você tem agora:

- ✅ Supabase com schema completo + RLS + Realtime
- ✅ Web app no ar em `command.agenciabase.tech`
- ✅ MCP server conectado no Claude Desktop
- ✅ 1 cliente real onboardado e operando
- ✅ Cron sincronizando Meta a cada 15 min
- ✅ Anomaly detection rodando a cada 6 h
- ✅ Auditoria completa em todas as ações
- ✅ Aprovação humana obrigatória pra ações sensíveis

**Bem-vindo ao futuro da operação de tráfego pago. 🚀**
