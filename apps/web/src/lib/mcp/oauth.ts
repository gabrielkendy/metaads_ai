/**
 * Helpers de OAuth 2.1 pro MCP custom connector.
 *
 * Implementação minimal pra que claude.ai web consiga "Vincular" o connector.
 * Sem persistência DB — codes e tokens são HMAC-signed (stateless).
 *
 * Fluxo:
 * 1. claude.ai descobre /.well-known/oauth-authorization-server
 * 2. Faz DCR em /api/oauth/register → recebe client_id estático
 * 3. Redireciona user pra /api/oauth/authorize
 * 4. Auto-aprova → redirect com code=hmac(timestamp+state)
 * 5. claude.ai POST /api/oauth/token com code
 * 6. Retorna access_token = MCP_AUTH_TOKEN (estático) com expiração curta
 * 7. claude.ai usa Bearer no /api/mcp
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function getSecret(): string {
  const s = process.env.MCP_AUTH_TOKEN;
  if (!s) throw new Error("MCP_AUTH_TOKEN ausente nas env vars");
  return s;
}

function sign(payload: string): string {
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

function verify(token: string): { ok: true; payload: string } | { ok: false } {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false };
  const [encoded, sig] = parts;
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return { ok: false };
  }
  const expected = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  return { ok: true, payload };
}

export interface AuthCodePayload {
  iat: number;
  client_id: string;
  redirect_uri: string;
  code_challenge?: string;
  code_challenge_method?: string;
  scope?: string;
}

export function issueCode(data: Omit<AuthCodePayload, "iat">): string {
  const payload: AuthCodePayload = { iat: Date.now(), ...data };
  return sign(JSON.stringify(payload));
}

export function verifyCode(code: string): AuthCodePayload | null {
  const r = verify(code);
  if (!r.ok) return null;
  let payload: AuthCodePayload;
  try {
    payload = JSON.parse(r.payload);
  } catch {
    return null;
  }
  if (Date.now() - payload.iat > CODE_TTL_MS) return null;
  return payload;
}

/**
 * Verifies a Bearer token. Aceita:
 * - Token estático MCP_AUTH_TOKEN (testes via curl, Claude Desktop)
 * - Access token assinado (issued via /api/oauth/token)
 */
export function verifyAccessToken(
  token: string,
): { ok: true; static: boolean } | { ok: false } {
  const expected = process.env.MCP_AUTH_TOKEN;
  if (!expected) return { ok: false };

  // 1. Token estático (compatibilidade com curl/desktop)
  if (token.length === expected.length) {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return { ok: true, static: true };
    }
  }

  // 2. Token assinado via OAuth flow
  const r = verify(token);
  if (!r.ok) return { ok: false };
  try {
    const payload = JSON.parse(r.payload) as { iat: number; exp: number };
    if (Date.now() > payload.exp) return { ok: false };
    return { ok: true, static: false };
  } catch {
    return { ok: false };
  }
}

export function issueAccessToken(opts: { ttlSec?: number } = {}): {
  access_token: string;
  expires_in: number;
} {
  const ttlSec = opts.ttlSec ?? 60 * 60 * 24 * 30; // 30 dias por padrão
  const iat = Date.now();
  const exp = iat + ttlSec * 1000;
  return {
    access_token: sign(JSON.stringify({ iat, exp })),
    expires_in: ttlSec,
  };
}
