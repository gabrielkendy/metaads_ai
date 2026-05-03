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

export type Env = z.infer<typeof envSchema>;

// Durante next build (page-data collection) algumas env vars podem não estar
// presentes. Retorna stub com defaults pra módulos importarem sem crash; o
// código real só roda em runtime quando todas as env estão setas.
const STUB: Env = {
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "stub",
  SUPABASE_ANON_KEY: undefined,
  SUPABASE_ENCRYPTION_KEY: undefined,
  META_APP_ID: undefined,
  META_APP_SECRET: undefined,
  META_API_VERSION: "v22.0",
  ANTHROPIC_API_KEY: undefined,
  LOG_LEVEL: "info",
  LOG_PATH: "./logs/mcp-server.log",
  PLATFORM_URL: "http://localhost:3000",
  PLATFORM_WEBHOOK_SECRET: undefined,
  USE_META_MOCK: "true",
};

const isNextBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

let _cached: Env | undefined;
function loadEnv(): Env {
  if (_cached) return _cached;
  if (isNextBuildPhase) {
    // não valida durante build — vars reais entram em runtime
    _cached = STUB;
    return _cached;
  }
  // Fallback: na Vercel as URLs Supabase estão prefixadas com NEXT_PUBLIC_*.
  // Aceita ambos pra que o mesmo MCP rode em Claude Desktop (vars puras) e
  // dentro do Next.js como remote connector.
  const sourceEnv: Record<string, string | undefined> = {
    ...process.env,
    SUPABASE_URL:
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY:
      process.env.SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  const parsed = envSchema.safeParse(sourceEnv);
  if (!parsed.success) {
    // Em fallback last-resort, se for um runtime de Next mas as env tiverem
    // problema, deixa o erro estourar com mensagem clara
    throw new Error(
      `[base-trafego/mcp] env vars inválidas: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  _cached = parsed.data;
  return _cached;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return loadEnv()[prop as keyof Env];
  },
  has(_target, prop: string) {
    return prop in loadEnv();
  },
  ownKeys() {
    return Object.keys(loadEnv());
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    return {
      enumerable: true,
      configurable: true,
      value: loadEnv()[prop as keyof Env],
    };
  },
});
