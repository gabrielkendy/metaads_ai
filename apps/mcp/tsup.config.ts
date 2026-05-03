import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "server-factory": "src/server-factory.ts",
  },
  format: ["esm"],
  outDir: "dist",
  target: "node20",
  splitting: true, // chunks compartilhados entre os 2 entries (lib/, tools/, etc.)
  sourcemap: true,
  clean: true,
  dts: true, // emite .d.ts pra exports tipados via subpath
  noExternal: ["@base-trafego/shared"],
  external: [
    "@modelcontextprotocol/sdk",
    "@anthropic-ai/sdk",
    "@supabase/supabase-js",
    "winston",
    "dotenv",
    "zod",
  ],
  shims: false,
});
