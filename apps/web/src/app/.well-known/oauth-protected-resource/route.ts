/**
 * RFC 9728 — OAuth 2.0 Protected Resource Metadata.
 *
 * Anuncia onde o cliente OAuth deve achar o Authorization Server pra obter
 * tokens de acesso aos recursos protegidos (no nosso caso /api/mcp).
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
    resource: `${base}/api/mcp`,
    authorization_servers: [base],
    bearer_methods_supported: ["header"],
    scopes_supported: ["mcp:tools", "mcp:resources", "mcp:prompts"],
    resource_documentation: `${base}/docs`,
  });
}
