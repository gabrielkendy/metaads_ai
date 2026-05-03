// ════════════════════════════════════════════════════════════════════
// Mock COMPLETO de campanhas + ad sets + ads + métricas
// Cada campanha tem seus próprios criativos com performance individual
// ════════════════════════════════════════════════════════════════════

export type CampaignObjective =
  | "OUTCOME_SALES"
  | "OUTCOME_LEADS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_AWARENESS"
  | "OUTCOME_ENGAGEMENT";

export type CampaignStatus = "active" | "paused" | "draft" | "pending_approval" | "completed";

export interface AdMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversion_value: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  roas: number;
  frequency: number;
}

export interface DemoAd {
  id: string;
  name: string;
  status: "active" | "paused" | "pending_approval" | "rejected" | "approved";
  headline: string;
  body: string;
  cta_type: string;
  link_url: string;
  image_url: string;
  thumbnail_url: string;
  approved_by_client: boolean;
  created_at: string;
  metrics: AdMetrics;
}

export interface DemoAdSet {
  id: string;
  name: string;
  optimization_goal: string;
  daily_budget: number;
  targeting: {
    age_range: string;
    genders: string[];
    geo: string[];
    interests: string[];
    placements: string[];
  };
  status: "active" | "paused";
  metrics: AdMetrics;
  ads: DemoAd[];
}

export interface DemoCampaign {
  id: string;
  client_id: string;
  client_slug: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  daily_budget: number;
  total_spent: number;
  start_date: string;
  end_date: string | null;
  created_by_claude: boolean;
  created_at: string;
  metrics: AdMetrics;
  ad_sets: DemoAdSet[];
  notes?: string;
}

const m = (overrides: Partial<AdMetrics>): AdMetrics => ({
  impressions: 0,
  reach: 0,
  clicks: 0,
  spend: 0,
  conversions: 0,
  conversion_value: 0,
  ctr: 0,
  cpc: 0,
  cpm: 0,
  cpa: 0,
  roas: 0,
  frequency: 1,
  ...overrides,
});

const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();

// ─── Just Burn Club ──────────────────────────────────────────────────
const jbCampaigns: DemoCampaign[] = [
  {
    id: "camp-jb-1",
    client_id: "demo-client-1",
    client_slug: "just-burn",
    name: "JB · Conversão Mulheres 25-45 BH",
    objective: "OUTCOME_SALES",
    status: "active",
    daily_budget: 200,
    total_spent: 4820.5,
    start_date: daysAgo(28),
    end_date: null,
    created_by_claude: true,
    created_at: daysAgo(28),
    metrics: m({
      impressions: 142500,
      reach: 98230,
      clicks: 4180,
      spend: 4820.5,
      conversions: 168,
      conversion_value: 22340.18,
      ctr: 2.93,
      cpc: 1.15,
      cpm: 33.83,
      cpa: 28.69,
      roas: 4.63,
      frequency: 1.45,
    }),
    notes: "Carro-chefe — público frio que mais converte.",
    ad_sets: [
      {
        id: "as-jb-1-1",
        name: "AS · Mulheres 25-35 · Fitness",
        optimization_goal: "OFFSITE_CONVERSIONS",
        daily_budget: 120,
        status: "active",
        targeting: {
          age_range: "25-35",
          genders: ["female"],
          geo: ["Belo Horizonte/MG", "Contagem/MG", "Nova Lima/MG"],
          interests: ["Crossfit", "Fitness", "Musculação", "Bem-estar"],
          placements: ["facebook_feed", "instagram_feed", "instagram_reels"],
        },
        metrics: m({
          impressions: 87420,
          clicks: 2680,
          spend: 2912.4,
          conversions: 108,
          conversion_value: 14688.0,
          ctr: 3.07,
          cpc: 1.09,
          cpm: 33.32,
          roas: 5.04,
          frequency: 1.38,
        }),
        ads: [
          {
            id: "ad-jb-1",
            name: "JB-Conv-Trans-12sem",
            status: "active",
            headline: "Transforme seu corpo em 12 semanas",
            body: "Plano completo que mais que dobrou os resultados de 2.348 alunas. Garantia ou seu dinheiro de volta.",
            cta_type: "SIGN_UP",
            link_url: "https://justburn.com.br/lp/12sem",
            image_url:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop",
            thumbnail_url:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
            approved_by_client: true,
            created_at: daysAgo(28),
            metrics: m({
              impressions: 48230,
              clicks: 1620,
              spend: 1640.4,
              conversions: 67,
              conversion_value: 9112.0,
              ctr: 3.36,
              cpc: 1.01,
              cpm: 34.0,
              roas: 5.55,
              frequency: 1.32,
            }),
          },
          {
            id: "ad-jb-2",
            name: "JB-Conv-Comunidade",
            status: "active",
            headline: "Adeus academia chata. Olá Just Burn.",
            body: "Treinos curtos, intensos e divertidos. Comunidade que te puxa quando você quer desistir.",
            cta_type: "LEARN_MORE",
            link_url: "https://justburn.com.br/lp/comunidade",
            image_url:
              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop",
            thumbnail_url:
              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
            approved_by_client: true,
            created_at: daysAgo(21),
            metrics: m({
              impressions: 39190,
              clicks: 1060,
              spend: 1272.0,
              conversions: 41,
              conversion_value: 5576.0,
              ctr: 2.7,
              cpc: 1.2,
              cpm: 32.46,
              roas: 4.38,
              frequency: 1.45,
            }),
          },
        ],
      },
      {
        id: "as-jb-1-2",
        name: "AS · Mulheres 35-45 · Saúde",
        optimization_goal: "OFFSITE_CONVERSIONS",
        daily_budget: 80,
        status: "active",
        targeting: {
          age_range: "35-45",
          genders: ["female"],
          geo: ["Grande BH"],
          interests: ["Saúde", "Yoga", "Pilates", "Emagrecimento"],
          placements: ["facebook_feed", "instagram_feed"],
        },
        metrics: m({
          impressions: 55080,
          clicks: 1500,
          spend: 1908.1,
          conversions: 60,
          conversion_value: 7652.18,
          ctr: 2.72,
          cpc: 1.27,
          cpm: 34.64,
          roas: 4.01,
          frequency: 1.62,
        }),
        ads: [
          {
            id: "ad-jb-3",
            name: "JB-Conv-Inquebravel",
            status: "active",
            headline: "Você merece se sentir foda",
            body: "Não é só sobre estética — é sobre ser inquebrável. Mente e corpo treinados juntos.",
            cta_type: "SIGN_UP",
            link_url: "https://justburn.com.br/lp/inquebravel",
            image_url:
              "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=800&fit=crop",
            thumbnail_url:
              "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400",
            approved_by_client: true,
            created_at: daysAgo(14),
            metrics: m({
              impressions: 55080,
              clicks: 1500,
              spend: 1908.1,
              conversions: 60,
              conversion_value: 7652.18,
              ctr: 2.72,
              cpc: 1.27,
              cpm: 34.64,
              roas: 4.01,
              frequency: 1.62,
            }),
          },
        ],
      },
    ],
  },
  {
    id: "camp-jb-2",
    client_id: "demo-client-1",
    client_slug: "just-burn",
    name: "JB · Lookalike 1% Compradores 90d",
    objective: "OUTCOME_SALES",
    status: "active",
    daily_budget: 100,
    total_spent: 2340.18,
    start_date: daysAgo(21),
    end_date: null,
    created_by_claude: true,
    created_at: daysAgo(21),
    metrics: m({
      impressions: 68420,
      reach: 52100,
      clicks: 1820,
      spend: 2340.18,
      conversions: 78,
      conversion_value: 9821.5,
      ctr: 2.66,
      cpc: 1.29,
      cpm: 34.2,
      cpa: 30.0,
      roas: 4.2,
      frequency: 1.31,
    }),
    notes: "Lookalike performando 2.3x melhor que interesse amplo.",
    ad_sets: [
      {
        id: "as-jb-2-1",
        name: "AS · LAL 1% Compradores",
        optimization_goal: "OFFSITE_CONVERSIONS",
        daily_budget: 100,
        status: "active",
        targeting: {
          age_range: "22-50",
          genders: ["all"],
          geo: ["Brasil — Sudeste"],
          interests: ["Custom Audience: Compradores 90d (LAL 1%)"],
          placements: ["facebook_feed", "instagram_feed", "instagram_reels"],
        },
        metrics: m({
          impressions: 68420,
          clicks: 1820,
          spend: 2340.18,
          conversions: 78,
          conversion_value: 9821.5,
          ctr: 2.66,
          cpc: 1.29,
          cpm: 34.2,
          roas: 4.2,
          frequency: 1.31,
        }),
        ads: [
          {
            id: "ad-jb-4",
            name: "JB-LAL-12semanas",
            status: "active",
            headline: "Apenas 12 semanas pra virar a chave",
            body: "Acompanhamento individual + treinos online + comunidade exclusiva. Mais de 5.000 transformações.",
            cta_type: "GET_OFFER",
            link_url: "https://justburn.com.br/lp/lal",
            image_url:
              "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=800&fit=crop",
            thumbnail_url:
              "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
            approved_by_client: true,
            created_at: daysAgo(21),
            metrics: m({
              impressions: 68420,
              clicks: 1820,
              spend: 2340.18,
              conversions: 78,
              conversion_value: 9821.5,
              ctr: 2.66,
              cpc: 1.29,
              cpm: 34.2,
              roas: 4.2,
              frequency: 1.31,
            }),
          },
        ],
      },
    ],
  },
  {
    id: "camp-jb-3",
    client_id: "demo-client-1",
    client_slug: "just-burn",
    name: "JB · Retargeting Site 30d",
    objective: "OUTCOME_SALES",
    status: "active",
    daily_budget: 50,
    total_spent: 1180.4,
    start_date: daysAgo(14),
    end_date: null,
    created_by_claude: true,
    created_at: daysAgo(14),
    metrics: m({
      impressions: 28430,
      reach: 8120,
      clicks: 920,
      spend: 1180.4,
      conversions: 38,
      conversion_value: 5430.2,
      ctr: 3.24,
      cpc: 1.28,
      cpm: 41.5,
      cpa: 31.06,
      roas: 4.6,
      frequency: 3.5,
    }),
    notes: "Frequency alta (3.5) — atenção ao cansaço.",
    ad_sets: [
      {
        id: "as-jb-3-1",
        name: "AS · Visitantes 30d sem compra",
        optimization_goal: "OFFSITE_CONVERSIONS",
        daily_budget: 50,
        status: "active",
        targeting: {
          age_range: "22-50",
          genders: ["all"],
          geo: ["Brasil"],
          interests: ["Custom Audience: Site 30d − Compradores"],
          placements: ["facebook_feed", "instagram_feed", "instagram_stories"],
        },
        metrics: m({
          impressions: 28430,
          clicks: 920,
          spend: 1180.4,
          conversions: 38,
          conversion_value: 5430.2,
          ctr: 3.24,
          cpc: 1.28,
          cpm: 41.5,
          roas: 4.6,
          frequency: 3.5,
        }),
        ads: [
          {
            id: "ad-jb-5",
            name: "JB-Retarg-App",
            status: "active",
            headline: "Treine onde for. Conquiste o impossível.",
            body: "App + treinos + comunidade. Uma turma nova começa toda semana — sua vez é agora.",
            cta_type: "DOWNLOAD",
            link_url: "https://justburn.com.br/lp/app",
            image_url:
              "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&h=800&fit=crop",
            thumbnail_url:
              "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
            approved_by_client: true,
            created_at: daysAgo(14),
            metrics: m({
              impressions: 28430,
              clicks: 920,
              spend: 1180.4,
              conversions: 38,
              conversion_value: 5430.2,
              ctr: 3.24,
              cpc: 1.28,
              cpm: 41.5,
              roas: 4.6,
              frequency: 3.5,
            }),
          },
        ],
      },
    ],
  },
  {
    id: "camp-jb-4",
    client_id: "demo-client-1",
    client_slug: "just-burn",
    name: "JB · Awareness Frio Geral",
    objective: "OUTCOME_AWARENESS",
    status: "paused",
    daily_budget: 30,
    total_spent: 312.0,
    start_date: daysAgo(35),
    end_date: daysAgo(8),
    created_by_claude: false,
    created_at: daysAgo(35),
    metrics: m({
      impressions: 112400,
      reach: 89230,
      clicks: 320,
      spend: 312.0,
      conversions: 4,
      conversion_value: 480.0,
      ctr: 0.28,
      cpc: 0.97,
      cpm: 2.78,
      cpa: 78.0,
      roas: 1.54,
      frequency: 1.26,
    }),
    notes: "Pausada — ROAS baixo. Substituída por Lookalike.",
    ad_sets: [],
  },
  {
    id: "camp-jb-5",
    client_id: "demo-client-1",
    client_slug: "just-burn",
    name: "JB · Black Friday Lookalike (rascunho)",
    objective: "OUTCOME_SALES",
    status: "pending_approval",
    daily_budget: 600,
    total_spent: 0,
    start_date: daysAgo(0),
    end_date: null,
    created_by_claude: true,
    created_at: daysAgo(0),
    metrics: m({}),
    notes: "Aguardando aprovação Kendy. Budget mensal R$ 18.000.",
    ad_sets: [],
  },
];

// ─── Beat Life ───────────────────────────────────────────────────────
const blCampaigns: DemoCampaign[] = [
  {
    id: "camp-bl-1",
    client_id: "demo-client-2",
    client_slug: "beat-life",
    name: "BL · Hipertrofia 2025 · Whey Iso",
    objective: "OUTCOME_SALES",
    status: "active",
    daily_budget: 400,
    total_spent: 8924.3,
    start_date: daysAgo(45),
    end_date: null,
    created_by_claude: false,
    created_at: daysAgo(45),
    metrics: m({
      impressions: 245820,
      reach: 168200,
      clicks: 8420,
      spend: 8924.3,
      conversions: 412,
      conversion_value: 51760.0,
      ctr: 3.43,
      cpc: 1.06,
      cpm: 36.3,
      cpa: 21.66,
      roas: 5.8,
      frequency: 1.46,
    }),
    notes: "ROAS 5.8x — escalar agressivo (Claude pediu aprovação +35%).",
    ad_sets: [
      {
        id: "as-bl-1-1",
        name: "AS · Praticantes Musculação 18-45",
        optimization_goal: "OFFSITE_CONVERSIONS",
        daily_budget: 400,
        status: "active",
        targeting: {
          age_range: "18-45",
          genders: ["all"],
          geo: ["Brasil"],
          interests: ["Musculação", "Bodybuilding", "Suplementos", "Whey Protein"],
          placements: ["facebook_feed", "instagram_feed", "instagram_reels"],
        },
        metrics: m({
          impressions: 245820,
          clicks: 8420,
          spend: 8924.3,
          conversions: 412,
          conversion_value: 51760.0,
          ctr: 3.43,
          cpc: 1.06,
          cpm: 36.3,
          roas: 5.8,
          frequency: 1.46,
        }),
        ads: [
          {
            id: "ad-bl-1",
            name: "BL-Whey-Pureza",
            status: "active",
            headline: "Whey Iso 92% — Pureza absurda, gosto que vicia",
            body: "30g de proteína por dose · Filtragem ultracross · Testado em laboratório independente",
            cta_type: "SHOP_NOW",
            link_url: "https://beatlife.com.br/whey-iso",
            image_url:
              "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&h=800&fit=crop",
            thumbnail_url:
              "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400",
            approved_by_client: true,
            created_at: daysAgo(45),
            metrics: m({
              impressions: 145220,
              clicks: 5180,
              spend: 5512.4,
              conversions: 248,
              conversion_value: 31250.0,
              ctr: 3.57,
              cpc: 1.06,
              cpm: 37.96,
              roas: 5.67,
              frequency: 1.42,
            }),
          },
          {
            id: "ad-bl-2",
            name: "BL-Whey-Resultados",
            status: "active",
            headline: "+5kg de massa magra em 3 meses",
            body: "Programa Beat Life: whey + treino + dieta. 8.420 atletas comprovaram.",
            cta_type: "LEARN_MORE",
            link_url: "https://beatlife.com.br/programa",
            image_url:
              "https://images.unsplash.com/photo-1583500178690-f7fd39158be1?w=800&h=800&fit=crop",
            thumbnail_url:
              "https://images.unsplash.com/photo-1583500178690-f7fd39158be1?w=400",
            approved_by_client: true,
            created_at: daysAgo(38),
            metrics: m({
              impressions: 100600,
              clicks: 3240,
              spend: 3411.9,
              conversions: 164,
              conversion_value: 20510.0,
              ctr: 3.22,
              cpc: 1.05,
              cpm: 33.92,
              roas: 6.01,
              frequency: 1.5,
            }),
          },
        ],
      },
    ],
  },
];

// ─── Manchester Burger ───────────────────────────────────────────────
const mbCampaigns: DemoCampaign[] = [
  {
    id: "camp-mb-1",
    client_id: "demo-client-3",
    client_slug: "manchester-burger",
    name: "MB · Quinta do Smash · Stories",
    objective: "OUTCOME_TRAFFIC",
    status: "active",
    daily_budget: 80,
    total_spent: 1920.5,
    start_date: daysAgo(30),
    end_date: null,
    created_by_claude: false,
    created_at: daysAgo(30),
    metrics: m({
      impressions: 89230,
      reach: 62100,
      clicks: 4820,
      spend: 1920.5,
      conversions: 0,
      conversion_value: 0,
      ctr: 5.4,
      cpc: 0.4,
      cpm: 21.52,
      cpa: 0,
      roas: 0,
      frequency: 1.44,
    }),
    notes: "Tráfego pra cardápio. CTR ótimo (5.4%) mas sem tracking de conversão offline.",
    ad_sets: [
      {
        id: "as-mb-1-1",
        name: "AS · Geo 5km · Almoço/Jantar",
        optimization_goal: "LINK_CLICKS",
        daily_budget: 80,
        status: "active",
        targeting: {
          age_range: "20-50",
          genders: ["all"],
          geo: ["Belo Horizonte/MG (raio 5km de cada loja)"],
          interests: ["Comida", "Hambúrguer", "Restaurantes"],
          placements: ["instagram_stories", "facebook_stories"],
        },
        metrics: m({
          impressions: 89230,
          clicks: 4820,
          spend: 1920.5,
          ctr: 5.4,
          cpc: 0.4,
          cpm: 21.52,
          frequency: 1.44,
        }),
        ads: [
          {
            id: "ad-mb-1",
            name: "MB-Smash-Stories",
            status: "active",
            headline: "Quinta = Smash R$ 24,90",
            body: "Smash artesanal + fritas + refri. Só nas quintas. Promoção do dia até 23h.",
            cta_type: "GET_OFFER",
            link_url: "https://manchesterburger.com.br/quinta",
            image_url:
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=800&fit=crop",
            thumbnail_url:
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
            approved_by_client: true,
            created_at: daysAgo(30),
            metrics: m({
              impressions: 89230,
              clicks: 4820,
              spend: 1920.5,
              ctr: 5.4,
              cpc: 0.4,
              cpm: 21.52,
              frequency: 1.44,
            }),
          },
        ],
      },
    ],
  },
];

export const demoAllCampaigns = [...jbCampaigns, ...blCampaigns, ...mbCampaigns];

export function getCampaignsBySlug(slug: string): DemoCampaign[] {
  return demoAllCampaigns.filter((c) => c.client_slug === slug);
}

export function getCampaignById(id: string): DemoCampaign | undefined {
  return demoAllCampaigns.find((c) => c.id === id);
}

// ─── Series temporal por dia (pra gráficos por campanha) ─────────────
export function getCampaignTimeseries(campaignId: string, days = 14) {
  const campaign = demoAllCampaigns.find((c) => c.id === campaignId);
  if (!campaign) return [];
  const data = [];
  // Distribui spend e revenue total ao longo dos últimos `days` dias com variância
  const dailySpend = campaign.metrics.spend / Math.max(1, days);
  const dailyRevenue = campaign.metrics.conversion_value / Math.max(1, days);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const variance = 0.5 + Math.random() * 1.0;
    data.push({
      date,
      spend: Math.round(dailySpend * variance),
      revenue: Math.round(dailyRevenue * variance),
    });
  }
  return data;
}
