#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
import { env } from "./config/env.js";

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

// ─── List tools ──────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema as never),
    })),
  };
});

// ─── Call tool ───────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = toolMap.get(request.params.name);
  if (!tool) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: false, error: `Tool ${request.params.name} não encontrada` }),
        },
      ],
      isError: true,
    };
  }

  const startedAt = Date.now();
  logger.info("tool.invoke", { tool: tool.name, args: request.params.arguments });

  try {
    const parsed = tool.inputSchema.parse(request.params.arguments ?? {});
    const result = await tool.handler(parsed);
    const duration = Date.now() - startedAt;
    logger.info("tool.success", { tool: tool.name, ms: duration });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, ...result }, null, 2),
        },
      ],
    };
  } catch (e) {
    const duration = Date.now() - startedAt;
    logger.error("tool.error", { tool: tool.name, ms: duration, error: e });
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

// ─── List resources ──────────────────────────────────────────────────
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: allResources.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    })),
  };
});

// ─── Read resource ───────────────────────────────────────────────────
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  // Static resources
  for (const r of allResources) {
    if (r.uri === uri) return r.read(uri);
  }

  // Dynamic resources
  const dyn = await readDynamicResource(uri);
  if (dyn) return dyn;

  return {
    contents: [
      {
        uri,
        mimeType: "text/plain",
        text: "Recurso não encontrado",
      },
    ],
  };
});

// ─── List prompts ────────────────────────────────────────────────────
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: allPrompts.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments ?? [],
    })),
  };
});

// ─── Get prompt ──────────────────────────────────────────────────────
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const prompt = promptMap.get(request.params.name);
  if (!prompt) {
    throw new Error(`Prompt ${request.params.name} não encontrado`);
  }
  return prompt.generate((request.params.arguments ?? {}) as Record<string, string>);
});

// ─── Boot ────────────────────────────────────────────────────────────
async function main() {
  logger.info("BASE Tráfego MCP Server starting", {
    tools: allTools.length,
    resources: allResources.length,
    prompts: allPrompts.length,
    metaMock: env.USE_META_MOCK,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("MCP Server connected via stdio");
}

main().catch((err) => {
  logger.error("MCP server fatal", { error: err });
  process.exit(1);
});
