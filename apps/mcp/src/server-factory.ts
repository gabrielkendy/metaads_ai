/**
 * Factory pra criar uma instância do MCP Server com todas as tools/resources/prompts
 * registrados. Permite reutilizar a mesma lógica em diferentes transportes
 * (stdio local pelo Claude Desktop, HTTP via Next.js API route pra claude.ai web).
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "./lib/zod-to-json.js";
import { logger } from "./lib/logger.js";
import { formatToolError } from "./lib/errors.js";
import { allTools, toolMap } from "./tools/index.js";
import { allResources, readDynamicResource } from "./resources/index.js";
import { allPrompts, promptMap } from "./prompts/index.js";

export interface CreateServerOptions {
  /** Identificador customizado de origem pra logs (ex: "remote-http", "stdio"). Default: "stdio". */
  source?: string;
}

export function createBaseTrafegoServer(options: CreateServerOptions = {}): Server {
  const source = options.source ?? "stdio";
  const server = new Server(
    {
      name: "base-trafego",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema as never),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = toolMap.get(request.params.name);
    if (!tool) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `Tool ${request.params.name} não encontrada`,
            }),
          },
        ],
        isError: true,
      };
    }

    const startedAt = Date.now();
    logger.info("tool.invoke", {
      tool: tool.name,
      source,
      args: request.params.arguments,
    });

    try {
      const parsed = tool.inputSchema.parse(request.params.arguments ?? {});
      const result = await tool.handler(parsed);
      logger.info("tool.success", {
        tool: tool.name,
        source,
        ms: Date.now() - startedAt,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: true, ...result }, null, 2),
          },
        ],
      };
    } catch (e) {
      logger.error("tool.error", {
        tool: tool.name,
        source,
        ms: Date.now() - startedAt,
        error: e,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(formatToolError(e), null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: allResources.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    for (const r of allResources) {
      if (r.uri === uri) return r.read(uri);
    }
    const dyn = await readDynamicResource(uri);
    if (dyn) return dyn;
    return {
      contents: [
        { uri, mimeType: "text/plain", text: "Recurso não encontrado" },
      ],
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: allPrompts.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments ?? [],
    })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = promptMap.get(request.params.name);
    if (!prompt) {
      throw new Error(`Prompt ${request.params.name} não encontrado`);
    }
    return prompt.generate(
      (request.params.arguments ?? {}) as Record<string, string>,
    );
  });

  return server;
}

export const serverMeta = {
  toolsCount: allTools.length,
  resourcesCount: allResources.length,
  promptsCount: allPrompts.length,
};
