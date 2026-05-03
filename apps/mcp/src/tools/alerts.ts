import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import type { AnyTool } from "./types.js";

export const listAlertsTool: AnyTool = {
  name: "list_alerts",
  description: "Lista alertas ativos. Filtra por client_id ou status.",
  inputSchema: z.object({
    client_id: z.string().uuid().optional(),
    status: z.enum(["active", "acknowledged", "resolved", "dismissed"]).default("active"),
    limit: z.number().int().positive().max(100).default(20),
  }),
  handler: async ({ client_id, status, limit }) => {
    let q = supabase
      .from("alerts")
      .select("*, client:clients(name, slug)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (client_id) q = q.eq("client_id", client_id);
    const { data, error } = await q;
    if (error) throw error;
    return { alerts: data ?? [] };
  },
};

export const createAlertTool: AnyTool = {
  name: "create_alert",
  description: "Cria alerta manual (Claude usa quando detecta algo via análise de performance).",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    type: z.enum([
      "ctr_drop",
      "cpm_high",
      "budget_low",
      "creative_fatigue",
      "audience_overlap",
      "account_suspended",
      "token_expired",
      "custom",
    ]),
    severity: z.enum(["info", "warning", "error", "critical"]).default("warning"),
    title: z.string().min(3).max(140),
    message: z.string().min(10).max(1000),
    data: z.record(z.unknown()).optional(),
  }),
  handler: async (input) => {
    const { data, error } = await supabase.rpc("create_alert", {
      p_client_id: input.client_id,
      p_type: input.type,
      p_severity: input.severity,
      p_title: input.title,
      p_message: input.message,
      p_data: (input.data ?? {}) as never,
    });
    if (error) throw error;
    return { success: true, alert_id: data };
  },
};

export const resolveAlertTool: AnyTool = {
  name: "resolve_alert",
  description: "Marca alerta como resolvido com nota.",
  inputSchema: z.object({
    alert_id: z.string().uuid(),
    resolution_notes: z.string().min(5),
  }),
  handler: async ({ alert_id, resolution_notes }) => {
    const { error } = await supabase
      .from("alerts")
      .update({
        status: "resolved",
        resolution_notes,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", alert_id);
    if (error) throw error;
    return { success: true };
  },
};

export const alertsTools = [listAlertsTool, createAlertTool, resolveAlertTool];
