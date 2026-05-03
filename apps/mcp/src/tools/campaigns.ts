/**
 * Campaign tools — modo LEDGER.
 *
 * Todas as tools aqui só leem/escrevem no Supabase. Nenhuma chama
 * graph.facebook.com. Quem chama Meta API é o MCP oficial Meta Ads
 * (Anthropic) — depois Claude usa register_campaign / update_campaign_status
 * (em tools/register.ts) pra refletir o estado no nosso DB.
 */
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { auditLog } from "../lib/audit.js";
import { NotFoundError } from "../lib/errors.js";
import {
  assertResourceBelongsToClient,
  guardClientOperation,
} from "../lib/guards.js";
import type { AnyTool } from "./types.js";
import { LIMITS } from "@base-trafego/shared/constants";

export const listCampaignsTool: AnyTool = {
  name: "list_campaigns",
  description: "Lista campanhas de um cliente com filtros por status. (Read-only DB)",
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
  description: "Detalhes completos de uma campanha + ad sets vinculados. (Read-only DB)",
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

export const updateCampaignTool: AnyTool = {
  name: "update_campaign",
  description: `Atualiza campos de metadata de uma campanha NO NOSSO DB
(nome, daily_budget refletido, end_date). NÃO chama Meta API — apenas
reflete uma alteração que você já fez via MCP oficial Meta Ads.

Mudanças de budget > ${LIMITS.maxBudgetChangePercent}% requerem aprovação
e ficam pendentes em /admin/approvals.

SEMPRE passe client_id pra validação de ownership.`,
  inputSchema: z.object({
    client_id: z.string().uuid().describe("UUID do cliente que possui a campanha"),
    campaign_id: z.string().uuid(),
    name: z.string().optional(),
    daily_budget: z.number().positive().optional(),
    end_date: z.string().datetime().nullable().optional(),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    await guardClientOperation(input.client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("campaign", input.campaign_id, input.client_id);

    const { data: before } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", input.campaign_id)
      .single();
    if (!before) throw new NotFoundError("campaign", input.campaign_id);

    if (input.daily_budget && before.daily_budget) {
      const change =
        Math.abs(input.daily_budget - before.daily_budget) / before.daily_budget;
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

export const archiveCampaignTool: AnyTool = {
  name: "archive_campaign",
  description: `Arquiva uma campanha NO NOSSO DB (status='archived'). Sempre
gera approval pendente — não arquiva direto. Use apenas após você já ter
arquivado/finalizado a campanha no Meta via MCP oficial.

SEMPRE passe client_id pra validação de ownership.`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    campaign_id: z.string().uuid(),
    reason: z.string().min(20),
  }),
  handler: async ({ client_id, campaign_id, reason }) => {
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
      message: "Arquivamento aguardando aprovação manual.",
    };
  },
};

export const campaignsTools = [
  listCampaignsTool,
  getCampaignTool,
  updateCampaignTool,
  archiveCampaignTool,
];
