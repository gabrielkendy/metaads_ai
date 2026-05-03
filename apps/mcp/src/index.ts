import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "./lib/logger.js";
import { createBaseTrafegoServer, serverMeta } from "./server-factory.js";

async function main() {
  logger.info("BASE Tráfego MCP Server starting", {
    tools: serverMeta.toolsCount,
    resources: serverMeta.resourcesCount,
    prompts: serverMeta.promptsCount,
    mode: "ledger-only", // 100% leitura/escrita no DB. Zero call Meta API.
  });

  const server = createBaseTrafegoServer({ source: "stdio" });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("MCP Server connected via stdio");
}

main().catch((err) => {
  logger.error("MCP server fatal", { error: err });
  process.exit(1);
});
