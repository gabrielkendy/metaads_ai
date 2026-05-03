import { z } from "zod";
import { config as loadDotenv } from "dotenv";

// Carrega .env automaticamente em dev (Claude Desktop passa via env)
if (process.env.NODE_ENV !== "production") {
  loadDotenv();
}

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_ENCRYPTION_KEY: z.string().min(16).optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_API_VERSION: z.string().default("v22.0"),
  ANTHROPIC_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  LOG_PATH: z.string().default("./logs/mcp-server.log"),
  PLATFORM_URL: z.string().url().default("http://localhost:3000"),
  PLATFORM_WEBHOOK_SECRET: z.string().optional(),
  USE_META_MOCK: z.enum(["true", "false"]).default("true"),
});

export const env = envSchema.parse(process.env);
