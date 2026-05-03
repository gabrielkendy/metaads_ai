// ════════════════════════════════════════════════════════════════════
// Database types — placeholder permissivo
// ════════════════════════════════════════════════════════════════════
// Após conectar Supabase, gere os tipos reais com:
//
//   pnpm db:types
//
// (executa `supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public`)
//
// O placeholder usa `any` propositalmente pra não bloquear builds antes de
// configurar o projeto Supabase. Em produção, os tipos gerados garantem
// type-safety completo nas queries.
// ════════════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// biome-ignore lint/suspicious/noExplicitAny: Placeholder permissivo até gerar tipos via Supabase CLI
type AnyTable = {
  Row: any;
  Insert: any;
  Update: any;
  Relationships: any;
};

// biome-ignore lint/suspicious/noExplicitAny: Placeholder permissivo
type AnyFn = {
  Args: any;
  Returns: any;
};

export interface Database {
  public: {
    Tables: {
      profiles: AnyTable;
      clients: AnyTable;
      client_users: AnyTable;
      meta_accounts: AnyTable;
      campaigns: AnyTable;
      ad_sets: AnyTable;
      ads: AnyTable;
      creatives_assets: AnyTable;
      performance_snapshots: AnyTable;
      alerts: AnyTable;
      approvals: AnyTable;
      claude_actions: AnyTable;
      audit_logs: AnyTable;
      reports: AnyTable;
      notifications: AnyTable;
      messages: AnyTable;
      agent_configs: AnyTable;
    };
    Views: {
      client_dashboard_summary: { Row: any; Relationships: any };
    };
    Functions: {
      admin_dashboard_overview: AnyFn;
      client_performance_summary: AnyFn;
      mark_all_notifications_read: AnyFn;
      create_alert: AnyFn;
      get_client_by_slug: AnyFn;
      expire_old_approvals: AnyFn;
      encrypt_token: AnyFn;
      decrypt_token: AnyFn;
    };
    Enums: { [k: string]: string };
    CompositeTypes: { [k: string]: unknown };
  };
}
