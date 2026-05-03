import { supabase } from "../lib/supabase.js";

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  read: (uri: string) => Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }>;
}

const json = (obj: unknown) => JSON.stringify(obj, null, 2);

export const clientsResource: ResourceDefinition = {
  uri: "base://clients",
  name: "Lista de Clientes Ativos",
  description: "Todos os clientes ativos da Agência BASE com plano e contas Meta.",
  mimeType: "application/json",
  read: async (uri) => {
    const { data } = await supabase
      .from("clients")
      .select(
        "id, slug, name, status, plan, industry, monthly_budget_limit, meta_accounts(meta_account_id, current_balance, currency)",
      )
      .eq("status", "active")
      .order("name");
    return {
      contents: [
        { uri, mimeType: "application/json", text: json(data ?? []) },
      ],
    };
  },
};

export const alertsActiveResource: ResourceDefinition = {
  uri: "base://alerts/active",
  name: "Alertas Ativos",
  description: "Lista de todos os alertas ativos em todos os clientes.",
  mimeType: "application/json",
  read: async (uri) => {
    const { data } = await supabase
      .from("alerts")
      .select("id, type, severity, title, message, client:clients(name, slug), created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    return {
      contents: [{ uri, mimeType: "application/json", text: json(data ?? []) }],
    };
  },
};

export const approvalsPendingResource: ResourceDefinition = {
  uri: "base://approvals/pending",
  name: "Aprovações Pendentes",
  description: "Aprovações aguardando decisão de admin.",
  mimeType: "application/json",
  read: async (uri) => {
    const { data } = await supabase
      .from("approvals")
      .select("id, type, title, claude_reasoning, estimated_impact, expires_at, client:clients(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    return {
      contents: [{ uri, mimeType: "application/json", text: json(data ?? []) }],
    };
  },
};

// Templates resource
export const creativeTemplatesResource: ResourceDefinition = {
  uri: "base://templates/creatives",
  name: "Templates de Criativos",
  description: "Estruturas e padrões de criativos validados pela agência.",
  mimeType: "application/json",
  read: async (uri) => {
    const templates = [
      {
        id: "tpl_conv_1",
        name: "Conversão · Curto direto",
        objective: "OUTCOME_SALES",
        headline: "{benefit_in_3_words}",
        body: "{problem_statement}? {solution} em até {timeframe}. Aproveite {offer}.",
        cta: "SHOP_NOW",
      },
      {
        id: "tpl_lead_1",
        name: "Lead · Curiosity gap",
        objective: "OUTCOME_LEADS",
        headline: "{intriguing_question}",
        body: "Descubra {benefit} sem {common_obstacle}. {social_proof}.",
        cta: "SIGN_UP",
      },
      {
        id: "tpl_brand_1",
        name: "Branding · Storytelling",
        objective: "OUTCOME_AWARENESS",
        headline: "{brand_promise}",
        body: "{founding_story_short} — feito por quem vive isso há {years} anos.",
        cta: "LEARN_MORE",
      },
    ];
    return {
      contents: [{ uri, mimeType: "application/json", text: json(templates) }],
    };
  },
};

export const allResources: ResourceDefinition[] = [
  clientsResource,
  alertsActiveResource,
  approvalsPendingResource,
  creativeTemplatesResource,
];

// Resources dinâmicos por client_id
export async function readDynamicResource(uri: string) {
  const cleanUri = uri.replace(/^base:\/\//, "");

  // base://client/{id}
  const clientMatch = cleanUri.match(/^client\/([^/]+)$/);
  if (clientMatch) {
    const id = clientMatch[1];
    const { data } = await supabase
      .from("clients")
      .select("*, meta_accounts(*), agent_configs(*)")
      .eq("id", id)
      .single();
    return {
      contents: [{ uri, mimeType: "application/json", text: json(data) }],
    };
  }

  // base://client/{id}/campaigns
  const campMatch = cleanUri.match(/^client\/([^/]+)\/campaigns$/);
  if (campMatch) {
    const id = campMatch[1];
    const { data } = await supabase
      .from("campaigns")
      .select("id, name, objective, status, daily_budget, total_spent")
      .eq("client_id", id);
    return {
      contents: [{ uri, mimeType: "application/json", text: json(data ?? []) }],
    };
  }

  // base://client/{id}/performance/last-7-days
  const perfMatch = cleanUri.match(/^client\/([^/]+)\/performance\/last-(\d+)-days$/);
  if (perfMatch) {
    const id = perfMatch[1];
    const days = Number(perfMatch[2]);
    const { data } = await supabase.rpc("client_performance_summary", {
      p_client_id: id,
      p_start: new Date(Date.now() - days * 86400_000).toISOString(),
      p_end: new Date().toISOString(),
    });
    return {
      contents: [{ uri, mimeType: "application/json", text: json(data?.[0] ?? null) }],
    };
  }

  // base://config/agent/{client_id}
  const cfgMatch = cleanUri.match(/^config\/agent\/([^/]+)$/);
  if (cfgMatch) {
    const id = cfgMatch[1];
    const { data } = await supabase
      .from("agent_configs")
      .select("*")
      .eq("client_id", id)
      .single();
    return {
      contents: [{ uri, mimeType: "application/json", text: json(data) }],
    };
  }

  return null;
}
