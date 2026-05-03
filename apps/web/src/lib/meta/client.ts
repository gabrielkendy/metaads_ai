import "server-only";
import { getServerEnv } from "@/lib/env";

const GRAPH_BASE = (version = "v22.0") => `https://graph.facebook.com/${version}`;

export interface MetaTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export function getOAuthUrl({
  state,
  redirectUri,
  scopes = [
    "ads_management",
    "ads_read",
    "business_management",
    "pages_show_list",
    "pages_read_engagement",
    "instagram_basic",
  ],
}: {
  state: string;
  redirectUri: string;
  scopes?: string[];
}) {
  const env = getServerEnv();
  if (!env.META_APP_ID) throw new Error("META_APP_ID não configurado");
  const params = new URLSearchParams({
    client_id: env.META_APP_ID,
    redirect_uri: redirectUri,
    state,
    scope: scopes.join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/${env.META_API_VERSION}/dialog/oauth?${params}`;
}

export async function exchangeCodeForToken({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}): Promise<MetaTokenResponse> {
  const env = getServerEnv();
  if (!env.META_APP_ID || !env.META_APP_SECRET) {
    throw new Error("META credentials não configurados");
  }
  const url = new URL(`${GRAPH_BASE(env.META_API_VERSION)}/oauth/access_token`);
  url.searchParams.set("client_id", env.META_APP_ID);
  url.searchParams.set("client_secret", env.META_APP_SECRET);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Meta token exchange falhou: ${res.status}`);
  return (await res.json()) as MetaTokenResponse;
}

export async function exchangeForLongLivedToken(
  shortToken: string,
): Promise<MetaTokenResponse> {
  const env = getServerEnv();
  const url = new URL(`${GRAPH_BASE(env.META_API_VERSION)}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", env.META_APP_ID!);
  url.searchParams.set("client_secret", env.META_APP_SECRET!);
  url.searchParams.set("fb_exchange_token", shortToken);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Long-lived exchange falhou");
  return (await res.json()) as MetaTokenResponse;
}

export async function listAdAccounts(accessToken: string) {
  const env = getServerEnv();
  const url = new URL(`${GRAPH_BASE(env.META_API_VERSION)}/me/adaccounts`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("fields", "id,account_id,name,balance,amount_spent,currency,business");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha listando ad accounts");
  return ((await res.json()) as { data: Array<Record<string, unknown>> }).data;
}

// ─── Token encryption (Node only) ────────────────────────────────────
import crypto from "node:crypto";

function getKey() {
  const env = getServerEnv();
  const raw = env.SUPABASE_ENCRYPTION_KEY ?? "default-key-please-change-32bytes";
  return crypto.scryptSync(raw, "base-trafego-salt", 32);
}

export function encryptToken(token: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptToken(encrypted: string): string {
  const key = getKey();
  const buf = Buffer.from(encrypted, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(data), decipher.final()]);
  return out.toString("utf8");
}
