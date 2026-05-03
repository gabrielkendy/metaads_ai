import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { NotFoundError } from "../lib/errors.js";
import { assertClientExists, sanitizeString } from "../lib/guards.js";
import type { AnyTool } from "./types.js";
import { auditLog } from "../lib/audit.js";

export const listClientsTool: AnyTool = {
  name: "list_clients",
  description:
    "Lista todos os clientes da Agência BASE com status, plano e métricas resumidas. Use quando precisar saber quem são os clientes ativos.",
  inputSchema: z.object({
    status: z.enum(["active", "paused", "onboarding", "churned"]).optional(),
    limit: z.number().int().positive().max(100).default(50),
  }),
  handler: async ({ status, limit }) => {
    let q = supabase
      .from("clients")
      .select("id, slug, name, status, plan, industry, monthly_budget_limit, brand_primary_color")
      .order("name")
      .limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return { clients: data ?? [] };
  },
};

export const getClientTool: AnyTool = {
  name: "get_client",
  description:
    "Detalhes completos de um cliente — settings, contas Meta, plano, limites. Use 'slug' OU 'client_id'.",
  inputSchema: z
    .object({
      client_id: z.string().uuid().optional(),
      slug: z.string().optional(),
    })
    .refine((d) => d.client_id || d.slug, {
      message: "Informe client_id OU slug",
    }),
  handler: async ({ client_id, slug }) => {
    let q = supabase.from("clients").select(
      `*, meta_accounts(id, meta_account_id, meta_account_name, current_balance, currency, is_active, is_primary)`,
    );
    q = client_id ? q.eq("id", client_id) : q.eq("slug", slug!);
    const { data, error } = await q.single();
    if (error || !data) throw new NotFoundError("client", client_id ?? slug ?? "");
    return data;
  },
};

export const createClientTool: AnyTool = {
  name: "create_client",
  description:
    "Cria um novo cliente na plataforma. Use quando estiver onboardando um cliente novo da Agência. NÃO cria conta Meta — isso é OAuth manual.",
  inputSchema: z.object({
    slug: z.string().min(2).max(48).regex(/^[a-z0-9-]+$/),
    name: z.string().min(2).max(120),
    legal_name: z.string().optional(),
    industry: z.string().optional(),
    plan: z.enum(["starter", "pro", "premium", "custom"]).default("pro"),
    monthly_budget_limit: z.number().positive().optional(),
    description: z.string().optional(),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    const { reasoning, ...data } = input;
    const { data: client, error } = await supabase
      .from("clients")
      .insert({ ...data, status: "onboarding" })
      .select()
      .single();
    if (error) throw error;
    await supabase.from("agent_configs").insert({ client_id: client.id });
    await auditLog({
      actorType: "claude",
      action: "client.created",
      resourceType: "client",
      resourceId: client.id,
      clientId: client.id,
      afterData: client,
      metadata: { reasoning },
    });
    return { client };
  },
};

export const updateClientSettingsTool: AnyTool = {
  name: "update_client_settings",
  description:
    "Atualiza configurações de um cliente (plano, limites, branding, aprovação). Use com cuidado — algumas mudanças afetam orçamento.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    updates: z.object({
      name: z.string().optional(),
      plan: z.enum(["starter", "pro", "premium", "custom"]).optional(),
      status: z.enum(["active", "paused", "onboarding", "churned"]).optional(),
      monthly_budget_limit: z.number().positive().optional(),
      monthly_budget_soft_cap: z.number().positive().optional(),
      requires_approval_above: z.number().nonnegative().optional(),
      auto_approve_creatives: z.boolean().optional(),
      brand_primary_color: z.string().optional(),
    }),
    reasoning: z.string().min(10),
  }),
  handler: async ({ client_id, updates, reasoning }) => {
    // 🔒 Guard: client_id válido e ativo
    await assertClientExists(client_id);

    // sanitização
    if (updates.name) updates.name = sanitizeString(updates.name, 120);

    const { data: before } = await supabase.from("clients").select("*").eq("id", client_id).single();
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", client_id)
      .select()
      .single();
    if (error) throw error;
    await auditLog({
      actorType: "claude",
      action: "client.updated",
      resourceType: "client",
      resourceId: client_id,
      clientId: client_id,
      beforeData: before,
      afterData: data,
      metadata: { reasoning },
    });
    return { client: data };
  },
};

export const getClientSummaryTool: AnyTool = {
  name: "get_client_summary",
  description:
    "Resumo executivo de um cliente — métricas 7d, 30d, campanhas ativas, alertas. Use pra apresentar ao cliente ou ao admin.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
  }),
  handler: async ({ client_id }) => {
    const [{ data: client }, { data: perf7d }, { data: perf30d }, { count: campaigns }, { count: ads }, { data: alerts }] =
      await Promise.all([
        supabase.from("clients").select("*").eq("id", client_id).single(),
        supabase.rpc("client_performance_summary", {
          p_client_id: client_id,
          p_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          p_end: new Date().toISOString(),
        }),
        supabase.rpc("client_performance_summary", {
          p_client_id: client_id,
          p_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          p_end: new Date().toISOString(),
        }),
        supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .eq("client_id", client_id)
          .eq("status", "active"),
        supabase
          .from("ads")
          .select("id", { count: "exact", head: true })
          .eq("client_id", client_id)
          .eq("status", "active"),
        supabase
          .from("alerts")
          .select("id, severity, type, title")
          .eq("client_id", client_id)
          .eq("status", "active")
          .limit(5),
      ]);

    if (!client) throw new NotFoundError("client", client_id);

    return {
      client,
      metrics_7d: perf7d?.[0] ?? null,
      metrics_30d: perf30d?.[0] ?? null,
      active_campaigns: campaigns ?? 0,
      active_ads: ads ?? 0,
      active_alerts: alerts ?? [],
    };
  },
};

export const clientsTools = [
  listClientsTool,
  getClientTool,
  createClientTool,
  updateClientSettingsTool,
  getClientSummaryTool,
];
