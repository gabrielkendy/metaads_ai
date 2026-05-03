# 🔐 SECURITY — BASE Tráfego Command

> Visão técnica completa: **isolamento multi-tenant, ameaças mapeadas, defesas em camadas** e como Claude Desktop conversa com a plataforma sem confundir clientes.

---

## 1. Modelo de ameaças

A plataforma opera 3 superfícies de ataque distintas:

| Surface | Atores | Risco principal |
|---|---|---|
| **Web** (admin/cliente) | Browser de Kendy + browser de cada cliente | session hijack, cross-tenant leak, IDOR |
| **MCP Server** (Claude) | Claude Desktop local + tokens Meta | Claude alucinando ID errado e mexendo no cliente errado |
| **Meta Webhooks** | Internet pública | replay, forged events, DoS |

---

## 2. Isolamento multi-tenant — **defesa em 4 camadas**

> O cenário mais perigoso: Claude está conversando sobre o cliente `Just Burn`, mas em uma tool call passa o `client_id` de `Beat Life` por engano. **A plataforma BLOQUEIA mesmo assim**.

### Camada 1 — RLS Postgres (obrigatório)

Todas as 18 tabelas têm RLS ativo. Helper functions:

```sql
public.is_admin()          -- super_admin ou admin
public.user_client_ids()   -- client_ids vinculados via client_users
public.has_client_access(target_client_id)
```

Policies:
- **Admin**: vê tudo
- **Cliente**: só vê linhas onde `client_id` está em `user_client_ids()`
- **Service role** (MCP): bypassa RLS — confiamos nas guards da camada 2

### Camada 2 — Guards no MCP server

`apps/mcp/src/lib/guards.ts` exporta:

| Função | O que faz |
|---|---|
| `assertClientExists(client_id)` | UUID válido + cliente não-churned |
| `assertResourceBelongsToClient("campaign"\|"ad_set"\|"ad", id, client_id)` | **CROSS-TENANT-BLOCK** se ID pertence a outro cliente |
| `rateLimit(client_id, {maxPerMinute})` | Token bucket por cliente |
| `assertDailyActionLimit(client_id)` | Lê `agent_configs.max_daily_actions` |
| `guardClientOperation(client_id, opts)` | Combina os 4 acima |
| `sanitizeString(input, max)` | Remove control chars, trunca |

**Toda tool sensível chama `guardClientOperation` no início.** Exemplo:

```typescript
handler: async (input) => {
  await guardClientOperation(input.client_id, { rateLimitPerMinute: 30 });
  await assertResourceBelongsToClient("campaign", input.campaign_id, input.client_id);
  // ... agora seguro pra tocar Meta API
}
```

Tools com `client_id` obrigatório no input:
`create_campaign`, `update_campaign`, `pause_campaign`, `resume_campaign`,
`delete_campaign`, `create_creative`, `duplicate_creative`, `pause_ad`,
`update_client_settings`, `create_alert`, `generate_report`.

### Camada 3 — Constraints + Triggers Postgres

Mesmo se um bug deixar passar pelas camadas 1 e 2, o banco não permite inconsistência:

```sql
-- migration 20260503000100_security_hardening.sql

-- ad_set.campaign_id → campaign.client_id deve existir
trigger ad_set_consistency

-- ad.client_id deve bater com campaign.client_id via ad_set
trigger ad_client_consistency

-- campaign.client_id e ad.client_id são IMUTÁVEIS após criação
trigger lock_campaign_client_id
trigger lock_ad_client_id

-- audit_logs append-only — nem service role consegue UPDATE/DELETE
policy "audit_logs_no_update", "audit_logs_no_delete"
```

### Camada 4 — Audit log imutável

`audit_logs` registra **todas** as operações com `client_id` + `resource_type` + `before_data` + `after_data`. Logs são **append-only via policy** (camada 3) — mesmo um vazamento da service role não consegue apagar histórico.

---

## 3. Como Claude Desktop conversa com a plataforma

```
┌──────────────────┐
│ Claude Desktop   │  Conversação local com Kendy
└────────┬─────────┘
         │ stdio
         ▼
┌─────────────────────────────────────┐
│ MCP Server (apps/mcp/dist/index.js) │
│  ┌──────────────────────────────┐   │
│  │ 1. tool.invoke(name, args)   │   │
│  │ 2. zod.parse(args)           │   │
│  │ 3. guardClientOperation(c)   │   │ ← isolamento por cliente
│  │ 4. assertResourceBelongs()   │   │ ← bloqueio cross-tenant
│  │ 5. sanitizeString()          │   │ ← XSS/injection prevention
│  │ 6. logClaudeAction()         │   │ ← audit pre-exec
│  │ 7. Meta API + Supabase write │   │
│  │ 8. updateClaudeAction()      │   │ ← audit post-exec
│  │ 9. auditLog(action+diff)     │   │ ← histórico imutável
│  └──────────────────────────────┘   │
└─────────┬───────────────────────────┘
          │
          ▼ via service-role
┌─────────────────────────────────────┐
│ Supabase Postgres                    │
│  - RLS + Triggers + Constraints      │
│  - Realtime publish para dashboards  │
└─────────────────────────────────────┘
```

### Fluxo: "Claude, cria campanha no Just Burn"

1. Claude resolve `client_id` via `list_clients` ou `get_client(slug)`
2. Claude invoca `create_campaign({ client_id: "abc-123", name: "...", ... })`
3. MCP valida via Zod (UUID, range, datetime)
4. `guardClientOperation("abc-123")` →
   - cliente existe? não-churned?
   - rate limit OK?
   - sob limite diário?
5. `logClaudeAction({status: "in_progress"})` registra início
6. Decide: requer aprovação? cria `approval` row → para
7. Senão: chama Meta API real (com token desencriptado **só desse cliente**)
8. Insere `campaigns` row (trigger lock_campaign_client_id já bloqueia mudança futura de client_id)
9. `auditLog({action: "campaign.created", before, after})`
10. Realtime → dashboard de Just Burn atualiza ao vivo

### Tentativa de cross-tenant — exemplo do que é bloqueado

```typescript
// Claude alucina: tenta pausar uma campanha que NÃO é do Just Burn
pause_campaign({
  client_id: "<id-just-burn>",
  campaign_id: "<id-de-uma-camp-Beat-Life>",  // ← engano!
});

// MCP:
//   1. ✅ Cliente Just Burn existe
//   2. ❌ assertResourceBelongsToClient("campaign", camp_id, jb_id)
//      → query: select client_id from campaigns where id=camp_id
//      → retorna client_id de Beat Life
//      → FAIL com erro "CROSS_TENANT_BLOCKED"
//   3. logger.error registra tentativa pra investigação
```

---

## 4. Tokens Meta — encriptação at-rest

Cada `meta_accounts.access_token_encrypted` é cifrado com **AES-256-GCM** antes de ir pro banco:

```typescript
// apps/mcp/src/lib/token.ts e apps/web/src/lib/meta/client.ts
const KEY = scryptSync(SUPABASE_ENCRYPTION_KEY, "base-trafego-salt", 32);
encryptToken(token) → IV(12) | TAG(16) | CIPHERTEXT  // base64
```

Garantias:
- **Authenticated encryption**: tag GCM detecta tampering
- **Unique IV**: cada token tem IV randômico
- **Key derivation**: scrypt com salt fixo (rotaciona a key se vazar)
- **At-rest only**: token só é desencriptado em memória durante chamada Meta API

Se `SUPABASE_ENCRYPTION_KEY` for trocada, todos os tokens precisam ser re-cifrados (re-OAuth do cliente).

---

## 5. Webhooks Meta — proteção em 4 níveis

```typescript
// apps/web/src/app/api/webhooks/meta/route.ts

POST /api/webhooks/meta
├── 1. Tamanho ≤ 1MiB                         (DoS)
├── 2. HMAC-SHA256 com timing-safe compare    (forgery)
├── 3. Replay protection 10min cache          (replay)
└── 4. Audit log de cada evento               (forensics)
```

Verify token (GET) também usa `timingSafeEqual` pra evitar **timing attacks**.

---

## 6. Hardening da Web app

### Headers (todos os responses)

```
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), mic=(), geo=(), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
```

### Rate limiting (middleware)

| Rota | Janela | Limite |
|---|---|---|
| `/api/auth/*` + `/auth/callback` | 60s | 30 req/IP |
| `/api/*` | 60s | 120 req/IP |
| Páginas públicas | 60s | 600 req/IP |

> Em produção multi-instance: trocar in-memory por **Upstash Redis** com `@upstash/ratelimit`.

### Auth flow

- Magic link com Supabase (sem senha exposta)
- Cookie HttpOnly + Secure + SameSite=Lax
- Sessão JWT com expiração curta (1h) + refresh
- Middleware faz `supabase.auth.getUser()` em **toda request privada** (validação server-side)

---

## 7. Server actions

Todas as `"use server"` actions:

1. Chamam `requireUser()` ou `requireAdmin()` no início
2. Validam input com Zod
3. Verificam ownership via `client_users` se for cliente
4. Fazem `revalidatePath()` apenas paths necessárias
5. Retornam `{ ok, error }` — nunca exception não tratada

---

## 8. RLS — exemplos de policy

```sql
-- Cliente vê APENAS dados do próprio client_id
create policy "client_users_view_campaigns" on campaigns
  for select using (public.has_client_access(client_id));

-- Admin vê tudo
create policy "admins_full_campaigns" on campaigns
  for all using (public.is_admin());

-- Mensagens: cliente só envia/recebe das suas
create policy "messages_client_isolated" on messages
  for select using (public.has_client_access(client_id));
```

---

## 9. Compliance

- ✅ **LGPD**: direito a esquecimento via DPO@agenciabase.tech (route + queue)
- ✅ **PII masking**: emails em audit logs passam por `mask_pii()` antes de exibir
- ✅ **Data retention**: `audit_logs` mantém 24 meses; `performance_snapshots` 12 meses
- ✅ **Cookie consent**: banner não-bloqueante (futuro)

---

## 10. Resposta a incidentes

### Suspeita de vazamento de service role key

```bash
# 1. Rotaciona a key no Supabase Dashboard → Settings → API
# 2. Atualiza Vercel env var SUPABASE_SERVICE_ROLE_KEY
# 3. Atualiza claude_desktop_config.json local
# 4. Re-encripta tokens Meta: rerun supabase encryption
```

### Suspeita de cross-tenant access

```sql
-- Audit forense: ações de Claude num cliente específico
select * from audit_logs
where client_id = '<id>'
order by created_at desc
limit 100;

-- Tentativas bloqueadas (logger.error no MCP)
-- Ver logs em apps/mcp/logs/mcp-server.log
grep "CROSS-TENANT" apps/mcp/logs/mcp-server.log
```

### Token Meta comprometido

```typescript
// 1. Cliente revoga app no Meta Business Settings
// 2. Plataforma detecta erro 401 no próximo cron e marca account inactive
// 3. Cliente reconecta via /admin/clients/[id] → "Conectar Meta Business"
```

---

## 11. Checklist pré-produção

```
☐ SUPABASE_ENCRYPTION_KEY ≥ 32 chars aleatórios
☐ CRON_SECRET configurado em Vercel + crons batem com header
☐ META_VERIFY_TOKEN aleatório, salvo em 1Password
☐ HSTS habilitado (NODE_ENV=production já liga)
☐ Custom domain com SSL via Vercel/Cloudflare
☐ Sentry DSN configurado pra capturar runtime errors
☐ Backups Supabase: daily + PITR (Pro plan)
☐ Migration 20260503000100_security_hardening.sql aplicada
☐ Realtime publication confirmado (alerts, approvals, etc.)
☐ Audit log no-update no-delete policies ativas
☐ Login admin testado + cliente isolado testado
☐ Tentativa cross-tenant testada → CROSS_TENANT_BLOCKED retornado
```

---

## 12. Reportar vulnerabilidade

> security@agenciabase.tech — disclosure responsável, resposta em até 72h.

Não publique exploits sem 90 dias de aviso prévio.
