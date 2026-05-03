import { env } from "../config/env.js";
import { logger } from "./logger.js";
import { MetaAPIError, RateLimitError } from "./errors.js";

const BASE_URL = `https://graph.facebook.com/${env.META_API_VERSION}`;

interface RequestOpts {
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
  query?: Record<string, string | number | undefined>;
  accessToken: string;
}

async function metaRequest<T>(path: string, opts: RequestOpts): Promise<T> {
  if (env.USE_META_MOCK === "true") {
    logger.warn("Meta API call em modo MOCK", { path });
    return mockMetaResponse(path, opts) as T;
  }

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("access_token", opts.accessToken);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v != null) url.searchParams.set(k, String(v));
  }

  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json" },
  };
  if (opts.body) init.body = JSON.stringify(opts.body);

  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const code = (json as { error?: { code?: number } })?.error?.code;
    if (code === 4 || code === 17 || code === 32) {
      throw new RateLimitError(60);
    }
    throw new MetaAPIError(
      (json as { error?: { message?: string } })?.error?.message ?? `Meta API ${res.status}`,
      code,
    );
  }
  return json as T;
}

// ─── Mocks (modo dev sem Meta App configurado) ──────────────────────
function mockMetaResponse(path: string, opts: RequestOpts): unknown {
  if (opts.method === "POST" && path.includes("/campaigns")) {
    return { id: `act_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
  }
  if (opts.method === "POST" && path.includes("/ads")) {
    return { id: `ad_mock_${Date.now()}` };
  }
  if (opts.method === "POST" && path.includes("/adsets")) {
    return { id: `adset_mock_${Date.now()}` };
  }
  if (path.includes("/insights")) {
    return {
      data: [
        {
          impressions: "12500",
          clicks: "342",
          spend: "458.32",
          conversions: "12",
          ctr: "2.74",
          cpc: "1.34",
          cpm: "36.67",
          frequency: "1.45",
          reach: "8620",
        },
      ],
    };
  }
  return { success: true, mocked: true };
}

// ─── Public API ──────────────────────────────────────────────────────
export const metaApi = {
  async createCampaign(args: {
    accountId: string;
    accessToken: string;
    name: string;
    objective: string;
    dailyBudget: number;
    status: "PAUSED" | "ACTIVE";
  }) {
    return metaRequest<{ id: string }>(`/act_${args.accountId}/campaigns`, {
      method: "POST",
      accessToken: args.accessToken,
      body: {
        name: args.name,
        objective: args.objective,
        special_ad_categories: [],
        daily_budget: args.dailyBudget,
        status: args.status,
      },
    });
  },

  async updateCampaign(args: {
    metaCampaignId: string;
    accessToken: string;
    updates: Record<string, unknown>;
  }) {
    return metaRequest<{ success: boolean }>(`/${args.metaCampaignId}`, {
      method: "POST",
      accessToken: args.accessToken,
      body: args.updates,
    });
  },

  async pauseCampaign(args: { metaCampaignId: string; accessToken: string }) {
    return metaRequest<{ success: boolean }>(`/${args.metaCampaignId}`, {
      method: "POST",
      accessToken: args.accessToken,
      body: { status: "PAUSED" },
    });
  },

  async resumeCampaign(args: { metaCampaignId: string; accessToken: string }) {
    return metaRequest<{ success: boolean }>(`/${args.metaCampaignId}`, {
      method: "POST",
      accessToken: args.accessToken,
      body: { status: "ACTIVE" },
    });
  },

  async getInsights(args: {
    metaObjectId: string;
    accessToken: string;
    datePreset?: string;
    fields?: string[];
  }) {
    return metaRequest<{ data: Array<Record<string, string>> }>(
      `/${args.metaObjectId}/insights`,
      {
        method: "GET",
        accessToken: args.accessToken,
        query: {
          date_preset: args.datePreset ?? "last_7d",
          fields: (
            args.fields ?? [
              "impressions",
              "reach",
              "clicks",
              "spend",
              "ctr",
              "cpc",
              "cpm",
              "frequency",
              "conversions",
              "action_values",
            ]
          ).join(","),
        },
      },
    );
  },

  async createAd(args: {
    accountId: string;
    accessToken: string;
    body: Record<string, unknown>;
  }) {
    return metaRequest<{ id: string }>(`/act_${args.accountId}/ads`, {
      method: "POST",
      accessToken: args.accessToken,
      body: args.body,
    });
  },

  async pauseAd(args: { metaAdId: string; accessToken: string }) {
    return metaRequest<{ success: boolean }>(`/${args.metaAdId}`, {
      method: "POST",
      accessToken: args.accessToken,
      body: { status: "PAUSED" },
    });
  },

  async createAdSet(args: {
    accountId: string;
    accessToken: string;
    body: Record<string, unknown>;
  }) {
    return metaRequest<{ id: string }>(`/act_${args.accountId}/adsets`, {
      method: "POST",
      accessToken: args.accessToken,
      body: args.body,
    });
  },
};
