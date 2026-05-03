/**
 * RFC 8414 — OAuth 2.0 Authorization Server Metadata.
 *
 * Documenta os endpoints OAuth pro cliente fazer discovery automático.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseUrl(req: Request): string {
  const proto =
    req.headers.get("x-forwarded-proto") ??
    new URL(req.url).protocol.replace(":", "");
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    new URL(req.url).host;
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const base = getBaseUrl(req);
  return Response.json({
    issuer: base,
    authorization_endpoint: `${base}/api/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    code_challenge_methods_supported: ["S256", "plain"],
    scopes_supported: ["mcp:tools", "mcp:resources", "mcp:prompts"],
  });
}
