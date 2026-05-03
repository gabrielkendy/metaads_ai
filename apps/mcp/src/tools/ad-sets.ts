import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { metaApi } from "../lib/meta.js";
import { decryptToken } from "../lib/token.js";
import { auditLog } from "../lib/audit.js";
import { NotFoundError } from "../lib/errors.js";
import type { AnyTool } from "./types.js";
import { META_BILLING_EVENTS, META_OPTIMIZATION_GOALS } from "@base-trafego/shared/constants";

export const listAdSetsTool: AnyTool = {
  name: "list_ad_sets",
  description: "Lista ad sets de uma campanha.",
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

export const createAdSetTool: AnyTool = {
  name: "create_ad_set",
  description:
    "Cria ad set dentro de uma campanha — define audience, budget e optimization goal.",
  inputSchema: z.object({
    campaign_id: z.string().uuid(),
    name: z.string().min(3).max(120),
    daily_budget: z.number().positive(),
    optimization_goal: z.enum(META_OPTIMIZATION_GOALS),
    billing_event: z.enum(META_BILLING_EVENTS).default("IMPRESSIONS"),
    targeting: z.record(z.unknown()),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*, meta_account:meta_accounts(*)")
      .eq("id", input.campaign_id)
      .single();
    if (!campaign) throw new NotFoundError("campaign", input.campaign_id);

    let token = "";
    try {
      token = decryptToken(campaign.meta_account.access_token_encrypted);
    } catch {}
    const meta = await metaApi.createAdSet({
      accountId: campaign.meta_account.meta_account_id,
      accessToken: token,
      body: {
        name: input.name,
        campaign_id: campaign.meta_campaign_id,
        daily_budget: Math.round(input.daily_budget * 100),
        billing_event: input.billing_event,
        optimization_goal: input.optimization_goal,
        status: "PAUSED",
        targeting: input.targeting,
      },
    });

    const { data, error } = await supabase
      .from("ad_sets")
      .insert({
        campaign_id: input.campaign_id,
        meta_ad_set_id: meta.id,
        name: input.name,
        daily_budget: input.daily_budget,
        optimization_goal: input.optimization_goal,
        billing_event: input.billing_event,
        targeting: input.targeting as never,
        status: "paused",
      })
      .select()
      .single();
    if (error) throw error;

    await auditLog({
      actorType: "claude",
      action: "ad_set.created",
      resourceType: "ad_set",
      resourceId: data.id,
      clientId: campaign.client_id,
      afterData: data,
      metadata: { reasoning: input.reasoning },
    });

    return { success: true, ad_set: data };
  },
};

export const updateAdSetTool: AnyTool = {
  name: "update_ad_set",
  description: "Atualiza budget, targeting ou status de um ad set.",
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
  description: "Performance de um ad set específico nos últimos N dias.",
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

export const adSetsTools = [
  listAdSetsTool,
  createAdSetTool,
  updateAdSetTool,
  getAdSetPerformanceTool,
];
