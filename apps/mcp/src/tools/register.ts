// ════════════════════════════════════════════════════════════════════
// REGISTER TOOLS — modo "ledger"
//
// Claude Desktop usa o MCP OFICIAL DA META pra criar/editar campanhas
// no Meta Ads. Depois chama essas tools pra REGISTRAR a ação na
// plataforma BASE Tráfego Command.
//
// Vantagem: zero gasto com Meta API server-side. Tudo passa pelo plano
// Max do Claude Desktop.
// ════════════════════════════════════════════════════════════════════

import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { auditLog, logClaudeAction } from "../lib/audit.js";
import {
  assertClientExists,
  assertResourceBelongsToClient,
  guardClientOperation,
  sanitizeString,
} from "../lib/guards.js";
import { NotFoundError } from "../lib/errors.js";
import type { AnyTool } from "./types.js";
import {
  META_CAMPAIGN_OBJECTIVES,
  META_CTA_TYPES,
  META_OPTIMIZATION_GOALS,
} from "@base-trafego/shared/constants";

// ─── 1. link_meta_account ────────────────────────────────────────────
export const linkMetaAccountTool: AnyTool = {
  name: "link_meta_account",
  description: `Vincula uma conta Meta Business a um cliente DA PLATAFORMA BASE.

Use quando Kendy te disser "vincula a conta X do Meta com o cliente Y" e você
JÁ TEM acesso àquela conta via MCP oficial Meta (Business Manager).

NÃO precisa de OAuth porque Claude Desktop já está autenticado no Meta.

Args obrigatórios:
- client_id: UUID do cliente na plataforma BASE
- meta_business_id: ID do Business Manager (ex: "123456789012345")
- meta_account_id: ID da conta de anúncios SEM o "act_" (ex: "987654321")
- meta_account_name: nome legível ("Just Burn - BM Principal")`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    meta_business_id: z.string().min(1),
    meta_account_id: z.string().min(1),
    meta_account_name: z.string().optional(),
    currency: z.string().default("BRL"),
    is_primary: z.boolean().default(true),
  }),
  handler: async (input) => {
    await guardClientOperation(input.client_id, { rateLimitPerMinute: 10 });

    // Se essa for is_primary, despromove as outras
    if (input.is_primary) {
      await supabase
        .from("meta_accounts")
        .update({ is_primary: false })
        .eq("client_id", input.client_id);
    }

    const { data, error } = await supabase
      .from("meta_accounts")
      .upsert(
        {
          client_id: input.client_id,
          meta_business_id: input.meta_business_id,
          meta_account_id: input.meta_account_id,
          meta_account_name: input.meta_account_name ?? null,
          currency: input.currency,
          is_primary: input.is_primary,
          is_active: true,
          // Token vazio porque Claude usa MCP oficial Meta pra autenticar
          access_token_encrypted: "EXTERNAL_MCP_AUTH",
          scopes: ["external_via_claude_desktop"],
        },
        { onConflict: "client_id,meta_account_id" },
      )
      .select()
      .single();

    if (error) throw error;

    await auditLog({
      actorType: "claude",
      action: "meta_account.linked",
      resourceType: "meta_account",
      resourceId: data.id,
      clientId: input.client_id,
      afterData: data,
    });

    return {
      success: true,
      meta_account: data,
      message: `Conta Meta ${input.meta_account_id} vinculada ao cliente.`,
    };
  },
};

// ─── 2. register_campaign ─────────────────────────────────────────────
export const registerCampaignTool: AnyTool = {
  name: "register_campaign",
  description: `REGISTRA na plataforma BASE uma campanha que VOCÊ JÁ CRIOU no Meta via MCP oficial.

Workflow típico:
  1. Você (Claude) usa MCP oficial Meta pra criar a campanha → recebe meta_campaign_id
  2. Você chama register_campaign passando o meta_campaign_id
  3. Plataforma BASE registra, dispara Realtime, cliente vê na dashboard

Args obrigatórios:
- client_id: UUID do cliente BASE
- meta_account_id: UUID interno da meta_account (não o do Meta — use list_clients pra pegar)
- meta_campaign_id: ID retornado pelo Meta API (ex: "120211234567890")
- name, objective, daily_budget, status

Opcional: targeting JSON, ad sets aninhados (use register_ad_set depois)`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    meta_account_id: z.string().uuid().describe("UUID da meta_account na plataforma"),
    meta_campaign_id: z.string().min(1),
    name: z.string().min(3).max(120),
    objective: z.enum(META_CAMPAIGN_OBJECTIVES),
    daily_budget: z.number().positive().optional(),
    lifetime_budget: z.number().positive().optional(),
    status: z
      .enum(["draft", "pending_approval", "active", "paused", "completed", "archived"])
      .default("paused"),
    targeting: z.record(z.unknown()).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    await guardClientOperation(input.client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("meta_account", input.meta_account_id, input.client_id);

    await logClaudeAction({
      clientId: input.client_id,
      actionType: "create_campaign",
      toolName: "register_campaign",
      inputPayload: input,
      reasoning: sanitizeString(input.reasoning, 1000),
      status: "success",
    });

    const { data, error } = await supabase
      .from("campaigns")
      .upsert(
        {
          client_id: input.client_id,
          meta_account_id: input.meta_account_id,
          meta_campaign_id: input.meta_campaign_id,
          name: sanitizeString(input.name, 120),
          objective: input.objective,
          status: input.status,
          daily_budget: input.daily_budget ?? null,
          lifetime_budget: input.lifetime_budget ?? null,
          targeting: (input.targeting as never) ?? {},
          start_date: input.start_date ?? null,
          end_date: input.end_date ?? null,
          created_by_claude: true,
        },
        { onConflict: "meta_campaign_id" },
      )
      .select()
      .single();

    if (error) throw error;

    await auditLog({
      actorType: "claude",
      action: "campaign.registered",
      resourceType: "campaign",
      resourceId: data.id,
      clientId: input.client_id,
      afterData: data,
      metadata: { reasoning: input.reasoning },
    });

    return {
      success: true,
      campaign: data,
      message: `Campanha "${input.name}" registrada na plataforma. Cliente vê na dashboard.`,
    };
  },
};

// ─── 3. register_ad_set ───────────────────────────────────────────────
export const registerAdSetTool: AnyTool = {
  name: "register_ad_set",
  description: `Registra na plataforma BASE um ad set criado no Meta via MCP oficial.

Args:
- client_id (pra validação)
- campaign_id: UUID interno da campanha (use list_campaigns pra pegar)
- meta_ad_set_id: ID retornado pelo Meta
- name, optimization_goal, daily_budget, targeting`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    campaign_id: z.string().uuid(),
    meta_ad_set_id: z.string().min(1),
    name: z.string().min(3).max(120),
    optimization_goal: z.enum(META_OPTIMIZATION_GOALS).optional(),
    billing_event: z.string().optional(),
    daily_budget: z.number().positive().optional(),
    targeting: z.record(z.unknown()).optional(),
    status: z.enum(["active", "paused"]).default("paused"),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    await guardClientOperation(input.client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("campaign", input.campaign_id, input.client_id);

    const { data, error } = await supabase
      .from("ad_sets")
      .upsert(
        {
          campaign_id: input.campaign_id,
          meta_ad_set_id: input.meta_ad_set_id,
          name: sanitizeString(input.name, 120),
          status: input.status,
          daily_budget: input.daily_budget ?? null,
          optimization_goal: input.optimization_goal ?? null,
          billing_event: input.billing_event ?? null,
          targeting: (input.targeting as never) ?? {},
        },
        { onConflict: "meta_ad_set_id" },
      )
      .select()
      .single();
    if (error) throw error;

    await auditLog({
      actorType: "claude",
      action: "ad_set.registered",
      resourceType: "ad_set",
      resourceId: data.id,
      clientId: input.client_id,
      afterData: data,
      metadata: { reasoning: input.reasoning },
    });

    return { success: true, ad_set: data };
  },
};

// ─── 4. register_ad ──────────────────────────────────────────────────
export const registerAdTool: AnyTool = {
  name: "register_ad",
  description: `Registra na plataforma BASE um anúncio criado no Meta via MCP oficial.

Esse aqui é importante porque carrega o COPY (headline, body, CTA) que o cliente
final vai aprovar/ver.

Args:
- client_id, ad_set_id (UUID interno)
- meta_ad_id: ID Meta
- name, headline, body, cta_type, link_url
- image_url ou video_url (opcional — sem isso aparece placeholder)
- status: 'pending_approval' (default — cliente precisa aprovar) ou 'active'`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    ad_set_id: z.string().uuid(),
    meta_ad_id: z.string().min(1),
    meta_creative_id: z.string().optional(),
    name: z.string().min(3).max(120),
    headline: z.string().min(3).max(40),
    body: z.string().min(5).max(125),
    cta_type: z.enum(META_CTA_TYPES).default("LEARN_MORE"),
    link_url: z.string().url(),
    image_url: z.string().url().optional(),
    video_url: z.string().url().optional(),
    thumbnail_url: z.string().url().optional(),
    status: z
      .enum(["pending_approval", "approved", "active", "paused", "rejected", "archived"])
      .default("pending_approval"),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    await guardClientOperation(input.client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("ad_set", input.ad_set_id, input.client_id);

    const { data, error } = await supabase
      .from("ads")
      .upsert(
        {
          client_id: input.client_id,
          ad_set_id: input.ad_set_id,
          meta_ad_id: input.meta_ad_id,
          meta_creative_id: input.meta_creative_id ?? null,
          name: sanitizeString(input.name, 120),
          headline: sanitizeString(input.headline, 40),
          body: sanitizeString(input.body, 125),
          cta_type: input.cta_type,
          link_url: input.link_url,
          image_url: input.image_url ?? null,
          video_url: input.video_url ?? null,
          thumbnail_url: input.thumbnail_url ?? input.image_url ?? null,
          status: input.status,
        },
        { onConflict: "meta_ad_id" },
      )
      .select()
      .single();
    if (error) throw error;

    // Notifica admins se precisa aprovação cliente
    if (input.status === "pending_approval") {
      const { data: clientUsers } = await supabase
        .from("client_users")
        .select("user_id")
        .eq("client_id", input.client_id);
      if (clientUsers?.length) {
        await supabase.from("notifications").insert(
          clientUsers.map((u) => ({
            user_id: u.user_id,
            client_id: input.client_id,
            channel: "in_app" as const,
            type: "creative",
            title: "Novo criativo aguardando aprovação",
            message: input.headline,
            link_url: "/cliente/criativos",
          })),
        );
      }
    }

    await auditLog({
      actorType: "claude",
      action: "ad.registered",
      resourceType: "ad",
      resourceId: data.id,
      clientId: input.client_id,
      afterData: data,
      metadata: { reasoning: input.reasoning },
    });

    return { success: true, ad: data };
  },
};

// ─── 5. record_performance_snapshot ──────────────────────────────────
export const recordPerformanceTool: AnyTool = {
  name: "record_performance_snapshot",
  description: `Registra métricas de performance que você (Claude) coletou via MCP oficial Meta.

Use depois de chamar Meta API insights pra trazer os dados pra plataforma BASE
e cliente ver no dashboard.

Args:
- client_id, campaign_id (opcional), ad_set_id (opcional), ad_id (opcional)
- period_start, period_end (ISO datetime)
- granularity: 'hour' | 'day' | 'week' | 'month'
- métricas: impressions, reach, clicks, spend, conversions, conversion_value, ctr, cpc, cpm, frequency`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    campaign_id: z.string().uuid().optional(),
    ad_set_id: z.string().uuid().optional(),
    ad_id: z.string().uuid().optional(),
    period_start: z.string().datetime(),
    period_end: z.string().datetime(),
    granularity: z.enum(["hour", "day", "week", "month"]).default("day"),
    impressions: z.number().int().nonnegative().default(0),
    reach: z.number().int().nonnegative().default(0),
    clicks: z.number().int().nonnegative().default(0),
    spend: z.number().nonnegative().default(0),
    conversions: z.number().int().nonnegative().default(0),
    conversion_value: z.number().nonnegative().default(0),
    ctr: z.number().nonnegative().optional(),
    cpc: z.number().nonnegative().optional(),
    cpm: z.number().nonnegative().optional(),
    cpa: z.number().nonnegative().optional(),
    roas: z.number().nonnegative().optional(),
    frequency: z.number().nonnegative().optional(),
    breakdown_dimension: z.string().optional(),
    breakdown_value: z.string().optional(),
    raw_data: z.record(z.unknown()).optional(),
  }),
  handler: async (input) => {
    await guardClientOperation(input.client_id, {
      rateLimitPerMinute: 120,
      checkDailyLimit: false,
    });

    if (input.campaign_id) {
      await assertResourceBelongsToClient("campaign", input.campaign_id, input.client_id);
    }
    if (input.ad_id) {
      await assertResourceBelongsToClient("ad", input.ad_id, input.client_id);
    }

    // calcula métricas derivadas se não vierem
    const ctr =
      input.ctr ?? (input.impressions > 0 ? (input.clicks / input.impressions) * 100 : 0);
    const cpc = input.cpc ?? (input.clicks > 0 ? input.spend / input.clicks : 0);
    const cpm =
      input.cpm ?? (input.impressions > 0 ? (input.spend / input.impressions) * 1000 : 0);
    const cpa = input.cpa ?? (input.conversions > 0 ? input.spend / input.conversions : 0);
    const roas = input.roas ?? (input.spend > 0 ? input.conversion_value / input.spend : 0);

    const { data, error } = await supabase
      .from("performance_snapshots")
      .insert({
        client_id: input.client_id,
        campaign_id: input.campaign_id ?? null,
        ad_set_id: input.ad_set_id ?? null,
        ad_id: input.ad_id ?? null,
        period_start: input.period_start,
        period_end: input.period_end,
        granularity: input.granularity,
        impressions: input.impressions,
        reach: input.reach,
        clicks: input.clicks,
        spend: input.spend,
        conversions: input.conversions,
        conversion_value: input.conversion_value,
        ctr,
        cpc,
        cpm,
        cpa,
        roas,
        frequency: input.frequency ?? null,
        breakdown_dimension: input.breakdown_dimension ?? null,
        breakdown_value: input.breakdown_value ?? null,
        raw_data: (input.raw_data as never) ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    return { success: true, snapshot_id: data.id };
  },
};

// ─── 6. update_campaign_status (sem chamar Meta) ─────────────────────
export const updateCampaignStatusTool: AnyTool = {
  name: "update_campaign_status",
  description: `Atualiza status de uma campanha NA PLATAFORMA BASE depois que você já mudou no Meta.

Use depois de pause/resume via MCP oficial Meta. Cliente vê o novo status na dashboard.

Status válidos: 'active' | 'paused' | 'completed' | 'archived'`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    campaign_id: z.string().uuid(),
    new_status: z.enum(["active", "paused", "completed", "archived"]),
    reason: z.string().min(5),
  }),
  handler: async ({ client_id, campaign_id, new_status, reason }) => {
    await guardClientOperation(client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("campaign", campaign_id, client_id);

    const { data: before } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();
    if (!before) throw new NotFoundError("campaign", campaign_id);

    const { error } = await supabase
      .from("campaigns")
      .update({ status: new_status })
      .eq("id", campaign_id);
    if (error) throw error;

    await auditLog({
      actorType: "claude",
      action: `campaign.${new_status}`,
      resourceType: "campaign",
      resourceId: campaign_id,
      clientId: client_id,
      beforeData: before,
      afterData: { ...before, status: new_status },
      metadata: { reason },
    });

    return { success: true };
  },
};

// ─── 7. update_ad_status ─────────────────────────────────────────────
export const updateAdStatusTool: AnyTool = {
  name: "update_ad_status",
  description: `Atualiza status de um anúncio NA PLATAFORMA BASE.

Use depois de pause/active no Meta. Cliente vê na galeria de criativos.`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    ad_id: z.string().uuid(),
    new_status: z.enum(["active", "paused", "approved", "rejected", "archived"]),
    reason: z.string().min(5),
  }),
  handler: async ({ client_id, ad_id, new_status, reason }) => {
    await guardClientOperation(client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("ad", ad_id, client_id);

    const { error } = await supabase.from("ads").update({ status: new_status }).eq("id", ad_id);
    if (error) throw error;

    await auditLog({
      actorType: "claude",
      action: `ad.${new_status}`,
      resourceType: "ad",
      resourceId: ad_id,
      clientId: client_id,
      metadata: { reason },
    });

    return { success: true };
  },
};

// ─── 8. send_message_to_client ───────────────────────────────────────
export const sendClientMessageTool: AnyTool = {
  name: "send_message_to_client",
  description: `Envia uma mensagem (chat) pro cliente final pela plataforma BASE.

Útil pra avisar cliente sobre nova campanha lançada, criativos pra aprovar,
ou explicar mudança na estratégia. Cliente vê em /cliente/.../mensagens em Realtime.`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    content: z.string().min(5).max(2000),
    sender_email: z.string().email().describe("Email do admin remetente (kendy@...)"),
  }),
  handler: async ({ client_id, content, sender_email }) => {
    await guardClientOperation(client_id, { rateLimitPerMinute: 30 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", sender_email)
      .single();
    if (!profile) throw new NotFoundError("profile", sender_email);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        client_id,
        sender_id: profile.id,
        sender_role: profile.role,
        content: sanitizeString(content, 2000),
      })
      .select()
      .single();
    if (error) throw error;

    return { success: true, message_id: data.id };
  },
};

// ─── 9. get_client_meta_account_uuid ─────────────────────────────────
export const getMetaAccountUuidTool: AnyTool = {
  name: "get_client_meta_account_uuid",
  description: `Retorna o UUID interno da plataforma pra uma conta Meta de um cliente.

Você precisa desse UUID pra chamar register_campaign. Use uma vez no início
e cacheia mentalmente durante a sessão.`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    meta_account_id: z.string().optional().describe("Se omitido, retorna a is_primary"),
  }),
  handler: async ({ client_id, meta_account_id }) => {
    await assertClientExists(client_id);
    let q = supabase.from("meta_accounts").select("*").eq("client_id", client_id);
    if (meta_account_id) q = q.eq("meta_account_id", meta_account_id);
    else q = q.eq("is_primary", true);
    const { data, error } = await q.maybeSingle();
    if (error || !data)
      throw new NotFoundError("meta_account", meta_account_id ?? client_id);
    return {
      uuid: data.id,
      meta_account_id: data.meta_account_id,
      meta_business_id: data.meta_business_id,
      name: data.meta_account_name,
    };
  },
};

export const registerTools = [
  linkMetaAccountTool,
  registerCampaignTool,
  registerAdSetTool,
  registerAdTool,
  recordPerformanceTool,
  updateCampaignStatusTool,
  updateAdStatusTool,
  sendClientMessageTool,
  getMetaAccountUuidTool,
];
