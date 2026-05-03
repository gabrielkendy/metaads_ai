/**
 * Ad Set tools — modo LEDGER. Read-only DB.
 *
 * Criação de ad set é feita via MCP oficial Meta. Pra refletir no nosso DB,
 * use register_ad_set (em tools/register.ts).
 */
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { NotFoundError } from "../lib/errors.js";
import type { AnyTool } from "./types.js";

export const listAdSetsTool: AnyTool = {
  name: "list_ad_sets",
  description: "Lista ad sets de uma campanha. (Read-only DB)",
  inputSchema: z.object({ campaign_id: z.string().uuid() }),
  handler: async ({ campaign_id }) => {
    const { data, error } = await supabase
      .from("ad_sets")
      .select("id, name, status, daily_budget, optimization_goal")
      .eq("campaign_id", campaign_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { ad_sets: data ?? [] };
  },
};

export const updateAdSetTool: AnyTool = {
  name: "update_ad_set",
  description: `Atualiza metadata de ad set NO NOSSO DB (budget refletido,
targeting, status). NÃO chama Meta — apenas reflete alteração feita via
MCP oficial Meta Ads.`,
  inputSchema: z.object({
    ad_set_id: z.string().uuid(),
    daily_budget: z.number().positive().optional(),
    targeting: z.record(z.unknown()).optional(),
    status: z.enum(["active", "paused"]).optional(),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    const updates: Record<string, unknown> = {};
    if (input.daily_budget !== undefined) updates.daily_budget = input.daily_budget;
    if (input.targeting) updates.targeting = input.targeting;
    if (input.status) updates.status = input.status;

    const { data, error } = await supabase
      .from("ad_sets")
      .update(updates)
      .eq("id", input.ad_set_id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, ad_set: data };
  },
};

export const getAdSetPerformanceTool: AnyTool = {
  name: "get_ad_set_performance",
  description: "Performance de um ad set (lê do DB performance_snapshots, alimentado por record_performance_snapshot).",
  inputSchema: z.object({
    ad_set_id: z.string().uuid(),
    days: z.number().int().positive().max(90).default(7),
  }),
  handler: async ({ ad_set_id, days }) => {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("performance_snapshots")
      .select("period_start, impressions, clicks, spend, ctr, cpc, cpm, conversions")
      .eq("ad_set_id", ad_set_id)
      .eq("granularity", "day")
      .gte("period_start", start)
      .order("period_start");
    if (error) throw error;
    return { performance: data ?? [] };
  },
};

// Mantém import sem usar pra silenciar lint — schemas Meta agora só são consumidos
// pelos register_* tools que aceitam payloads externos
import "@base-trafego/shared/constants";

export const adSetsTools = [
  listAdSetsTool,
  updateAdSetTool,
  getAdSetPerformanceTool,
];
