import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// Lazy: cria o cliente apenas no primeiro uso. Evita crash durante next build
// quando env vars Supabase não estão presentes em fase de page-data collection.
let _client: SupabaseClient | undefined;
function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "x-base-trafego-source": "mcp-server",
        },
      },
    });
  }
  return _client;
}

// Proxy mantém a API `import { supabase } from "..."; supabase.from(...)` funcionando.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    return Reflect.get(getClient(), prop);
  },
});
