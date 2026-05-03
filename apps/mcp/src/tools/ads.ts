import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { metaApi } from "../lib/meta.js";
import { decryptToken } from "../lib/token.js";
import { auditLog } from "../lib/audit.js";
import { NotFoundError } from "../lib/errors.js";
import {
  assertResourceBelongsToClient,
  guardClientOperation,
  sanitizeString,
} from "../lib/guards.js";
import { META_CTA_TYPES } from "@base-trafego/shared/constants";
import type { AnyTool } from "./types.js";

export const listAdsTool: AnyTool = {
  name: "list_ads",
  description: "Lista anúncios (ads/creatives) de um cliente.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    status: z
      .enum(["pending_approval", "approved", "active", "paused", "rejected", "archived"])
      .optional(),
  }),
  handler: async ({ client_id, status }) => {
    let q = supabase
      .from("ads")
      .select(
        "id, name, status, headline, body, cta_type, image_url, thumbnail_url, approved_by_client, created_at",
      )
      .eq("client_id", client_id)
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return { ads: data ?? [] };
  },
};

export const createCreativeTool: AnyTool = {
  name: "create_creative",
  description:
    "Cria um novo criativo (ad) — texto + CTA + URL. Imagem/vídeo é opcional. Status inicia como pending_approval pra cliente aprovar.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    ad_set_id: z.string().uuid(),
    name: z.string().min(3).max(120),
    headline: z.string().min(3).max(40),
    body: z.string().min(10).max(125),
    cta_type: z.enum(META_CTA_TYPES).default("LEARN_MORE"),
    link_url: z.string().url(),
    image_url: z.string().url().optional(),
    video_url: z.string().url().optional(),
    reasoning: z.string().min(10),
  }),
  handler: async (input) => {
    // 🔒 Guards: cliente válido + ad_set pertence ao cliente declarado
    await guardClientOperation(input.client_id, { rateLimitPerMinute: 30 });
    await assertResourceBelongsToClient("ad_set", input.ad_set_id, input.client_id);

    // sanitização de copy
    input.headline = sanitizeString(input.headline, 40);
    input.body = sanitizeString(input.body, 125);

    const { data: client } = await supabase
      .from("clients")
      .select("auto_approve_creatives")
      .eq("id", input.client_id)
      .single();
    if (!client) throw new NotFoundError("client", input.client_id);

    const { data: adSet } = await supabase
      .from("ad_sets")
      .select("*, campaign:campaigns(*, meta_account:meta_accounts(*))")
      .eq("id", input.ad_set_id)
      .single();
    if (!adSet) throw new NotFoundError("ad_set", input.ad_set_id);

    let token = "";
    try {
      token = decryptToken(adSet.campaign.meta_account.access_token_encrypted);
    } catch {}

    const meta = await metaApi.createAd({
      accountId: adSet.campaign.meta_account.meta_account_id,
      accessToken: token,
      body: {
        name: input.name,
        adset_id: adSet.meta_ad_set_id,
        creative: {
          link_url: input.link_url,
          link_data: {
            message: input.body,
            link: input.link_url,
            name: input.headline,
            call_to_action: { type: input.cta_type, value: { link: input.link_url } },
            picture: input.image_url,
          },
        },
        status: client.auto_approve_creatives ? "ACTIVE" : "PAUSED",
      },
    });

    const { data, error } = await supabase
      .from("ads")
      .insert({
        client_id: input.client_id,
        ad_set_id: input.ad_set_id,
        meta_ad_id: meta.id,
        name: input.name,
        headline: input.headline,
        body: input.body,
        cta_type: input.cta_type,
        link_url: input.link_url,
        image_url: input.image_url ?? null,
        video_url: input.video_url ?? null,
        status: client.auto_approve_creatives ? "active" : "pending_approval",
        approved_by_client: !!client.auto_approve_creatives,
      })
      .select()
      .single();
    if (error) throw error;

    await auditLog({
      actorType: "claude",
      action: "ad.created",
      resourceType: "ad",
      resourceId: data.id,
      clientId: input.client_id,
      afterData: data,
      metadata: { reasoning: input.reasoning },
    });

    // Notifica cliente caso precise aprovar
    if (!client.auto_approve_creatives) {
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
            title: "Novo criativo aguardando sua aprovação",
            message: `${input.headline}`,
            link_url: `/cliente/criativos`,
          })),
        );
      }
    }

    return { success: true, ad: data, requires_client_approval: !client.auto_approve_creatives };
  },
};

export const duplicateCreativeTool: AnyTool = {
  name: "duplicate_creative",
  description:
    "Duplica um criativo aplicando modificações — útil pra A/B testing. SEMPRE passe client_id pra validação de ownership.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    source_ad_id: z.string().uuid(),
    modifications: z.object({
      name: z.string().optional(),
      headline: z.string().optional(),
      body: z.string().optional(),
      image_url: z.string().url().optional(),
    }),
    reasoning: z.string().min(10),
  }),
  handler: async ({ client_id, source_ad_id, modifications, reasoning }) => {
    // 🔒 Guards: ad pertence ao cliente declarado
    await guardClientOperation(client_id, { rateLimitPerMinute: 30 });
    await assertResourceBelongsToClient("ad", source_ad_id, client_id);

    const { data: source } = await supabase.from("ads").select("*").eq("id", source_ad_id).single();
    if (!source) throw new NotFoundError("ad", source_ad_id);

    const newInput = {
      client_id: source.client_id,
      ad_set_id: source.ad_set_id,
      name: modifications.name ?? `${source.name} (cópia)`,
      headline: modifications.headline ?? source.headline ?? "",
      body: modifications.body ?? source.body ?? "",
      cta_type: source.cta_type ?? "LEARN_MORE",
      link_url: source.link_url ?? "https://example.com",
      image_url: modifications.image_url ?? source.image_url ?? undefined,
      reasoning,
    };

    return await createCreativeTool.handler(newInput);
  },
};

export const pauseAdTool: AnyTool = {
  name: "pause_ad",
  description:
    "Pausa um anúncio específico — quando frequency >= 5, CTR baixo, ou ROAS ruim. SEMPRE passe client_id pra validação de ownership.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    ad_id: z.string().uuid(),
    reason: z.string().min(5),
  }),
  handler: async ({ client_id, ad_id, reason }) => {
    // 🔒 Guards
    await guardClientOperation(client_id, { rateLimitPerMinute: 60 });
    await assertResourceBelongsToClient("ad", ad_id, client_id);

    const { data: ad } = await supabase
      .from("ads")
      .select("*, ad_set:ad_sets(*, campaign:campaigns(*, meta_account:meta_accounts(*)))")
      .eq("id", ad_id)
      .single();
    if (!ad) throw new NotFoundError("ad", ad_id);

    let token = "";
    try {
      token = decryptToken(ad.ad_set.campaign.meta_account.access_token_encrypted);
    } catch {}
    await metaApi.pauseAd({ metaAdId: ad.meta_ad_id, accessToken: token });
    await supabase.from("ads").update({ status: "paused" }).eq("id", ad_id);

    await auditLog({
      actorType: "claude",
      action: "ad.paused",
      resourceType: "ad",
      resourceId: ad_id,
      clientId: ad.client_id,
      metadata: { reason },
    });
    return { success: true };
  },
};

export const getAdPreviewTool: AnyTool = {
  name: "get_ad_preview",
  description: "Retorna preview HTML de um ad rodando no Meta.",
  inputSchema: z.object({ ad_id: z.string().uuid() }),
  handler: async ({ ad_id }) => {
    const { data: ad } = await supabase
      .from("ads")
      .select("name, headline, body, cta_type, link_url, image_url")
      .eq("id", ad_id)
      .single();
    if (!ad) throw new NotFoundError("ad", ad_id);
    return { ad };
  },
};

export const uploadCreativeAssetTool: AnyTool = {
  name: "upload_creative_asset",
  description:
    "Registra um asset (imagem/vídeo) já existente no Storage — Claude não faz upload direto, mas referencia URLs.",
  inputSchema: z.object({
    client_id: z.string().uuid(),
    asset_type: z.enum(["image", "video", "carousel"]),
    url: z.string().url(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    alt_text: z.string().optional(),
    ai_prompt: z.string().optional(),
  }),
  handler: async (input) => {
    const { data, error } = await supabase
      .from("creatives_assets")
      .insert({
        client_id: input.client_id,
        asset_type: input.asset_type,
        url: input.url,
        width: input.width ?? null,
        height: input.height ?? null,
        alt_text: input.alt_text ?? null,
        ai_prompt: input.ai_prompt ?? null,
        generated_by_ai: !!input.ai_prompt,
      })
      .select()
      .single();
    if (error) throw error;
    return { success: true, asset: data };
  },
};

export const adsTools = [
  listAdsTool,
  createCreativeTool,
  duplicateCreativeTool,
  pauseAdTool,
  getAdPreviewTool,
  uploadCreativeAssetTool,
];
