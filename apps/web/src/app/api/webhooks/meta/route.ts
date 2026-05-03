import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Replay protection: cache de event_ids vistos nos últimos 10min (in-memory)
const seenEvents = new Map<string, number>();
function gcSeen() {
  const now = Date.now();
  for (const [id, t] of seenEvents) if (now - t > 10 * 60_000) seenEvents.delete(id);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ─── GET: verify token (Meta valida na primeira config) ─────────────
export async function GET(request: Request) {
  const env = getServerEnv();
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    env.META_VERIFY_TOKEN &&
    token &&
    timingSafeEqual(token, env.META_VERIFY_TOKEN)
  ) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─── POST: evento real (HMAC + replay protection) ───────────────────
export async function POST(request: Request) {
  const env = getServerEnv();
  const sig = request.headers.get("x-hub-signature-256");
  const raw = await request.text();

  // Tamanho razoável (proteção DoS)
  if (raw.length > 1_048_576) {
    return new Response("Payload too large", { status: 413 });
  }

  // HMAC obrigatória em produção
  if (env.META_APP_SECRET) {
    if (!sig) return new Response("Signature required", { status: 401 });
    const expected = `sha256=${crypto
      .createHmac("sha256", env.META_APP_SECRET)
      .update(raw)
      .digest("hex")}`;
    if (!timingSafeEqual(sig, expected)) {
      return new Response("Invalid signature", { status: 401 });
    }
  }

  // Parse + replay protection via event id (Meta envia `time`+`object_id`)
  let payload: { entry?: Array<{ id?: string; time?: number }> };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  gcSeen();
  for (const e of payload.entry ?? []) {
    const id = `${e.id ?? "x"}-${e.time ?? "x"}`;
    if (seenEvents.has(id)) continue; // Já processado — Meta pode reentregar
    seenEvents.set(id, Date.now());
  }

  // Persiste evento como audit log (processamento async em produção)
  const sb = createAdminClient();
  await sb.from("audit_logs").insert({
    actor_type: "system",
    action: "meta.webhook_received",
    resource_type: "meta_webhook",
    metadata: {
      entry_count: payload.entry?.length ?? 0,
      received_at: new Date().toISOString(),
    } as never,
  });

  return NextResponse.json({ ok: true });
}
