import "server-only";

import { createClient as createSbClient } from "@supabase/supabase-js";
import { publicEnv, getServerEnv } from "@/lib/env";

/**
 * Service role client — bypassa RLS.
 * Usar SOMENTE em rotas server seguras (jamais expor ao client).
 */
export function createAdminClient() {
  const env = getServerEnv();
  // biome-ignore lint/suspicious/noExplicitAny: Database genérico até gerar tipos via Supabase CLI
  return createSbClient<any>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { "x-base-trafego-server": "true" },
      },
    },
  );
}
