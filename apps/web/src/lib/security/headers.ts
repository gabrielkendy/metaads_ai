// ════════════════════════════════════════════════════════════════════
// Headers de segurança aplicados no middleware
// CSP, HSTS, Permissions-Policy, COOP/COEP/CORP
// ════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers;

  // ─── CSP estrito ───────────────────────────────────────────────────
  // permite Supabase, Meta CDNs, Vercel, Google Fonts, Unsplash (para demo)
  const supabaseHost =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "") ?? "*.supabase.co";
  const csp = [
    "default-src 'self'",
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://graph.facebook.com https://*.posthog.com https://*.sentry.io`,
    "img-src 'self' data: blob: https://*.supabase.co https://*.fbcdn.net https://*.cdninstagram.com https://lh3.googleusercontent.com https://images.unsplash.com https://platform-lookaside.fbsbx.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://va.vercel-scripts.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  headers.set("Content-Security-Policy", csp);

  // HSTS (em produção)
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  // outros
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), fullscreen=(self)",
  );
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("X-DNS-Prefetch-Control", "on");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-site");

  return response;
}
