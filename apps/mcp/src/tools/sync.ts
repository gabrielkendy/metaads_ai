// ════════════════════════════════════════════════════════════════════
// SYNC TOOLS — Bulk register + status check
//
// Filosofia: Claude Desktop usa MCP oficial Meta pra LER tudo (fonte
// da verdade). Depois usa essas tools pra REGISTRAR tudo de uma vez
// na plataforma BASE em chamadas eficientes (1 call vs N calls).
//
// Fluxo típico:
//   1. Claude: list_clients → 3 clientes
//   2. Pra cada cliente:
//      a. get_sync_status(client_id) → "última sync 6h atrás, faltam X ads"
//      b. (MCP Meta) get_campaigns + get_adsets + get_ads + get_insights
//      c. bulk_register_meta_data(client_id, payload completo)
//      d. log_sync_run(client_id, summary)
//   3. Cliente vê tudo atualizado em /cliente/<slug> em < 1s
// ════════════════════════════════════════════════════════════════════

import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { auditLog, logClaudeAction } from "../lib/audit.js";
import { guardClientOperation, sanitizeString } from "../lib/guards.js";
import { NotFoundError } from "../lib/errors.js";
import type { AnyTool } from "./types.js";

// ─── Schemas pra payload bulk ────────────────────────────────────────
const adMetricsSchema = z.object({
  impressions: z.number().nonnegative().default(0),
  reach: z.number().nonnegative().default(0),
  clicks: z.number().nonnegative().default(0),
  spend: z.number().nonnegative().default(0),
  conversions: z.number().nonnegative().default(0),
  conversion_value: z.number().nonnegative().default(0),
  ctr: z.number().nonnegative().optional(),
  cpc: z.number().nonnegative().optional(),
  cpm: z.number().nonnegative().optional(),
  cpa: z.number().nonnegative().optional(),
  roas: z.number().nonnegative().optional(),
  frequency: z.number().nonnegative().optional(),
});

const bulkAdSchema = z.object({
  meta_ad_id: z.string().min(1),
  meta_creative_id: z.string().optional(),
  name: z.string(),
  headline: z.string().optional(),
  body: z.string().optional(),
  cta_type: z.string().optional(),
  link_url: z.string().url().optional(),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  status: z.enum(["active", "paused", "approved", "rejected", "archived", "pending_approval"]).default("active"),
  metrics: adMetricsSchema.optional(),
});

const bulkAdSetSchema = z.object({
  meta_ad_set_id: z.string().min(1),
  name: z.string(),
  status: z.enum(["active", "paused"]).default("paused"),
  daily_budget: z.number().nonnegative().optional(),
  optimization_goal: z.string().optional(),
  billing_event: z.string().optional(),
  targeting: z.record(z.unknown()).optional(),
  metrics: adMetricsSchema.optional(),
  ads: z.array(bulkAdSchema).default([]),
});

const bulkCampaignSchema = z.object({
  meta_campaign_id: z.string().min(1),
  name: z.string(),
  objective: z.string(),
  status: z.enum(["active", "paused", "draft", "completed", "archived", "pending_approval"]).default("paused"),
  daily_budget: z.number().nonnegative().optional(),
  lifetime_budget: z.number().nonnegative().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  metrics: adMetricsSchema.optional(),
  ad_sets: z.array(bulkAdSetSchema).default([]),
});

// ─── 1. bulk_register_meta_data ──────────────────────────────────────
export const bulkRegisterMetaDataTool: AnyTool = {
  name: "bulk_register_meta_data",
  description: `Registra de UMA VEZ uma estrutura completa de campanhas+ad_sets+ads+métricas do Meta na plataforma BASE.

QUANDO USAR:
Depois que você (Claude) puxou TUDO do MCP oficial Meta pra um cliente,
em vez de chamar register_campaign + register_ad_set + register_ad N vezes,
chama essa tool 1 vez com o payload completo. MUITO mais eficiente.

ESTRUTURA do payload:
{
  client_id: UUID,
  meta_account_id: UUID interno (não o do Meta, use get_client_meta_account_uuid),
  campaigns: [
    {
      meta_campaign_id, name, objective, status, daily_budget,
      metrics: { impressions, clicks, spend, conversions, ... },
      ad_sets: [
        {
          meta_ad_set_id, name, status, targeting,
          metrics: { ... },
          ads: [
            {
              meta_ad_id, name, headline, body, cta_type, link_url, image_url,
              metrics: { ... }
            }
          ]
        }
      ]
    }
  ]
}

A tool faz upsert idempotente — pode rodar 2x sem duplicar.
Calcula métricas derivadas automaticamente (CTR, CPC, ROAS) se não vierem.
Snapshots de performance são gravados com period=hoje, granularity=day.

Retorna contagens: { campaigns_synced, ad_sets_synced, ads_synced, snapshots_created }`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
    meta_account_id: z.string().uuid(),
    campaigns: z.array(bulkCampaignSchema).min(1),
    sync_period_start: z.string().datetime().optional(),
    sync_period_end: z.string().datetime().optional(),
    reasoning: z.string().min(5).default("Bulk sync from Meta MCP"),
  }),
  handler: async (input) => {
    await guardClientOperation(input.client_id, {
      rateLimitPerMinute: 30,
      checkDailyLimit: false,
    });

    const periodStart = input.sync_period_start ?? new Date().toISOString().split("T")[0] + "T00:00:00Z";
    const periodEnd = input.sync_period_end ?? new Date().toISOString();

    let campaignsSync = 0;
    let adSetsSync = 0;
    let adsSync = 0;
    let snapshotsCreated = 0;
    const errors: Array<{ stage: string; meta_id: string; error: string }> = [];

    for (const camp of input.campaigns) {
      try {
        // Upsert campanha
        const { data: campRow, error: campErr } = await supabase
          .from("campaigns")
          .upsert(
            {
              client_id: input.client_id,
              meta_account_id: input.meta_account_id,
              meta_campaign_id: camp.meta_campaign_id,
              name: sanitizeString(camp.name, 120),
              objective: camp.objective,
              status: camp.status,
              daily_budget: camp.daily_budget ?? null,
              lifetime_budget: camp.lifetime_budget ?? null,
              start_date: camp.start_date ?? null,
              end_date: camp.end_date ?? null,
              created_by_claude: true,
              last_synced_at: new Date().toISOString(),
            },
            { onConflict: "meta_campaign_id" },
          )
          .select()
          .single();
        if (campErr) {
          errors.push({ stage: "campaign", meta_id: camp.meta_campaign_id, error: campErr.message });
          continue;
        }
        campaignsSync++;

        // Snapshot de performance da campanha
        if (camp.metrics) {
          await insertPerformanceSnapshot({
            client_id: input.client_id,
            campaign_id: campRow.id,
            ad_set_id: null,
            ad_id: null,
            period_start: periodStart,
            period_end: periodEnd,
            metrics: camp.metrics,
          });
          snapshotsCreated++;
        }

        // Ad sets
        for (const adSet of camp.ad_sets) {
          try {
            const { data: asRow, error: asErr } = await supabase
              .from("ad_sets")
              .upsert(
                {
                  campaign_id: campRow.id,
                  meta_ad_set_id: adSet.meta_ad_set_id,
                  name: sanitizeString(adSet.name, 120),
                  status: adSet.status,
                  daily_budget: adSet.daily_budget ?? null,
                  optimization_goal: adSet.optimization_goal ?? null,
                  billing_event: adSet.billing_event ?? null,
                  targeting: (adSet.targeting as never) ?? {},
                  last_synced_at: new Date().toISOString(),
                },
                { onConflict: "meta_ad_set_id" },
              )
              .select()
              .single();
            if (asErr) {
              errors.push({ stage: "ad_set", meta_id: adSet.meta_ad_set_id, error: asErr.message });
              continue;
            }
            adSetsSync++;

            if (adSet.metrics) {
              await insertPerformanceSnapshot({
                client_id: input.client_id,
                campaign_id: campRow.id,
                ad_set_id: asRow.id,
                ad_id: null,
                period_start: periodStart,
                period_end: periodEnd,
                metrics: adSet.metrics,
              });
              snapshotsCreated++;
            }

            // Ads
            for (const ad of adSet.ads) {
              try {
                const { data: adRow, error: adErr } = await supabase
                  .from("ads")
                  .upsert(
                    {
                      client_id: input.client_id,
                      ad_set_id: asRow.id,
                      meta_ad_id: ad.meta_ad_id,
                      meta_creative_id: ad.meta_creative_id ?? null,
                      name: sanitizeString(ad.name, 120),
                      headline: ad.headline ? sanitizeString(ad.headline, 40) : null,
                      body: ad.body ? sanitizeString(ad.body, 125) : null,
                      cta_type: ad.cta_type ?? null,
                      link_url: ad.link_url ?? null,
                      image_url: ad.image_url ?? null,
                      video_url: ad.video_url ?? null,
                      thumbnail_url: ad.image_url ?? null,
                      status: ad.status,
                      last_synced_at: new Date().toISOString(),
                    },
                    { onConflict: "meta_ad_id" },
                  )
                  .select()
                  .single();
                if (adErr) {
                  errors.push({ stage: "ad", meta_id: ad.meta_ad_id, error: adErr.message });
                  continue;
                }
                adsSync++;

                if (ad.metrics) {
                  await insertPerformanceSnapshot({
                    client_id: input.client_id,
                    campaign_id: campRow.id,
                    ad_set_id: asRow.id,
                    ad_id: adRow.id,
                    period_start: periodStart,
                    period_end: periodEnd,
                    metrics: ad.metrics,
                  });
                  snapshotsCreated++;
                }
              } catch (e) {
                errors.push({ stage: "ad", meta_id: ad.meta_ad_id, error: (e as Error).message });
              }
            }
          } catch (e) {
            errors.push({ stage: "ad_set", meta_id: adSet.meta_ad_set_id, error: (e as Error).message });
          }
        }
      } catch (e) {
        errors.push({ stage: "campaign", meta_id: camp.meta_campaign_id, error: (e as Error).message });
      }
    }

    // Audit + claude_action
    await logClaudeAction({
      clientId: input.client_id,
      actionType: "sync_meta_data",
      toolName: "bulk_register_meta_data",
      inputPayload: { campaigns_count: input.campaigns.length },
      outputPayload: { campaignsSync, adSetsSync, adsSync, snapshotsCreated, errors_count: errors.length },
      reasoning: input.reasoning,
      status: "success",
    });

    await auditLog({
      actorType: "claude",
      action: "bulk_sync.completed",
      resourceType: "client",
      resourceId: input.client_id,
      clientId: input.client_id,
      metadata: { campaignsSync, adSetsSync, adsSync, snapshotsCreated, errors_count: errors.length },
    });

    // Atualiza last_synced_at na meta_account
    await supabase
      .from("meta_accounts")
      .update({ last_synced_at: new Date().toISOString(), sync_error: null })
      .eq("id", input.meta_account_id);

    return {
      success: true,
      campaigns_synced: campaignsSync,
      ad_sets_synced: adSetsSync,
      ads_synced: adsSync,
      snapshots_created: snapshotsCreated,
      errors_count: errors.length,
      errors: errors.slice(0, 5),
      message: `Sync completo: ${campaignsSync} camps, ${adSetsSync} ad sets, ${adsSync} ads, ${snapshotsCreated} snapshots.`,
    };
  },
};

// ─── 2. get_sync_status ──────────────────────────────────────────────
export const getSyncStatusTool: AnyTool = {
  name: "get_sync_status",
  description: `Diz pra Claude QUANDO foi o último sync e O QUE precisa atualizar.

Use no INÍCIO de qualquer fluxo de sync. Retorna:
- last_synced_at: timestamp ISO (ou null se nunca sincronizou)
- minutes_since_last_sync
- campaigns_count: quantas campanhas estão registradas hoje
- needs_full_sync: true se > 6h sem sync
- needs_metrics_refresh: true se métricas > 1h desatualizadas
- meta_account_uuid: UUID interno pra usar em bulk_register

Use isso pra decidir: "vale a pena puxar do Meta agora?"`,
  inputSchema: z.object({
    client_id: z.string().uuid(),
  }),
  handler: async ({ client_id }) => {
    await guardClientOperation(client_id, { rateLimitPerMinute: 120, checkDailyLimit: false });

    const { data: metaAccount } = await supabase
      .from("meta_accounts")
      .select("id, meta_account_id, meta_account_name, last_synced_at, sync_error, current_balance")
      .eq("client_id", client_id)
      .eq("is_primary", true)
      .eq("is_active", true)
      .maybeSingle();

    if (!metaAccount) {
      return {
        has_meta_account: false,
        message: "Cliente não tem conta Meta vinculada. Use link_meta_account primeiro.",
      };
    }

    const lastSync = metaAccount.last_synced_at ? new Date(metaAccount.last_synced_at) : null;
    const now = new Date();
    const minutesAgo = lastSync ? Math.round((now.getTime() - lastSync.getTime()) / 60000) : null;

    // Conta campanhas registradas
    const { count: campaignsCount } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client_id);

    const { count: adsCount } = await supabase
      .from("ads")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client_id);

    // Última snapshot
    const { data: lastSnapshot } = await supabase
      .from("performance_snapshots")
      .select("period_end")
      .eq("client_id", client_id)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastMetric = lastSnapshot?.period_end ? new Date(lastSnapshot.period_end) : null;
    const metricsAgeMinutes = lastMetric
      ? Math.round((now.getTime() - lastMetric.getTime()) / 60000)
      : null;

    return {
      has_meta_account: true,
      meta_account_uuid: metaAccount.id,
      meta_account_id: metaAccount.meta_account_id,
      meta_account_name: metaAccount.meta_account_name,
      current_balance: metaAccount.current_balance,
      sync_error: metaAccount.sync_error,
      last_synced_at: metaAccount.last_synced_at,
      minutes_since_last_sync: minutesAgo,
      campaigns_registered: campaignsCount ?? 0,
      ads_registered: adsCount ?? 0,
      last_metrics_at: lastSnapshot?.period_end ?? null,
      metrics_age_minutes: metricsAgeMinutes,
      needs_full_sync: minutesAgo === null || minutesAgo > 6 * 60,
      needs_metrics_refresh: metricsAgeMinutes === null || metricsAgeMinutes > 60,
    };
  },
};

// ─── 3. log_sync_run ─────────────────────────────────────────────────
export const logSyncRunTool: AnyTool = {
  name: "log_sync_run",
  description: `Registra que você (Claude) executou um sync run com sucesso ou falha.

Use APÓS qualquer ciclo de sync (manual ou via Cowork) pra deixar rastro
em audit_logs e claude_actions. Útil pra Kendy ver "quem sincronizou
quando" no dashboard.`,
  inputSchema: z.object({
    client_id: z.string().uuid().optional(),
    scope: z.enum(["single_client", "all_clients", "campaign", "anomaly_check"]),
    status: z.enum(["success", "partial", "failed"]),
    summary: z.string().min(5).max(500),
    stats: z.record(z.union([z.number(), z.string()])).optional(),
    triggered_by: z.enum(["manual", "cowork", "scheduled", "webhook"]).default("manual"),
  }),
  handler: async (input) => {
    await logClaudeAction({
      clientId: input.client_id ?? null,
      actionType: "sync_meta_data",
      toolName: "log_sync_run",
      inputPayload: { scope: input.scope, triggered_by: input.triggered_by },
      outputPayload: { stats: input.stats ?? {} },
      reasoning: sanitizeString(input.summary, 500),
      status: input.status === "success" ? "success" : input.status === "partial" ? "success" : "failed",
    });

    await auditLog({
      actorType: "claude",
      action: `sync.${input.status}`,
      resourceType: "sync_run",
      clientId: input.client_id,
      metadata: {
        scope: input.scope,
        summary: input.summary,
        stats: input.stats,
        triggered_by: input.triggered_by,
      },
    });

    return { success: true, message: "Sync run registrado." };
  },
};

// ─── 4. list_clients_needing_sync ────────────────────────────────────
export const listClientsNeedingSyncTool: AnyTool = {
  name: "list_clients_needing_sync",
  description: `Lista clientes ativos cujo sync está desatualizado (> threshold horas).

Use no INÍCIO de uma rotina de sync mass. Retorna apenas o que precisa
de update — assim você não desperdiça calls do Meta API em clientes
recém-sincronizados.

Args:
  threshold_hours: idade máxima do último sync. Default 6h.
  include_never_synced: incluir clientes que nunca sincronizaram. Default true.`,
  inputSchema: z.object({
    threshold_hours: z.number().positive().default(6),
    include_never_synced: z.boolean().default(true),
  }),
  handler: async ({ threshold_hours, include_never_synced }) => {
    const cutoff = new Date(Date.now() - threshold_hours * 3600_000).toISOString();

    const { data: accounts } = await supabase
      .from("meta_accounts")
      .select("id, client_id, meta_account_id, meta_account_name, last_synced_at, client:clients(id, name, slug, status)")
      .eq("is_active", true)
      .eq("is_primary", true);

    if (!accounts) return { needs_sync: [] };

    const needSync = accounts
      .filter((a) => {
        const client = Array.isArray(a.client) ? a.client[0] : a.client;
        if (!client || (client as { status: string }).status !== "active") return false;
        if (!a.last_synced_at) return include_never_synced;
        return new Date(a.last_synced_at) < new Date(cutoff);
      })
      .map((a) => {
        const client = Array.isArray(a.client) ? a.client[0] : a.client;
        return {
          client_id: (client as { id: string }).id,
          client_slug: (client as { slug: string }).slug,
          client_name: (client as { name: string }).name,
          meta_account_uuid: a.id,
          meta_account_id: a.meta_account_id,
          meta_account_name: a.meta_account_name,
          last_synced_at: a.last_synced_at,
          minutes_overdue:
            a.last_synced_at != null
              ? Math.round((Date.now() - new Date(a.last_synced_at).getTime()) / 60000)
              : null,
        };
      });

    return {
      needs_sync: needSync,
      total: needSync.length,
      threshold_hours,
    };
  },
};

// ─── Helper: insert performance snapshot com métricas derivadas ──────
async function insertPerformanceSnapshot(args: {
  client_id: string;
  campaign_id: string | null;
  ad_set_id: string | null;
  ad_id: string | null;
  period_start: string;
  period_end: string;
  metrics: z.infer<typeof adMetricsSchema>;
}) {
  const m = args.metrics;
  const ctr = m.ctr ?? (m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0);
  const cpc = m.cpc ?? (m.clicks > 0 ? m.spend / m.clicks : 0);
  const cpm = m.cpm ?? (m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0);
  const cpa = m.cpa ?? (m.conversions > 0 ? m.spend / m.conversions : 0);
  const roas = m.roas ?? (m.spend > 0 ? m.conversion_value / m.spend : 0);

  await supabase.from("performance_snapshots").insert({
    client_id: args.client_id,
    campaign_id: args.campaign_id,
    ad_set_id: args.ad_set_id,
    ad_id: args.ad_id,
    period_start: args.period_start,
    period_end: args.period_end,
    granularity: "day",
    impressions: m.impressions,
    reach: m.reach,
    clicks: m.clicks,
    spend: m.spend,
    conversions: m.conversions,
    conversion_value: m.conversion_value,
    ctr,
    cpc,
    cpm,
    cpa,
    roas,
    frequency: m.frequency ?? null,
  });
}

export const syncTools = [
  bulkRegisterMetaDataTool,
  getSyncStatusTool,
  logSyncRunTool,
  listClientsNeedingSyncTool,
];
