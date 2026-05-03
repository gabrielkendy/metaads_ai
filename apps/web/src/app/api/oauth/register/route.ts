/**
 * RFC 7591 — Dynamic Client Registration.
 *
 * Aceita qualquer registro do cliente OAuth (claude.ai). Como nossa
 * AS é stateless e o auth code é HMAC-signed, não precisamos guardar
 * client_id no DB — emitimos um determinístico por request.
 */
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RegisterBody {
  client_name?: string;
  redirect_uris?: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
  application_type?: string;
}

export async function POST(req: Request) {
  let body: RegisterBody = {};
  try {
    body = await req.json();
  } catch {
    // payload opcional — DCR aceita registro mínimo
  }

  const client_id = `mcp-client-${randomUUID()}`;
  const issuedAt = Math.floor(Date.now() / 1000);

  return Response.json(
    {
      client_id,
      client_id_issued_at: issuedAt,
      // sem client_secret — public client com PKCE
      client_name: body.client_name ?? "MCP Custom Connector",
      redirect_uris: body.redirect_uris ?? [],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      application_type: body.application_type ?? "web",
    },
    { status: 201 },
  );
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
