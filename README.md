# 🚀 BASE Tráfego Command

Mini-SaaS multi-tenant que conecta **Claude Desktop** à plataforma de gestão de Meta Ads da Agência BASE — operação por IA com aprovação humana, dashboards white-label e auditoria completa.

> Construído conforme PRD/Arquitetura/Schema da pasta `docs/` (Sprints 1→6 completos).

---

## 🗂 Estrutura

```
base-trafego-command/
├── apps/
│   ├── web/                ← Next.js 15 (admin + cliente + landing)
│   └── mcp/                ← MCP Server (35+ tools, 8 resources, 5 prompts)
├── packages/
│   └── shared/             ← Schemas Zod, constantes, utils, tipos
├── supabase/
│   ├── config.toml         ← Config local
│   ├── migrations/         ← Schema completo + storage + realtime
│   └── seed.sql            ← Dados demo
├── scripts/
│   └── seed.ts             ← Seed programático via service role
├── .github/workflows/      ← CI lint + build
├── biome.json              ← Lint + format
├── turbo.json              ← Pipeline
└── package.json            ← Bun workspaces
```

---

## ⚡ Quick start

### 1. Instalar dependências

```bash
cd base-trafego-command

# Bun é recomendado (rápido)
bun install
# ou pnpm: pnpm install
# ou npm: npm install --workspaces
```

### 2. Configurar env vars

```bash
cp .env.example .env.local
# Edite .env.local com seus valores reais (Supabase, Meta, Anthropic, Resend)
```

> Veja **`docs/CONNECTION-GUIDE.md`** pra passo-a-passo completo de cada conta.

### 3. Aplicar schema no Supabase

```bash
# Opção A — via Supabase CLI (recomendado)
supabase link --project-ref <seu-project-ref>
supabase db push

# Opção B — manual via SQL Editor do Dashboard
# Cole supabase/migrations/*.sql em ordem e execute
```

### 4. Rodar localmente

```bash
# Web app + MCP em paralelo
bun run dev

# Ou separado:
bun run dev:web   # http://localhost:3000
bun run dev:mcp   # stdio MCP server
```

### 5. Conectar Claude Desktop

Edite `%APPDATA%\Claude\claude_desktop_config.json` (Windows) ou
`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "base-trafego": {
      "command": "node",
      "args": ["C:\\caminho-completo\\base-trafego-command\\apps\\mcp\\dist\\index.js"],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJ...",
        "USE_META_MOCK": "true"
      }
    }
  }
}
```

Build antes:

```bash
cd apps/mcp && bun run build
```

---

## 🎯 Sprints implementados

| Sprint | Entregue | Tag |
|---|---|---|
| 1 — Foundation (auth, design system, layouts) | ✅ | login, callback, middleware, glass UI |
| 2 — Dashboard Admin (clients CRUD, approvals, audit, agent-config, reports, settings) | ✅ | `/admin/*` |
| 3 — Dashboard Cliente white-label (home, criativos, histórico, investimento, mensagens) + Realtime | ✅ | `/cliente/[slug]/*` |
| 4 — MCP Server (35 tools / 8 resources / 5 prompts / mock + Meta API) | ✅ | `apps/mcp` |
| 5 — Meta OAuth + sync cron + webhooks + anomaly detection | ✅ | `/api/auth/meta/*`, `/api/cron/*`, `/api/webhooks/meta` |
| 6 — Landing page, pricing, legal (LGPD), SEO, error/404, CI | ✅ | `/(marketing)`, `sitemap.ts`, `robots.ts` |

---

## 🔐 Segurança

- ✅ RLS habilitado em todas as 18 tabelas
- ✅ Service role key isolada no server (nunca exposta ao client)
- ✅ Tokens Meta criptografados com AES-256-GCM em repouso
- ✅ Audit log imutável (`audit_logs`)
- ✅ Aprovação obrigatória pra ações de alto impacto
- ✅ Magic Link + Google OAuth via Supabase Auth
- ✅ Headers de segurança (CSP, X-Frame, Permissions-Policy)
- ✅ Webhook Meta com verificação HMAC

---

## 📊 Stack

```
Frontend     Next.js 15 · React 19 · TypeScript · Tailwind v4 · Framer Motion · Recharts
Backend      Supabase (Postgres + Auth + Realtime + Storage)
MCP          @modelcontextprotocol/sdk · Zod · Winston
Integration  Meta Marketing API v22 · Anthropic SDK · Resend
Build        Turborepo · Bun · Biome
Deploy       Vercel (gru1 region) · Cloudflare DNS
```

---

## 🧪 Comandos úteis

```bash
bun run dev              # tudo em paralelo
bun run dev:web          # só Next.js
bun run dev:mcp          # só MCP server (watch)
bun run build            # build tudo
bun run lint             # biome check + fix
bun run lint:check       # biome check (CI)
bun run type-check       # tsc --noEmit em todos workspaces
bun run db:types         # regenera apps/web/src/types/database.ts via Supabase CLI
bun run db:seed          # executa scripts/seed.ts
```

---

## 🆘 Suporte

- **Docs originais**: pasta `docs/` (PRD, arquitetura, schema, design, MCP spec, roadmap)
- **Connection guide**: `docs/CONNECTION-GUIDE.md`
- **Issues**: `https://github.com/<seu-org>/base-trafego-command/issues`
- **Discord MCP**: discord.gg/anthropic
- **Discord Supabase**: discord.supabase.com

---

## 🎉 Done = Done

✅ Admin loga, vê dashboard, cria cliente
✅ Cliente loga via magic link, vê dashboard white-label
✅ Realtime atualiza UI conforme Claude executa
✅ Aprovação flow end-to-end
✅ MCP conecta no Claude Desktop e expõe 35+ tools
✅ Meta OAuth + sync cron + webhooks operando
✅ Landing + pricing + legal page production-ready
✅ Lighthouse 90+ esperado em todas as páginas

---

**Bora colocar no ar! 🔥🚀**
