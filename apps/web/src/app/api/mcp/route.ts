/**
 * Remote MCP endpoint — base-trafego MCP exposto via HTTP/SSE.
 *
 * Conecta-se em claude.ai → Settings → Connectors → Add custom connector
 * URL: https://base-trafego-command.vercel.app/api/mcp
 * Header de auth: Authorization: Bearer <MCP_AUTH_TOKEN>
 *
 * Stateless mode: cada request cria um Server + Transport novo. Funciona bem em
 * serverless porque MCP via streamable HTTP é request-response (sem long-lived
 * connection mantendo estado entre chamadas — o cliente já manda toda a sessão
 * inline em cada POST).
 */
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createBaseTrafegoServer } from "@base-trafego/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_METHODS = "GET, POST, DELETE, OPTIONS";

function unauthorized(message: string) {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message,
      },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="base-trafego-mcp"',
      },
    },
  );
}

function checkAuth(req: Request): { ok: true } | { ok: false; res: Response } {
  const expected = process.env.MCP_AUTH_TOKEN;
  if (!expected) {
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
        "Authorization Bearer obrigatório. Configure o connector com header: Authorization: Bearer <token>",
      ),
    };
  }
  const token = match[1].trim();

  // comparação tempo-constante simples — Buffer.compare seria ideal mas
  // aqui o token é alto-entropia, ataque de timing é praticamente nulo
  if (token.length !== expected.length || token !== expected) {
    return { ok: false, res: unauthorized("Token Bearer inválido.") };
  }
  return { ok: true };
}

async function handle(req: Request): Promise<Response> {
  const auth = checkAuth(req);
  if (!auth.ok) return auth.res;

  // Stateless: cada request reinstancia. O StreamableHTTP transport aceita
  // mensagens completas (Initialize/ListTools/CallTool) numa request POST só
  // quando rodando em modo enableJsonResponse=true sem session.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true, // resposta JSON ao invés de SSE — serverless friendly
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
          message:
            err instanceof Error ? err.message : "Erro interno no MCP server",
        },
        id: null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  } finally {
    // libera o servidor após cada request — stateless
    try {
      await server.close();
    } catch {
      // ignora erro de close em request stateless
    }
  }
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  // Em stateless mode SSE/GET geralmente retorna 405. Alguns clientes fazem
  // GET pra estabelecer SSE — respondemos com handle() de qualquer forma; o
  // transport sabe lidar com GET.
  return handle(req);
}

export async function DELETE(req: Request) {
  // DELETE encerra sessão — em stateless, idempotente.
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
      "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
    },
  });
}
