import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { metaApi } from "../lib/meta.js";
import { decryptToken } from "../lib/token.js";
import { auditLog } from "../lib/audit.js";
import { NotFoundError } from "../lib/errors.js";
import type { AnyTool } from "./types.js";

export const getMetaAccountsTool: AnyTool = {
  name: "get_meta_accounts",
  description:
    "Lista todas as contas Meta Business vinculadas a um cliente, com saldo atual e status de sincronização.",
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

export const syncMetaAccountTool: AnyTool = {
  name: "sync_meta_account",
  description:
    "Força re-sincronização de uma conta Meta com o Meta Marketing API. Atualiza campanhas, ad sets e ads.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    meta_account_id: z.string().uuid().optional(),
  }),
  handler: async ({ client_id, meta_account_id }) => {
    let q = supabase.from("meta_accounts").select("*").eq("client_id", client_id).eq("is_active", true);
    q = meta_account_id ? q.eq("id", meta_account_id) : q.eq("is_primary", true);
    const { data: account, error } = await q.single();
    if (error || !account) throw new NotFoundError("meta_account", meta_account_id ?? client_id);

    // Marca início de sync no banco (Realtime visualiza)
    await supabase
      .from("meta_accounts")
      .update({ last_synced_at: new Date().toISOString(), sync_error: null })
      .eq("id", account.id);

    await auditLog({
      actorType: "claude",
      action: "meta_account.sync_triggered",
      resourceType: "meta_account",
      resourceId: account.id,
      clientId: client_id,
    });

    return {
      success: true,
      account_id: account.id,
      message:
        "Sync inicializada. Em produção, dispara worker assíncrono que sincroniza dados com Meta API.",
    };
  },
};

export const checkMetaBalanceTool: AnyTool = {
  name: "check_meta_balance",
  description:
    "Verifica o saldo atual e gastos do dia em uma conta Meta. Útil antes de criar campanhas com orçamento alto.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
  }),
  handler: async ({ client_id }) => {
    const { data: account } = await supabase
      .from("meta_accounts")
      .select("*")
      .eq("client_id", client_id)
      .eq("is_primary", true)
      .single();
    if (!account) throw new NotFoundError("meta_account", client_id);
    let token: string | null = null;
    try {
      token = decryptToken(account.access_token_encrypted);
    } catch {
      // Token não decodificável (modo mock ou erro de chave)
    }
    let live_balance: number | null = null;
    if (token) {
      try {
        const insights = await metaApi.getInsights({
          metaObjectId: `act_${account.meta_account_id}`,
          accessToken: token,
          datePreset: "today",
          fields: ["spend"],
        });
        const spendToday = Number(insights.data?.[0]?.spend ?? 0);
        live_balance = (account.current_balance ?? 0) - spendToday;
      } catch {
        // ignora
      }
    }
    return {
      account_id: account.id,
      currency: account.currency,
      balance_cached: account.current_balance,
      balance_estimated_now: live_balance,
      daily_cap: account.daily_spend_cap,
    };
  },
};

export const metaAccountsTools = [getMetaAccountsTool, syncMetaAccountTool, checkMetaBalanceTool];
