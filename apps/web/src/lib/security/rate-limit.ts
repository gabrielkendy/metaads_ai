// ════════════════════════════════════════════════════════════════════
// Rate limiter in-memory por IP+rota
// Em produção multi-instance, troque por @upstash/ratelimit + Redis
// ════════════════════════════════════════════════════════════════════

interface Bucket {
  tokens: number;
  updated: number;
  max: number;
}

const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  for (const [key, b] of buckets) {
    if (now - b.updated > 5 * 60_000) buckets.delete(key);
  }
  lastCleanup = now;
}

export function rateLimit(
  key: string,
  options: { max: number; windowMs: number },
): { allowed: boolean; remaining: number; resetMs: number } {
  cleanup();
  const now = Date.now();
  const refillRate = options.max / options.windowMs;
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: options.max, updated: now, max: options.max };
    buckets.set(key, bucket);
  }

  const elapsed = now - bucket.updated;
  bucket.tokens = Math.min(bucket.max, bucket.tokens + elapsed * refillRate);
  bucket.updated = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetMs: 0,
    };
  }

  const tokensNeeded = 1 - bucket.tokens;
  const resetMs = Math.ceil(tokensNeeded / refillRate);
  return { allowed: false, remaining: 0, resetMs };
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
