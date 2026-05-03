import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { auditLog } from "../lib/audit.js";
import type { AnyTool } from "./types.js";

export const generateReportTool: AnyTool = {
  name: "generate_report",
  description:
    "Gera um relatório (weekly/monthly/custom) com snapshot de métricas. Em produção, materializa PDF/CSV no Storage.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    type: z.enum(["weekly", "monthly", "custom", "executive"]).default("weekly"),
    format: z.enum(["pdf", "csv", "web_link"]).default("pdf"),
    period_start: z.string(),
    period_end: z.string(),
    include_creatives: z.boolean().default(true),
    include_recommendations: z.boolean().default(true),
  }),
  handler: async (input) => {
    const { data: summary } = await supabase.rpc("client_performance_summary", {
      p_client_id: input.client_id,
      p_start: new Date(input.period_start).toISOString(),
      p_end: new Date(input.period_end).toISOString(),
    });

    const dataSnapshot = {
      summary: summary?.[0] ?? null,
      generated_at: new Date().toISOString(),
    };

    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", input.client_id)
      .single();

    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        client_id: input.client_id,
        title: `${input.type === "weekly" ? "Relatório Semanal" : input.type === "monthly" ? "Relatório Mensal" : "Relatório"} — ${client?.name ?? "Cliente"}`,
        type: input.type,
        format: input.format,
        period_start: input.period_start,
        period_end: input.period_end,
        data_snapshot: dataSnapshot as never,
        generated_by_claude: true,
      })
      .select()
      .single();
    if (error) throw error;

    await auditLog({
      actorType: "claude",
      action: "report.generated",
      resourceType: "report",
      resourceId: report.id,
      clientId: input.client_id,
    });

    return {
      success: true,
      report_id: report.id,
      message: "Relatório gerado e disponível em /admin/reports e /cliente/.../investimento.",
    };
  },
};

export const listReportsTool: AnyTool = {
  name: "list_reports",
  description: "Histórico de relatórios gerados (por cliente).",
  inputSchema: z.object({
    client_id: z.string().uuid().optional(),
    limit: z.number().int().positive().max(50).default(20),
  }),
  handler: async ({ client_id, limit }) => {
    let q = supabase
      .from("reports")
      .select("id, title, type, format, period_start, period_end, file_url, created_at, client:clients(name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (client_id) q = q.eq("client_id", client_id);
    const { data, error } = await q;
    if (error) throw error;
    return { reports: data ?? [] };
  },
};

export const reportsTools = [generateReportTool, listReportsTool];
