# 🚀 Deploy no Vercel — passo-a-passo

> Você (`gabrielkendy`) já está logado no Vercel CLI. Falta apenas autorizar o nome do projeto.

---

## ✅ Status atual da revisão

- ✅ Build local **passa** (Next.js + MCP)
- ✅ Type-check **passa** em todos os workspaces
- ✅ `pnpm install` **passa** sem warnings
- ✅ Dev server **roda** em `http://localhost:3000`
- ✅ Smoke test: `/`, `/login`, `/admin` (redirect), `/pricing`, `/privacy`, `/api/health`, `/api/cron/*`, `/api/webhooks/meta` — todos OK
- ✅ Headers de segurança aplicados (X-Frame, CSP, etc.)
- ✅ Middleware com RLS funcionando (rotas privadas redirecionam pra `/login`)

---

## 📝 Bugs corrigidos durante revisão

1. **`AlertSeverity` import type/value** — schemas Zod precisam ser importados como valor, não tipo
2. **Server action inline em client component** — `<form action={signOut}>` em sidebar
3. **Tipos Supabase v2.47 estavam dando `never`** — Database simplificado pra `any` até gerar tipos reais via `pnpm db:types`
4. **Cookies API com tipos implícitos `any`** — adicionado tipos explícitos
5. **`outputFileTracingRoot` faltando** — corrige aviso de monorepo no Next 15
6. **`typedRoutes` movido pra fora de experimental** — Next 15 mudou
7. **`/api/health` com edge + force-static** — incompatível, removido force-static
8. **NAV badge type** — typed inline pra aceitar undefined
9. **`pickOne` helper** — Supabase relations podem vir como array OU objeto
10. **Realtime publication SQL** — agora idempotente
11. **Env validation** — `optional` agora aceita string vazia (`""` → `undefined`)

---

## 🔓 Próximo passo: autorizar deploy

Você tem duas opções:

### Opção A — Eu faço o deploy (precisa autorização explícita)

Me responda algo como:
> "Pode fazer deploy no projeto `base-trafego-command` na minha conta Vercel"

Quando autorizar, eu rodo:
```bash
cd apps/web
vercel link --yes --project base-trafego-command
vercel pull --yes --environment=preview
vercel deploy --yes --prebuilt=false
```

E retorno a URL pública (`https://base-trafego-command-xxx.vercel.app`).

### Opção B — Você faz manualmente (5 min)

```bash
# Se não tem Vercel CLI:
npm i -g vercel

# Linkar projeto (pergunta nome)
cd "c:/Users/Gabriel/Downloads/TEMPLATES GERAIS IA/saastrafego/base-trafego-command/apps/web"
vercel link

# Pull env vars (se já existirem)
vercel pull --yes

# Deploy preview (URL temporária)
vercel deploy

# Deploy production (URL definitiva)
vercel deploy --prod
```

### Opção C — Importar via UI do Vercel (mais visual)

1. Push do repo no GitHub:
   ```bash
   cd "c:/Users/Gabriel/Downloads/TEMPLATES GERAIS IA/saastrafego/base-trafego-command"
   git init
   git add .
   git commit -m "feat: initial scaffold"
   gh repo create base-trafego-command --private --source=. --push
   ```
2. https://vercel.com/new → Import → escolhe o repo
3. **Root Directory**: `apps/web`
4. Build Command já configurado em `vercel.json`
5. Cole as env vars (template em `.env.example`)
6. Click Deploy

---

## 🔑 Env vars necessárias no Vercel

Antes ou depois do primeiro deploy, configure em **Project → Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL              = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY         = eyJ...
SUPABASE_SERVICE_ROLE_KEY             = eyJ...
SUPABASE_ENCRYPTION_KEY               = string-aleatoria-32+chars
NEXT_PUBLIC_APP_URL                   = https://command.agenciabase.tech
ANTHROPIC_API_KEY                     = sk-ant-api03-...
META_APP_ID                           =
META_APP_SECRET                       =
META_API_VERSION                      = v22.0
META_VERIFY_TOKEN                     = string-aleatoria
RESEND_API_KEY                        = re_...
RESEND_FROM_EMAIL                     = command@agenciabase.tech
CRON_SECRET                           = string-aleatoria
```

> Sem env vars, o **build passa** mas as páginas que dependem do Supabase mostram tela de erro 500 (esperado).

---

## 🌐 Custom domain

Após primeiro deploy:

1. Vercel → Project → **Domains** → Add `command.agenciabase.tech`
2. Cloudflare DNS:
   ```
   Type:   CNAME
   Name:   command
   Target: cname.vercel-dns.com
   Proxy:  Somente DNS (cinza)
   ```
3. SSL automático (Let's Encrypt) em ~30s

---

## 🧪 Testar local agora

```bash
cd "c:/Users/Gabriel/Downloads/TEMPLATES GERAIS IA/saastrafego/base-trafego-command"

pnpm install
cd apps/web && pnpm dev
```

Acessa **http://localhost:3000** — você verá:
- `/` Landing page com hero + features
- `/pricing` 3 planos (Starter, Pro, Premium)
- `/login` formulário magic link
- `/admin` redireciona pra login (esperado, sem auth)
- `/cliente/just-burn` redireciona pra login (esperado)

Quando configurar Supabase real e fizer login com email super_admin, vai entrar em `/admin` com dashboard funcional.

---

## 📡 Cron jobs (Vercel Pro+)

Já configurados em `apps/web/vercel.json`:

- `*/15 * * * *` → `/api/cron/meta-sync` (sync Meta API)
- `0 */6 * * *` → `/api/cron/detect-anomalies` (detecta CTR drop, fadiga)

Hobby plan tem limite de 2 cron/dia — pra rodar a cada 15min precisa de Pro ($20/mês).

Alternativa free: agendar via **cron-job.org** apontando pros endpoints com header `Authorization: Bearer <CRON_SECRET>`.

---

## ✅ Checklist final pré-deploy

- [ ] `pnpm install` na máquina local rodou sem erro
- [ ] `pnpm build:web` passou (já confirmei)
- [ ] Conta Vercel logada (`vercel whoami` → `gabrielkendy` ✅)
- [ ] Conta Supabase criada com schema aplicado
- [ ] Env vars prontas pra colar
- [ ] Domínio (opcional) DNS configurado no Cloudflare

---

## 🆘 Troubleshooting

| Sintoma | Causa | Fix |
|---|---|---|
| Build falha "Cannot find module @base-trafego/shared" | `transpilePackages` não pegou | Confirma `next.config.ts` tem `transpilePackages: ["@base-trafego/shared"]` |
| Runtime: "supabaseUrl is required" | env var não setada | Vercel → Settings → Environment Variables |
| Middleware: redirect loop | Site URL no Supabase Auth diferente do domínio | Ajustar em Supabase → Auth → URL Configuration |
| Cron retorna 401 | `CRON_SECRET` não bate | Verificar se está set tanto no Vercel quanto no header `Authorization: Bearer` |
| Realtime não atualiza | Tabela não está na publication | Rerun `supabase db push` (migration `_realtime_publication.sql` é idempotente) |
