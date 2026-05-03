"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

// biome-ignore lint/suspicious/noExplicitAny: Tipos serão regenerados via `pnpm db:types` após conectar Supabase
let _client: SupabaseClient<any, "public", any> | null = null;

export function createClient() {
  if (_client) return _client;
  // biome-ignore lint/suspicious/noExplicitAny: Database genérico até gerar tipos reais
  _client = createBrowserClient<any>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return _client;
}
