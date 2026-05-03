/**
 * Ads (creatives) tools — modo LEDGER. Read-only DB.
 *
 * Criação de criativos é feita via MCP oficial Meta. Pra refletir no
 * nosso DB, use register_ad (em tools/register.ts) que aceita o
 * meta_ad_id já existente no Meta.
 */
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { NotFoundError } from "../lib/errors.js";
import type { AnyTool } from "./types.js";

export const listAdsTool: AnyTool = {
  name: "list_ads",
  description: "Lista anúncios (ads/creatives) de um cliente. (Read-only DB)",
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

export const getAdPreviewTool: AnyTool = {
  name: "get_ad_preview",
  description:
    "Retorna metadata de um ad pra preview: copy, CTA, link, image. (Read-only DB)",
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
    "Registra um asset (imagem/vídeo) já existente em URL externa — Claude não faz upload binário, mas referencia URLs. Útil pra catalogar criativos.",
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

export const adsTools = [listAdsTool, getAdPreviewTool, uploadCreativeAssetTool];
