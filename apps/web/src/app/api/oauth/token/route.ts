/**
 * OAuth 2.1 token endpoint.
 *
 * Aceita grant_type=authorization_code com code obtido em /authorize.
 * Verifica PKCE (code_verifier) se fornecido.
 * Retorna access_token (Bearer) que o claude.ai usará em /api/mcp.
 */
import { createHash } from "node:crypto";
import { issueAccessToken, verifyCode } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(error: string, description: string, status = 400) {
  return Response.json(
    { error, error_description: description },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(req: Request) {
  const ctype = req.headers.get("content-type") ?? "";
  let params: Record<string, string> = {};
  if (ctype.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    for (const [k, v] of new URLSearchParams(text).entries()) params[k] = v;
  } else if (ctype.includes("application/json")) {
    try {
      params = (await req.json()) as Record<string, string>;
    } catch {
      return jsonError("invalid_request", "Body JSON inválido");
    }
  } else {
    return jsonError(
      "invalid_request",
      "Content-Type deve ser application/x-www-form-urlencoded ou application/json",
    );
  }

  if (params.grant_type !== "authorization_code") {
    return jsonError(
      "unsupported_grant_type",
      `grant_type=${params.grant_type ?? ""} não suportado, use authorization_code`,
    );
  }

  if (!params.code) {
    return jsonError("invalid_request", "Parâmetro code obrigatório");
  }

  const decoded = verifyCode(params.code);
  if (!decoded) {
    return jsonError("invalid_grant", "Code inválido ou expirado");
  }

  // ─── Verifica redirect_uri bate ─────────────────────────────
  if (params.redirect_uri && params.redirect_uri !== decoded.redirect_uri) {
    return jsonError("invalid_grant", "redirect_uri não bate com authorize");
  }

  // ─── Verifica client_id bate ────────────────────────────────
  if (params.client_id && params.client_id !== decoded.client_id) {
    return jsonError("invalid_client", "client_id não bate com authorize");
  }

  // ─── Verifica PKCE se foi usado no /authorize ───────────────
  if (decoded.code_challenge) {
    if (!params.code_verifier) {
      return jsonError("invalid_grant", "code_verifier obrigatório (PKCE)");
    }
    const method = decoded.code_challenge_method ?? "plain";
    let derived: string;
    if (method === "S256") {
      derived = createHash("sha256")
        .update(params.code_verifier)
        .digest("base64url");
    } else {
      derived = params.code_verifier;
    }
    if (derived !== decoded.code_challenge) {
      return jsonError("invalid_grant", "code_verifier não bate com code_challenge");
    }
  }

  // ─── Emite access_token ─────────────────────────────────────
  const { access_token, expires_in } = issueAccessToken({
    ttlSec: 60 * 60 * 24 * 30, // 30 dias
  });

  return Response.json(
    {
      access_token,
      token_type: "Bearer",
      expires_in,
      scope: decoded.scope,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    },
  );
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
