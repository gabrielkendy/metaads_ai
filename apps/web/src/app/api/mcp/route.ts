/**
 * Remote MCP endpoint — base-trafego MCP exposto via HTTP/SSE.
 *
 * Conecta-se em claude.ai → Settings → Connectors → Add custom connector
 * URL: https://base-trafego-command.vercel.app/api/mcp
 *
 * Auth flow:
 * - claude.ai web: faz OAuth 2.1 discovery (.well-known) → DCR (/api/oauth/register)
 *   → /api/oauth/authorize → /api/oauth/token → Bearer JWT em /api/mcp.
 * - Claude Desktop / curl: pode usar Bearer estático MCP_AUTH_TOKEN direto.
 *
 * Stateless: cada request cria um Server + Transport novo. Funciona bem em
 * serverless porque Streamable HTTP MCP é request-response.
 */
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createBaseTrafegoServer } from "@base-trafego/mcp/server";
import { verifyAccessToken } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_METHODS = "GET, POST, DELETE, OPTIONS";

function getBaseUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function unauthorized(req: Request, message: string) {
  const base = getBaseUrl(req);
  // RFC 9728 — aponta pra metadata para que o cliente faça discovery do AS
  const wwwAuth = `Bearer realm="base-trafego-mcp", resource_metadata="${base}/.well-known/oauth-protected-resource"`;
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": wwwAuth,
      },
    },
  );
}

function checkAuth(req: Request): { ok: true } | { ok: false; res: Response } {
  if (!process.env.MCP_AUTH_TOKEN) {
    return {
      ok: false,
      res: new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message:
              "Servidor MCP não configurado: MCP_AUTH_TOKEN ausente nas env vars.",
          },
          id: null,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) {
    return {
      ok: false,
      res: unauthorized(
        req,
        "Authorization Bearer obrigatório. Faça OAuth via /api/oauth/authorize ou use o token estático.",
      ),
    };
  }

  const token = match[1].trim();
  const result = verifyAccessToken(token);
  if (!result.ok) {
    return { ok: false, res: unauthorized(req, "Token Bearer inválido ou expirado.") };
  }

  return { ok: true };
}

async function handle(req: Request): Promise<Response> {
  const auth = checkAuth(req);
  if (!auth.ok) return auth.res;

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createBaseTrafegoServer({ source: "remote-http" });

  try {
    await server.connect(transport);
    return await transport.handleRequest(req);
  } catch (err) {
    console.error("[/api/mcp] handler error", err);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : "Erro interno no MCP server",
        },
        id: null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  } finally {
    try {
      await server.close();
    } catch {
      // ignora close em request stateless
    }
  }
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}

export async function DELETE(req: Request) {
  return handle(req);
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: ALLOWED_METHODS,
      "Access-Control-Allow-Methods": ALLOWED_METHODS,
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, mcp-session-id, mcp-protocol-version",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version, WWW-Authenticate",
    },
  });
}
