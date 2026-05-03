import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { metaApi } from "../lib/meta.js";
import { decryptToken } from "../lib/token.js";
import { auditLog, logClaudeAction, updateClaudeAction } from "../lib/audit.js";
import { NotFoundError } from "../lib/errors.js";
import {
  assertClientExists,
  assertResourceBelongsToClient,
  guardClientOperation,
  sanitizeString,
} from "../lib/guards.js";
import type { AnyTool } from "./types.js";
import { META_CAMPAIGN_OBJECTIVES, LIMITS } from "@base-trafego/shared/constants";

export const listCampaignsTool: AnyTool = {
  name: "list_campaigns",
  description: "Lista campanhas de um cliente com filtros por status.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    status: z
      .enum(["draft", "pending_approval", "active", "paused", "completed", "archived"])
      .optional(),
    limit: z.number().int().positive().max(200).default(50),
  }),
  handler: async ({ client_id, status, limit }) => {
    let q = supabase
      .from("campaigns")
      .select("id, name, objective, status, daily_budget, total_spent, created_at")
      .eq("client_id", client_id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return { campaigns: data ?? [] };
  },
};

export const getCampaignTool: AnyTool = {
  name: "get_campaign",
  description: "Detalhes de uma campanha.",
  inputSchema: z.object({ campaign_id: z.string().uuid() }),
  handler: async ({ campaign_id }) => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, ad_sets(id, name, status)")
      .eq("id", campaign_id)
      .single();
    if (error || !data) throw new NotFoundError("campaign", campaign_id);
    return data;
  },
};

export const createCampaignTool: AnyTool = {
  name: "create_campaign",
  description: `Cria nova campanha de tráfego pago no Meta Ads pra um cliente.

REGRAS DE OURO:
- Sempre VERIFIQUE saldo via check_meta_balance antes
- Para budget mensal > limite do cliente, vira aprovação automaticamente
- A campanha SEMPRE é criada PAUSED — só ativa após criar criativos + aprovação
- INCLUA reasoning detalhado pra audit log

Retorna: { campaign_id, requires_approval, status }`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    name: z.string().min(3).max(120),
    objective: z.enum(META_CAMPAIGN_OBJECTIVES),
    daily_budget: z.number().positive().describe("BRL/dia (será convertido pra centavos)"),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    targeting: z.record(z.unknown()).optional(),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    // 🔒 Guard: valida cliente, rate limit, daily quota
    await guardClientOperation(input.client_id, {
      rateLimitPerMinute: 30,
      checkDailyLimit: true,
    });

    const action = await logClaudeAction({
      clientId: input.client_id,
      actionType: "create_campaign",
      toolName: "create_campaign",
      inputPayload: input,
      reasoning: sanitizeString(input.reasoning, 1000),
      status: "in_progress",
    });

    try {
      const { data: client } = await supabase
        .from("clients")
        .select("*, agent_configs(*)")
        .eq("id", input.client_id)
        .single();
      if (!client) throw new NotFoundError("client", input.client_id);

      const { data: account } = await supabase
        .from("meta_accounts")
        .select("*")
        .eq("client_id", input.client_id)
        .eq("is_primary", true)
        .eq("is_active", true)
        .single();
      if (!account) throw new Error("Cliente sem conta Meta primária ativa");

      const monthlyBudget = input.daily_budget * 30;
      const approvalThreshold =
        client.requires_approval_above ?? LIMITS.approvalRequiredAboveBRL;
      const requiresApproval = monthlyBudget > approvalThreshold;

      if (requiresApproval) {
        const { data: approval } = await supabase
          .from("approvals")
          .insert({
            client_id: input.client_id,
            type: "create_campaign",
            title: `Criar campanha "${input.name}"`,
            description: `Budget mensal estimado: R$ ${monthlyBudget.toFixed(2)}`,
            payload: input as never,
            estimated_impact: { monthly_budget: monthlyBudget, objective: input.objective },
            claude_reasoning: input.reasoning,
            claude_action_id: action?.id ?? null,
            expires_at: new Date(
              Date.now() + LIMITS.approvalExpirationHours * 60 * 60 * 1000,
            ).toISOString(),
          })
          .select()
          .single();

        if (action?.id)
          await updateClaudeAction(action.id, { status: "pending" });

        return {
          success: true,
          requires_approval: true,
          approval_id: approval?.id,
          message: `Campanha pendente de aprovação. Kendy precisa aprovar via /admin/approvals.`,
        };
      }

      // Cria via Meta API (ou mock)
      let token = "";
      try {
        token = decryptToken(account.access_token_encrypted);
      } catch {
        // mock mode
      }
      const meta = await metaApi.createCampaign({
        accountId: account.meta_account_id,
        accessToken: token,
        name: input.name,
        objective: input.objective,
        dailyBudget: Math.round(input.daily_budget * 100),
        status: "PAUSED",
      });

      const { data: campaign, error } = await supabase
        .from("campaigns")
        .insert({
          client_id: input.client_id,
          meta_account_id: account.id,
          meta_campaign_id: meta.id,
          name: input.name,
          objective: input.objective,
          daily_budget: input.daily_budget,
          targeting: (input.targeting as never) ?? {},
          start_date: input.start_date ?? null,
          end_date: input.end_date ?? null,
          status: "paused",
          created_by_claude: true,
        })
        .select()
        .single();
      if (error) throw error;

      if (action?.id)
        await updateClaudeAction(action.id, {
          status: "success",
          output_payload: { campaign_id: campaign.id, meta_campaign_id: meta.id } as never,
          completed_at: new Date().toISOString(),
        });

      await auditLog({
        actorType: "claude",
        action: "campaign.created",
        resourceType: "campaign",
        resourceId: campaign.id,
        clientId: input.client_id,
        afterData: campaign,
        metadata: { reasoning: input.reasoning },
      });

      return {
        success: true,
        requires_approval: false,
        campaign_id: campaign.id,
        meta_campaign_id: meta.id,
        status: "paused",
        message:
          "Campanha criada PAUSED. Após criar criativos, ative manualmente ou use resume_campaign.",
      };
    } catch (e) {
      if (action?.id) {
        await updateClaudeAction(action.id, {
          status: "failed",
          error_message: (e as Error).message,
          completed_at: new Date().toISOString(),
        });
      }
      throw e;
    }
  },
};

export const updateCampaignTool: AnyTool = {
  name: "update_campaign",
  description:
    "Atualiza campos de uma campanha (nome, budget, fim). Mudanças de budget > 20% requerem aprovação. SEMPRE passe client_id pra validação de ownership.",
  inputSchema: z.object({
    client_id: z.string().uuid().describe("UUID do cliente que possui a campanha"),
    campaign_id: z.string().uuid(),
    name: z.string().optional(),
    daily_budget: z.number().positive().optional(),
    end_date: z.string().datetime().nullable().optional(),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    // 🔒 Guards: cliente válido + campanha pertence ao cliente declarado
    await guardClientOperation(input.client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("campaign", input.campaign_id, input.client_id);

    const { data: before } = await supabase
      .from("campaigns")
      .select("*, meta_account:meta_accounts(*)")
      .eq("id", input.campaign_id)
      .single();
    if (!before) throw new NotFoundError("campaign", input.campaign_id);

    if (input.daily_budget && before.daily_budget) {
      const change = Math.abs(input.daily_budget - before.daily_budget) / before.daily_budget;
      if (change > LIMITS.maxBudgetChangePercent / 100) {
        const { data: approval } = await supabase
          .from("approvals")
          .insert({
            client_id: before.client_id,
            type: "budget_change",
            title: `Ajustar budget ${before.name}`,
            description: `De R$ ${before.daily_budget} pra R$ ${input.daily_budget} (${(change * 100).toFixed(1)}% diff)`,
            payload: input as never,
            claude_reasoning: input.reasoning,
            estimated_impact: { delta_pct: change * 100 },
          })
          .select()
          .single();
        return {
          success: true,
          requires_approval: true,
          approval_id: approval?.id,
        };
      }
    }

    const updates: Record<string, unknown> = {};
    if (input.name) updates.name = input.name;
    if (input.daily_budget !== undefined) updates.daily_budget = input.daily_budget;
    if (input.end_date !== undefined) updates.end_date = input.end_date;

    const { data, error } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", input.campaign_id)
      .select()
      .single();
    if (error) throw error;

    await auditLog({
      actorType: "claude",
      action: "campaign.updated",
      resourceType: "campaign",
      resourceId: input.campaign_id,
      clientId: before.client_id,
      beforeData: before,
      afterData: data,
      metadata: { reasoning: input.reasoning },
    });

    return { success: true, campaign: data };
  },
};

export const pauseCampaignTool: AnyTool = {
  name: "pause_campaign",
  description:
    "Pausa uma campanha. SEMPRE passe client_id pra validação de ownership.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    campaign_id: z.string().uuid(),
    reason: z.string().min(5),
  }),
  handler: async ({ client_id, campaign_id, reason }) => {
    // 🔒 Guards
    await guardClientOperation(client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("campaign", campaign_id, client_id);

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*, meta_account:meta_accounts(*)")
      .eq("id", campaign_id)
      .single();
    if (!campaign) throw new NotFoundError("campaign", campaign_id);

    let token = "";
    try {
      token = decryptToken(campaign.meta_account.access_token_encrypted);
    } catch {
      // mock
    }
    await metaApi.pauseCampaign({
      metaCampaignId: campaign.meta_campaign_id,
      accessToken: token,
    });

    await supabase.from("campaigns").update({ status: "paused" }).eq("id", campaign_id);

    await auditLog({
      actorType: "claude",
      action: "campaign.paused",
      resourceType: "campaign",
      resourceId: campaign_id,
      clientId: campaign.client_id,
      metadata: { reason },
    });
    return { success: true, message: `Campanha "${campaign.name}" pausada.` };
  },
};

export const resumeCampaignTool: AnyTool = {
  name: "resume_campaign",
  description:
    "Reativa uma campanha previamente pausada. SEMPRE passe client_id pra validação de ownership.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    campaign_id: z.string().uuid(),
    reason: z.string().min(5),
  }),
  handler: async ({ client_id, campaign_id, reason }) => {
    // 🔒 Guards
    await guardClientOperation(client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("campaign", campaign_id, client_id);

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*, meta_account:meta_accounts(*)")
      .eq("id", campaign_id)
      .single();
    if (!campaign) throw new NotFoundError("campaign", campaign_id);

    let token = "";
    try {
      token = decryptToken(campaign.meta_account.access_token_encrypted);
    } catch {}
    await metaApi.resumeCampaign({
      metaCampaignId: campaign.meta_campaign_id,
      accessToken: token,
    });
    await supabase.from("campaigns").update({ status: "active" }).eq("id", campaign_id);

    await auditLog({
      actorType: "claude",
      action: "campaign.resumed",
      resourceType: "campaign",
      resourceId: campaign_id,
      clientId: campaign.client_id,
      metadata: { reason },
    });
    return { success: true };
  },
};

export const deleteCampaignTool: AnyTool = {
  name: "delete_campaign",
  description:
    "ARQUIVA uma campanha. Sempre requer aprovação — Claude nunca deleta direto. Use só quando absolutamente certo. SEMPRE passe client_id pra validação de ownership.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    campaign_id: z.string().uuid(),
    reason: z.string().min(20),
  }),
  handler: async ({ client_id, campaign_id, reason }) => {
    // 🔒 Guards
    await guardClientOperation(client_id, { rateLimitPerMinute: 10 });
    await assertResourceBelongsToClient("campaign", campaign_id, client_id);

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("client_id, name")
      .eq("id", campaign_id)
      .single();
    if (!campaign) throw new NotFoundError("campaign", campaign_id);

    const { data: approval } = await supabase
      .from("approvals")
      .insert({
        client_id: campaign.client_id,
        type: "account_action",
        title: `Arquivar campanha "${campaign.name}"`,
        description: reason,
        payload: { campaign_id },
        claude_reasoning: reason,
      })
      .select()
      .single();

    return {
      success: true,
      requires_approval: true,
      approval_id: approval?.id,
      message: "Arquivamento aguardando aprovação manual de Kendy.",
    };
  },
};

export const campaignsTools = [
  listCampaignsTool,
  getCampaignTool,
  createCampaignTool,
  updateCampaignTool,
  pauseCampaignTool,
  resumeCampaignTool,
  deleteCampaignTool,
];
