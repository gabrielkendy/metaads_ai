/**
 * RFC 9728 — OAuth 2.0 Protected Resource Metadata.
 *
 * Anuncia onde o cliente OAuth deve achar o Authorization Server pra obter
 * tokens de acesso aos recursos protegidos (no nosso caso /api/mcp).
 */
export const runtime = "nodejs";
export const dynamic = "force-static";

function getBaseUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
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
