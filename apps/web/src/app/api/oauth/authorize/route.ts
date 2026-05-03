/**
 * OAuth 2.1 authorization endpoint.
 *
 * Recebe: response_type=code, client_id, redirect_uri, state, scope, code_challenge, code_challenge_method
 * Verifica sessão Supabase (super_admin/admin) e auto-aprova.
 * Se não logado: redireciona pra /login?redirect_to=<url-original>
 *
 * Code emitido = HMAC-signed payload (stateless, 5min TTL).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ROLES, type UserRole } from "@base-trafego/shared/constants";
import { issueCode } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_PARAMS = ["response_type", "client_id", "redirect_uri"] as const;

function errorRedirect(redirectUri: string, error: string, description: string, state?: string) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const params = Object.fromEntries(sp.entries());

  for (const k of REQUIRED_PARAMS) {
    if (!params[k]) {
      return Response.json(
        { error: "invalid_request", error_description: `Missing parameter: ${k}` },
        { status: 400 },
      );
    }
  }

  if (params.response_type !== "code") {
    return errorRedirect(
      params.redirect_uri,
      "unsupported_response_type",
      "Only response_type=code is supported",
      params.state,
    );
  }

  // ─── Verifica sessão Supabase ────────────────────────────────
  const cookieStore = req.cookies;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // read-only no GET
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // não logado — manda pro login e devolve pra cá depois
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect_to", `${req.nextUrl.pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Verifica role admin (só admins podem operar o MCP)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile || !ADMIN_ROLES.includes(profile.role as UserRole)) {
    return errorRedirect(
      params.redirect_uri,
      "access_denied",
      "Apenas usuários admin podem autorizar conectores MCP",
      params.state,
    );
  }

  // ─── Auto-aprova e emite code ───────────────────────────────
  const code = issueCode({
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    code_challenge: params.code_challenge,
    code_challenge_method: params.code_challenge_method,
    scope: params.scope,
  });

  const redirectBack = new URL(params.redirect_uri);
  redirectBack.searchParams.set("code", code);
  if (params.state) redirectBack.searchParams.set("state", params.state);
  return NextResponse.redirect(redirectBack);
}
