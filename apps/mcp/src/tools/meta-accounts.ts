/**
 * Meta Accounts tools — modo LEDGER. Sem chamadas Meta API.
 *
 * Vinculação de uma conta Meta é feita por link_meta_account (register.ts),
 * que apenas armazena meta_business_id + meta_account_id no nosso DB pra
 * mapear quem é dono de qual ad_account. Os tokens NÃO são usados pelo
 * nosso MCP — ficam encriptados pra audit/futura migração de uso.
 */
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { auditLog } from "../lib/audit.js";
import { NotFoundError } from "../lib/errors.js";
import type { AnyTool } from "./types.js";

export const getMetaAccountsTool: AnyTool = {
  name: "get_meta_accounts",
  description:
    "Lista todas as contas Meta Business vinculadas a um cliente, com saldo cacheado e timestamp da última sincronização. (Read-only DB)",
  inputSchema: z.object({
    client_id: z.string().uuid(),
  }),
  handler: async ({ client_id }) => {
    const { data, error } = await supabase
      .from("meta_accounts")
      .select(
        "id, meta_business_id, meta_account_id, meta_account_name, is_active, is_primary, current_balance, daily_spend_cap, currency, last_synced_at, sync_error",
      )
      .eq("client_id", client_id);
    if (error) throw error;
    return { accounts: data ?? [] };
  },
};

export const markMetaSyncTool: AnyTool = {
  name: "mark_meta_sync",
  description: `Marca timestamp de sync de uma conta Meta no nosso DB
(last_synced_at). Use APÓS você (Claude Desktop) ter puxado os dados
via MCP oficial Meta e registrado via record_performance_snapshot ou
bulk_register_meta_data. Apenas atualiza metadado — não chama Meta.`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    meta_account_id: z.string().uuid().optional(),
    sync_error: z.string().nullable().optional(),
  }),
  handler: async ({ client_id, meta_account_id, sync_error }) => {
    let q = supabase
      .from("meta_accounts")
      .select("id, meta_account_name")
      .eq("client_id", client_id)
      .eq("is_active", true);
    q = meta_account_id ? q.eq("id", meta_account_id) : q.eq("is_primary", true);
    const { data: account, error } = await q.single();
    if (error || !account)
      throw new NotFoundError("meta_account", meta_account_id ?? client_id);

    await supabase
      .from("meta_accounts")
      .update({
        last_synced_at: new Date().toISOString(),
        sync_error: sync_error ?? null,
      })
      .eq("id", account.id);

    await auditLog({
      actorType: "claude",
      action: "meta_account.sync_marked",
      resourceType: "meta_account",
      resourceId: account.id,
      clientId: client_id,
      metadata: { sync_error: sync_error ?? null },
    });

    return {
      success: true,
      account_id: account.id,
      account_name: account.meta_account_name,
      message: "Timestamp de sync registrado.",
    };
  },
};

export const checkMetaBalanceTool: AnyTool = {
  name: "check_meta_balance",
  description: `Retorna o saldo CACHEADO no DB (não chama Meta API).
Pra obter saldo ao vivo, use o MCP oficial Meta (ads_get_ad_accounts).
Depois você pode atualizar o cache via update_meta_balance.`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
  }),
  handler: async ({ client_id }) => {
    const { data: account } = await supabase
      .from("meta_accounts")
      .select(
        "id, meta_account_name, currency, current_balance, daily_spend_cap, last_synced_at",
      )
      .eq("client_id", client_id)
      .eq("is_primary", true)
      .single();
    if (!account) throw new NotFoundError("meta_account", client_id);

    return {
      account_id: account.id,
      account_name: account.meta_account_name,
      currency: account.currency,
      balance_cached: account.current_balance,
      daily_cap: account.daily_spend_cap,
      last_synced_at: account.last_synced_at,
      note: "Valor cacheado. Pra valor ao vivo, consulte MCP oficial Meta.",
    };
  },
};

export const updateMetaBalanceTool: AnyTool = {
  name: "update_meta_balance",
  description: `Atualiza o saldo cacheado de uma conta Meta no nosso DB.
Use depois de você ter consultado o saldo ao vivo via MCP oficial Meta.
NÃO chama Meta — só escreve no DB.`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    meta_account_id: z.string().uuid().optional(),
    current_balance: z.number().describe("Saldo atual em unidade base (centavos)"),
    daily_spend_cap: z.number().optional(),
  }),
  handler: async ({ client_id, meta_account_id, current_balance, daily_spend_cap }) => {
    let q = supabase
      .from("meta_accounts")
      .select("id")
      .eq("client_id", client_id)
      .eq("is_active", true);
    q = meta_account_id ? q.eq("id", meta_account_id) : q.eq("is_primary", true);
    const { data: account, error } = await q.single();
    if (error || !account)
      throw new NotFoundError("meta_account", meta_account_id ?? client_id);

    const updates: Record<string, unknown> = {
      current_balance,
      last_synced_at: new Date().toISOString(),
    };
    if (daily_spend_cap !== undefined) updates.daily_spend_cap = daily_spend_cap;

    await supabase.from("meta_accounts").update(updates).eq("id", account.id);

    await auditLog({
      actorType: "claude",
      action: "meta_account.balance_updated",
      resourceType: "meta_account",
      resourceId: account.id,
      clientId: client_id,
      metadata: { current_balance, daily_spend_cap },
    });

    return { success: true, account_id: account.id, current_balance };
  },
};

export const metaAccountsTools = [
  getMetaAccountsTool,
  markMetaSyncTool,
  checkMetaBalanceTool,
  updateMetaBalanceTool,
];
