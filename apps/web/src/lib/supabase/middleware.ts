import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ROLES, ROUTES } from "@base-trafego/shared/constants";
import { applySecurityHeaders } from "@/lib/security/headers";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = getClientIp(request);

  // ─── Rate limit por IP em /api/* sensíveis ──────────────────────
  if (path.startsWith("/api/auth/") || path.startsWith("/auth/callback")) {
    const rl = rateLimit(`auth:${ip}`, { max: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) },
      });
    }
  } else if (path.startsWith("/api/")) {
    const rl = rateLimit(`api:${ip}`, { max: 120, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) },
      });
    }
  } else {
    const rl = rateLimit(`page:${ip}`, { max: 600, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) },
      });
    }
  }

  let supabaseResponse = applySecurityHeaders(NextResponse.next({ request }));

  // biome-ignore lint/suspicious/noExplicitAny: Database genérico até gerar tipos via Supabase CLI
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = applySecurityHeaders(NextResponse.next({ request }));
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options as never);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─── Public paths (sempre OK) ────────────────────────────────
  const publicPaths = [
    "/",
    "/pricing",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
    "/lgpd",
    "/demo",
    "/auth/callback",
    "/auth/error",
    "/api/webhooks",
    "/api/cron",
    "/api/auth",
    "/api/health",
  ];
  if (publicPaths.some((p) => path === p || path.startsWith(`${p}/`))) {
    return supabaseResponse;
  }

  // ─── Não autenticado → /login ────────────────────────────────
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.auth.login;
    url.searchParams.set("redirect_to", path);
    return NextResponse.redirect(url);
  }

  // ─── Pega profile pra checar role ────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "client_viewer";

  // /admin/* requer role admin
  if (path.startsWith("/admin")) {
    if (!ADMIN_ROLES.includes(role)) {
      const url = request.nextUrl.clone();
      // Cliente tentando acessar /admin → manda pro dashboard cliente
      const { data: clientUser } = await supabase
        .from("client_users")
        .select("client:clients(slug)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      const cuClient = Array.isArray(clientUser?.client)
        ? clientUser?.client[0]
        : clientUser?.client;
      if (cuClient?.slug) {
        url.pathname = ROUTES.client.home(cuClient.slug);
        return NextResponse.redirect(url);
      }

      url.pathname = "/auth/error";
      url.searchParams.set("reason", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  // /cliente/[slug]/* — verifica acesso ao client
  if (path.startsWith("/cliente/")) {
    const slug = path.split("/")[2];
    if (slug) {
      // Admins passam direto
      if (ADMIN_ROLES.includes(role)) {
        return supabaseResponse;
      }
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("slug", slug)
        .single();
      if (!client) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/error";
        url.searchParams.set("reason", "client_not_found");
        return NextResponse.redirect(url);
      }
      const { data: hasAccess } = await supabase
        .from("client_users")
        .select("id")
        .eq("user_id", user.id)
        .eq("client_id", client.id)
        .limit(1);
      if (!hasAccess?.length) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/error";
        url.searchParams.set("reason", "no_client_access");
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
