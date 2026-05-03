// ════════════════════════════════════════════════════════════════════
// BASE TRÁFEGO COMMAND — Constantes globais
// ════════════════════════════════════════════════════════════════════

export const APP_NAME = "BASE Tráfego Command";
export const APP_DESCRIPTION =
  "Mini-SaaS multi-tenant de gestão de Meta Ads operado por Claude Desktop via MCP";
export const APP_VERSION = "1.0.0";
export const SUPPORT_EMAIL = "suporte@agenciabase.tech";
export const COMPANY_NAME = "Agência BASE";

// ─── Pricing ─────────────────────────────────────────────────────────
export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 1500,
    currency: "BRL",
    interval: "monthly",
    description: "Ideal pra primeira automação de tráfego",
    metaAccounts: 1,
    monthlyAdSpendCap: 5000,
    features: [
      "1 conta Meta Business",
      "Até R$ 5.000/mês de ad spend",
      "Dashboard básico",
      "Relatório mensal",
      "Suporte por email",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 3500,
    currency: "BRL",
    interval: "monthly",
    description: "Pra agências e PMEs querendo escalar",
    metaAccounts: 3,
    monthlyAdSpendCap: 20000,
    popular: true,
    features: [
      "Até 3 contas Meta",
      "Até R$ 20.000/mês de ad spend",
      "Dashboard completo + alertas",
      "Relatórios semanais",
      "Aprovação de criativos",
      "Curso BASE de tráfego incluso",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 8000,
    currency: "BRL",
    interval: "monthly",
    description: "White-label completo + estratégia",
    metaAccounts: -1,
    monthlyAdSpendCap: -1,
    features: [
      "Contas Meta ilimitadas",
      "Ad spend ilimitado",
      "Dashboard 100% white-label",
      "Chamadas estratégicas mensais",
      "Onboarding white-glove",
      "Suporte prioritário",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

// ─── Limites Operacionais (MCP/Claude) ───────────────────────────────
export const LIMITS = {
  maxDailyActionsPerClient: 50,
  maxBudgetChangePercent: 20,
  approvalRequiredAboveBRL: 1000,
  maxConcurrentTools: 5,
  toolTimeoutMs: 30_000,
  metaApiRateLimitPerMinute: 100,
  fatigueFrequencyThreshold: 5,
  ctrDropThreshold: 0.4,
  cpmIncreaseThreshold: 0.5,
  budgetExhaustedThreshold: 0.8,
  approvalExpirationHours: 24,
  notificationRetentionDays: 30,
  auditRetentionDays: 730,
} as const;

// ─── Meta Ads ────────────────────────────────────────────────────────
export const META_CAMPAIGN_OBJECTIVES = [
  "OUTCOME_AWARENESS",
  "OUTCOME_TRAFFIC",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_LEADS",
  "OUTCOME_APP_PROMOTION",
  "OUTCOME_SALES",
] as const;

export const META_OPTIMIZATION_GOALS = [
  "REACH",
  "IMPRESSIONS",
  "LINK_CLICKS",
  "PAGE_LIKES",
  "POST_ENGAGEMENT",
  "VIDEO_VIEWS",
  "OFFSITE_CONVERSIONS",
  "LANDING_PAGE_VIEWS",
  "LEAD_GENERATION",
  "VALUE",
] as const;

export const META_CTA_TYPES = [
  "LEARN_MORE",
  "SHOP_NOW",
  "SIGN_UP",
  "DOWNLOAD",
  "BOOK_TRAVEL",
  "CONTACT_US",
  "GET_QUOTE",
  "APPLY_NOW",
  "GET_OFFER",
  "SEND_MESSAGE",
  "SUBSCRIBE",
] as const;

export const META_BILLING_EVENTS = [
  "IMPRESSIONS",
  "LINK_CLICKS",
  "POST_ENGAGEMENT",
  "VIDEO_VIEWS",
  "THRUPLAY",
] as const;

// ─── User Roles ──────────────────────────────────────────────────────
export const USER_ROLES = ["super_admin", "admin", "client_admin", "client_viewer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ROLES: UserRole[] = ["super_admin", "admin"];
export const CLIENT_ROLES: UserRole[] = ["client_admin", "client_viewer"];

// ─── Routes ──────────────────────────────────────────────────────────
export const ROUTES = {
  marketing: {
    home: "/",
    pricing: "/pricing",
    privacy: "/privacy",
    terms: "/terms",
    lgpd: "/lgpd",
  },
  auth: {
    login: "/login",
    signup: "/signup",
    callback: "/auth/callback",
    logout: "/auth/logout",
    error: "/auth/error",
  },
  admin: {
    home: "/admin",
    clients: "/admin/clients",
    client: (id: string) => `/admin/clients/${id}`,
    approvals: "/admin/approvals",
    audit: "/admin/audit",
    agentConfig: "/admin/agent-config",
    reports: "/admin/reports",
    settings: "/admin/settings",
  },
  client: {
    home: (slug: string) => `/cliente/${slug}`,
    criativos: (slug: string) => `/cliente/${slug}/criativos`,
    historico: (slug: string) => `/cliente/${slug}/historico`,
    investimento: (slug: string) => `/cliente/${slug}/investimento`,
    mensagens: (slug: string) => `/cliente/${slug}/mensagens`,
  },
  api: {
    metaWebhook: "/api/webhooks/meta",
    metaConnect: "/api/auth/meta/start",
    metaCallback: "/api/auth/meta/callback",
    cronSync: "/api/cron/meta-sync",
    cronAnomaly: "/api/cron/detect-anomalies",
    claudeAction: "/api/claude/action",
    report: (id: string) => `/api/reports/${id}`,
  },
} as const;

// ─── Realtime Channels ───────────────────────────────────────────────
export const REALTIME_CHANNELS = {
  client: (clientId: string) => `client:${clientId}`,
  admin: "admin:global",
  notifications: (userId: string) => `notifications:${userId}`,
  approvals: "approvals:pending",
  alerts: (clientId: string) => `alerts:${clientId}`,
} as const;

// ─── Storage Buckets ─────────────────────────────────────────────────
export const STORAGE_BUCKETS = {
  creatives: "creatives",
  reports: "reports",
  avatars: "avatars",
  clientLogos: "client-logos",
} as const;
