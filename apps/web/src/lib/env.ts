// ════════════════════════════════════════════════════════════════════
// Environment variables — validação estrita com Zod
// ════════════════════════════════════════════════════════════════════
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ENCRYPTION_KEY: optional,
  ANTHROPIC_API_KEY: optional,
  META_APP_ID: optional,
  META_APP_SECRET: optional,
  META_API_VERSION: z.string().default("v22.0"),
  META_REDIRECT_URI: optional,
  META_VERIFY_TOKEN: optional,
  RESEND_API_KEY: optional,
  RESEND_FROM_EMAIL: optional,
  PLATFORM_WEBHOOK_SECRET: optional,
  CRON_SECRET: optional,
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

// Public env vars são acessíveis no client + server
export const publicEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});

// Server env só pode ser lido em código server (RSC, route handlers, server actions)
export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() não pode ser chamado no client");
  }
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ENCRYPTION_KEY: process.env.SUPABASE_ENCRYPTION_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_API_VERSION: process.env.META_API_VERSION,
    META_REDIRECT_URI: process.env.META_REDIRECT_URI,
    META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    PLATFORM_WEBHOOK_SECRET: process.env.PLATFORM_WEBHOOK_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}
