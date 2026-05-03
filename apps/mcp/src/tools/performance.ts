import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import type { AnyTool } from "./types.js";

const periodToDays: Record<string, number> = {
  today: 1,
  yesterday: 1,
  last_7d: 7,
  last_14d: 14,
  last_30d: 30,
  last_90d: 90,
};

function getRange(period: string) {
  const end = new Date();
  const days = periodToDays[period] ?? 7;
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export const getPerformanceTool: AnyTool = {
  name: "get_performance",
  description: "Métricas consolidadas de um cliente em um período. Use pra análise periódica.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    period: z
      .enum(["today", "yesterday", "last_7d", "last_14d", "last_30d", "last_90d"])
      .default("last_7d"),
  }),
  handler: async ({ client_id, period }) => {
    const { start, end } = getRange(period);
    const { data, error } = await supabase.rpc("client_performance_summary", {
      p_client_id: client_id,
      p_start: start,
      p_end: end,
    });
    if (error) throw error;
    return { period, metrics: data?.[0] ?? null };
  },
};

export const getTopPerformingTool: AnyTool = {
  name: "get_top_performing",
  description: "Top criativos/campanhas por métrica (roas, ctr, cpa).",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    metric: z.enum(["roas", "ctr", "cpa", "spend"]).default("roas"),
    level: z.enum(["campaign", "ad_set", "ad"]).default("ad"),
    limit: z.number().int().positive().max(20).default(5),
    period: z.enum(["last_7d", "last_30d"]).default("last_7d"),
  }),
  handler: async ({ client_id, metric, level, limit, period }) => {
    const { start } = getRange(period);
    const idColumn = `${level}_id`;
    const { data, error } = await supabase
      .from("performance_snapshots")
      .select(
        `${idColumn}, impressions, clicks, spend, conversions, conversion_value, ctr, cpc, cpm, cpa, roas, frequency`,
      )
      .eq("client_id", client_id)
      .eq("granularity", "day")
      .gte("period_start", start)
      .order(metric, { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { items: data ?? [] };
  },
};

export const getUnderperformingTool: AnyTool = {
  name: "get_underperforming",
  description: "Identifica criativos abaixo de threshold (ROAS < 1, CTR < 1%, frequency > 5).",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    threshold_roas: z.number().default(1.0),
    threshold_ctr: z.number().default(0.01),
    fatigue_frequency: z.number().default(5),
  }),
  handler: async ({ client_id, threshold_roas, threshold_ctr, fatigue_frequency }) => {
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("performance_snapshots")
      .select("ad_id, ad_set_id, campaign_id, roas, ctr, frequency, spend")
      .eq("client_id", client_id)
      .eq("granularity", "day")
      .gte("period_start", start);
    if (error) throw error;

    const underperformers = (data ?? []).filter(
      (s) =>
        (s.roas != null && s.roas < threshold_roas) ||
        (s.ctr != null && s.ctr < threshold_ctr * 100) ||
        (s.frequency != null && s.frequency > fatigue_frequency),
    );
    return { underperformers };
  },
};

export const comparePeriodsTool: AnyTool = {
  name: "compare_periods",
  description: "Compara métricas entre dois períodos (atual vs anterior).",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    period: z.enum(["last_7d", "last_30d"]).default("last_7d"),
  }),
  handler: async ({ client_id, period }) => {
    const days = periodToDays[period];
    const now = new Date();
    const startCurrent = new Date(now.getTime() - days * 86400000);
    const startPrevious = new Date(now.getTime() - 2 * days * 86400000);

    const [{ data: cur }, { data: prev }] = await Promise.all([
      supabase.rpc("client_performance_summary", {
        p_client_id: client_id,
        p_start: startCurrent.toISOString(),
        p_end: now.toISOString(),
      }),
      supabase.rpc("client_performance_summary", {
        p_client_id: client_id,
        p_start: startPrevious.toISOString(),
        p_end: startCurrent.toISOString(),
      }),
    ]);

    return {
      current: cur?.[0] ?? null,
      previous: prev?.[0] ?? null,
    };
  },
};

export const getAudienceBreakdownTool: AnyTool = {
  name: "get_audience_breakdown",
  description: "Performance segmentada por dimensão (idade, gênero, dispositivo, placement).",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    dimension: z.enum(["age", "gender", "placement", "device", "country"]),
    period: z.enum(["last_7d", "last_30d"]).default("last_7d"),
  }),
  handler: async ({ client_id, dimension, period }) => {
    const { start } = getRange(period);
    const { data, error } = await supabase
      .from("performance_snapshots")
      .select(
        "breakdown_dimension, breakdown_value, impressions, clicks, spend, conversions, conversion_value, ctr, cpc, cpa, roas",
      )
      .eq("client_id", client_id)
      .eq("breakdown_dimension", dimension)
      .gte("period_start", start);
    if (error) throw error;
    return { dimension, items: data ?? [] };
  },
};

export const performanceTools = [
  getPerformanceTool,
  getTopPerformingTool,
  getUnderperformingTool,
  comparePeriodsTool,
  getAudienceBreakdownTool,
];
