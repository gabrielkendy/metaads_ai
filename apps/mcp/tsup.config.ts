import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  target: "node20",
  splitting: false,
  sourcemap: true,
  clean: true,
  // bundle workspace deps no output (não dependem de node_modules em runtime)
  noExternal: ["@base-trafego/shared"],
  external: [
    "@modelcontextprotocol/sdk",
    "@anthropic-ai/sdk",
    "@supabase/supabase-js",
    "winston",
    "dotenv",
    "zod",
  ],
  banner: {
    js: "#!/usr/bin/env node",
  },
  shims: false,
});
