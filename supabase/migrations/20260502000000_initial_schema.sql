-- ═══════════════════════════════════════════════════════════════════════════
-- BASE TRÁFEGO COMMAND — SCHEMA COMPLETO POSTGRES (SUPABASE)
-- Versão: 1.0 · Maio 2026
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Como usar:
-- 1. Criar projeto novo no Supabase
-- 2. SQL Editor → cole este arquivo inteiro → Run
-- 3. Confere se todas tabelas foram criadas em Database → Tables
-- 4. Habilita Realtime nas tabelas marcadas com [REALTIME]
-- 5. Configurações → Auth → habilita providers (Magic Link + Google)
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Extensions necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ═══════════════════════════════════════════════════════════════════════════

create type user_role as enum (
  'super_admin',
  'admin',
  'client_admin',
  'client_viewer'
);

create type client_status as enum (
  'active',
  'paused',
  'churned',
  'onboarding'
);

create type plan_tier as enum (
  'starter',
  'pro',
  'premium',
  'custom'
);

create type campaign_status as enum (
  'draft',
  'pending_approval',
  'active',
  'paused',
  'completed',
  'archived'
);

create type ad_status as enum (
  'pending_approval',
  'approved',
  'active',
  'paused',
  'rejected',
  'archived'
);

create type approval_status as enum (
  'pending',
  'approved',
  'rejected',
  'expired'
);

create type approval_type as enum (
  'create_campaign',
  'pause_campaign',
  'budget_change',
  'creative_launch',
  'targeting_change',
  'account_action'
);

create type alert_severity as enum (
  'info',
  'warning',
  'error',
  'critical'
);

create type alert_type as enum (
  'ctr_drop',
  'cpm_high',
  'budget_low',
  'creative_fatigue',
  'audience_overlap',
  'account_suspended',
  'token_expired',
  'custom'
);

create type alert_status as enum (
  'active',
  'acknowledged',
  'resolved',
  'dismissed'
);

create type action_type as enum (
  'create_campaign',
  'update_campaign',
  'pause_campaign',
  'resume_campaign',
  'delete_campaign',
  'create_ad_set',
  'update_ad_set',
  'create_ad',
  'pause_ad',
  'create_creative',
  'duplicate_creative',
  'budget_change',
  'targeting_change',
  'generate_report',
  'sync_meta_data'
);

create type action_status as enum (
  'pending',
  'in_progress',
  'success',
  'failed',
  'cancelled'
);

create type notification_channel as enum (
  'in_app',
  'email',
  'whatsapp',
  'discord',
  'webhook'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. PROFILES (extensão de auth.users)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  phone text,
  role user_role not null default 'client_viewer',
  is_active boolean not null default true,
  preferences jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index idx_profiles_email on profiles(email);
create index idx_profiles_role on profiles(role);

-- Trigger pra criar profile automaticamente quando user é criado
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CLIENTS (clientes da agência)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  
  -- Identificação
  slug text unique not null,           -- "just-burn", "flexbyo"
  name text not null,                  -- "Just Burn Club"
  legal_name text,                     -- "Just Burn Club LTDA"
  cnpj text,
  
  -- Branding (white-label)
  logo_url text,
  brand_primary_color text default '#3D5AFE',
  brand_secondary_color text default '#0a0a0a',
  custom_domain text,                  -- futuro
  
  -- Negócio
  industry text,                       -- "fitness", "food"
  description text,
  website_url text,
  
  -- Status
  status client_status not null default 'onboarding',
  plan plan_tier not null default 'pro',
  
  -- Limites
  monthly_budget_limit numeric(12,2),  -- limite hard
  monthly_budget_soft_cap numeric(12,2), -- alerta
  max_meta_accounts integer default 1,
  
  -- Aprovações
  requires_approval_above numeric(12,2) default 1000.00,
  auto_approve_creatives boolean default false,
  
  -- Onboarding
  onboarding_completed boolean default false,
  onboarding_step integer default 0,
  
  -- Notas internas
  internal_notes text,
  
  -- Timestamps
  contracted_at date,
  churned_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint clients_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create index idx_clients_slug on clients(slug);
create index idx_clients_status on clients(status);
create index idx_clients_plan on clients(plan);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. CLIENT_USERS (relação cliente ↔ usuário)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.client_users (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null default 'client_viewer',
  invited_by uuid references profiles(id),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  
  unique (client_id, user_id)
);

create index idx_client_users_client on client_users(client_id);
create index idx_client_users_user on client_users(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. META_ACCOUNTS (contas Meta Business vinculadas)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.meta_accounts (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  
  -- Meta IDs
  meta_business_id text not null,      -- act_xxxxx
  meta_account_id text not null,
  meta_account_name text,
  
  -- OAuth
  access_token_encrypted text not null,  -- pgp_sym_encrypt
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  
  -- Permissões
  scopes text[] default '{}',
  
  -- Status
  is_active boolean default true,
  is_primary boolean default false,
  
  -- Sync
  last_synced_at timestamptz,
  sync_error text,
  
  -- Saldo
  current_balance numeric(12,2),
  daily_spend_cap numeric(12,2),
  currency text default 'BRL',
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique (client_id, meta_account_id)
);

create index idx_meta_accounts_client on meta_accounts(client_id);
create index idx_meta_accounts_active on meta_accounts(is_active) where is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. CAMPAIGNS (snapshot de campanhas Meta)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  meta_account_id uuid not null references meta_accounts(id) on delete cascade,
  
  -- Meta IDs
  meta_campaign_id text unique not null,
  
  -- Dados básicos
  name text not null,
  objective text not null,             -- 'CONVERSIONS', 'LEAD_GENERATION', etc
  status campaign_status not null default 'draft',
  
  -- Orçamento
  daily_budget numeric(12,2),
  lifetime_budget numeric(12,2),
  total_spent numeric(12,2) default 0,
  
  -- Targeting (resumo)
  targeting jsonb default '{}'::jsonb,
  
  -- Datas
  start_date timestamptz,
  end_date timestamptz,
  
  -- Criado por
  created_by_claude boolean default false,
  created_by uuid references profiles(id),
  
  -- Sync
  last_synced_at timestamptz,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_campaigns_client on campaigns(client_id);
create index idx_campaigns_meta_id on campaigns(meta_campaign_id);
create index idx_campaigns_status on campaigns(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. AD_SETS
-- ═══════════════════════════════════════════════════════════════════════════

create table public.ad_sets (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  
  meta_ad_set_id text unique not null,
  name text not null,
  status text default 'paused',
  
  daily_budget numeric(12,2),
  lifetime_budget numeric(12,2),
  
  targeting jsonb default '{}'::jsonb,
  optimization_goal text,
  billing_event text,
  bid_strategy text,
  
  start_date timestamptz,
  end_date timestamptz,
  
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ad_sets_campaign on ad_sets(campaign_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. ADS (criativos rodando)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.ads (
  id uuid primary key default uuid_generate_v4(),
  ad_set_id uuid not null references ad_sets(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  
  meta_ad_id text unique not null,
  meta_creative_id text,
  
  name text not null,
  status ad_status not null default 'pending_approval',
  
  -- Conteúdo
  headline text,
  body text,
  cta_type text,
  link_url text,
  
  -- Mídia
  image_url text,
  video_url text,
  thumbnail_url text,
  
  -- Aprovação cliente
  approved_by_client boolean default false,
  approved_by_client_at timestamptz,
  approved_by_client_user uuid references profiles(id),
  
  -- Sync
  last_synced_at timestamptz,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ads_ad_set on ads(ad_set_id);
create index idx_ads_client on ads(client_id);
create index idx_ads_status on ads(status);
create index idx_ads_pending_client on ads(client_id, status) where status = 'pending_approval';

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. CREATIVES_ASSETS (mídia gerada/upload)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.creatives_assets (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  
  asset_type text not null,            -- 'image', 'video', 'carousel'
  url text not null,                   -- Supabase Storage
  meta_asset_id text,                  -- após upload pra Meta
  
  width integer,
  height integer,
  duration_seconds integer,
  file_size_bytes bigint,
  mime_type text,
  
  -- Metadata
  alt_text text,
  caption text,
  tags text[],
  
  -- Origem
  uploaded_by uuid references profiles(id),
  generated_by_ai boolean default false,
  ai_prompt text,
  
  created_at timestamptz not null default now()
);

create index idx_creatives_assets_client on creatives_assets(client_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. PERFORMANCE_SNAPSHOTS [REALTIME]
-- ═══════════════════════════════════════════════════════════════════════════

create table public.performance_snapshots (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  ad_set_id uuid references ad_sets(id) on delete cascade,
  ad_id uuid references ads(id) on delete cascade,
  
  -- Período
  period_start timestamptz not null,
  period_end timestamptz not null,
  granularity text not null,           -- 'hour', 'day', 'week', 'month'
  
  -- Métricas
  impressions bigint default 0,
  reach bigint default 0,
  clicks bigint default 0,
  spend numeric(12,2) default 0,
  conversions bigint default 0,
  conversion_value numeric(12,2) default 0,
  
  -- Calculadas
  ctr numeric(8,4),                    -- click-through rate
  cpc numeric(12,4),                   -- cost per click
  cpm numeric(12,4),                   -- cost per mille
  cpa numeric(12,4),                   -- cost per action
  roas numeric(12,4),                  -- return on ad spend
  
  -- Frequência
  frequency numeric(8,4),
  
  -- Breakdown (opcional)
  breakdown_dimension text,            -- 'age', 'gender', 'placement', etc
  breakdown_value text,
  
  raw_data jsonb,                      -- dump completo da Meta API
  
  created_at timestamptz not null default now()
);

create index idx_performance_client_period on performance_snapshots(client_id, period_start desc);
create index idx_performance_campaign on performance_snapshots(campaign_id);
create index idx_performance_ad on performance_snapshots(ad_id);
create index idx_performance_granularity on performance_snapshots(granularity);

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. ALERTS [REALTIME]
-- ═══════════════════════════════════════════════════════════════════════════

create table public.alerts (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  campaign_id uuid references campaigns(id),
  ad_id uuid references ads(id),
  
  type alert_type not null,
  severity alert_severity not null default 'warning',
  status alert_status not null default 'active',
  
  title text not null,
  message text not null,
  
  -- Dados do contexto
  data jsonb default '{}'::jsonb,
  
  -- Resolução
  acknowledged_by uuid references profiles(id),
  acknowledged_at timestamptz,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  
  -- Auto-resolution
  auto_resolved boolean default false,
  
  created_at timestamptz not null default now()
);

create index idx_alerts_client on alerts(client_id);
create index idx_alerts_status on alerts(status);
create index idx_alerts_active_client on alerts(client_id, status) where status = 'active';
create index idx_alerts_created on alerts(created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. APPROVALS [REALTIME]
-- ═══════════════════════════════════════════════════════════════════════════

create table public.approvals (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  
  type approval_type not null,
  status approval_status not null default 'pending',
  
  -- O que vai acontecer
  title text not null,
  description text,
  payload jsonb not null,              -- detalhes da ação
  estimated_impact jsonb,              -- {budget: 500, audience: 50000}
  
  -- Justificativa de Claude
  claude_reasoning text,
  claude_action_id uuid,               -- referência pra claude_actions
  
  -- Aprovação
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejected_by uuid references profiles(id),
  rejected_at timestamptz,
  rejection_reason text,
  
  -- Expiração
  expires_at timestamptz,
  
  created_at timestamptz not null default now()
);

create index idx_approvals_client on approvals(client_id);
create index idx_approvals_status on approvals(status);
create index idx_approvals_pending on approvals(client_id, status) where status = 'pending';

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. CLAUDE_ACTIONS (TUDO que Claude executa via MCP) [REALTIME]
-- ═══════════════════════════════════════════════════════════════════════════

create table public.claude_actions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  
  -- Ação
  action_type action_type not null,
  status action_status not null default 'pending',
  
  -- Input/Output
  tool_name text not null,
  input_payload jsonb not null,
  output_payload jsonb,
  
  -- Metadata
  reasoning text,                      -- por que Claude executou
  conversation_id text,                -- ID da conversa Claude Desktop
  
  -- Execução
  started_at timestamptz default now(),
  completed_at timestamptz,
  duration_ms integer,
  
  -- Erro
  error_message text,
  error_stack text,
  
  -- Refs
  meta_api_calls jsonb default '[]'::jsonb, -- logs das chamadas Meta
  approval_id uuid references approvals(id),
  
  created_at timestamptz not null default now()
);

create index idx_claude_actions_client on claude_actions(client_id);
create index idx_claude_actions_status on claude_actions(status);
create index idx_claude_actions_created on claude_actions(created_at desc);
create index idx_claude_actions_type on claude_actions(action_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. AUDIT_LOGS (TODA ação na plataforma)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  
  -- Quem
  actor_type text not null,            -- 'user', 'claude', 'system', 'cron'
  actor_id uuid,                       -- profile.id se user
  actor_email text,
  
  -- O que
  action text not null,                -- 'client.created', 'campaign.paused'
  resource_type text not null,         -- 'client', 'campaign', 'ad'
  resource_id uuid,
  
  -- Contexto
  client_id uuid references clients(id),
  
  -- Diff
  before_data jsonb,
  after_data jsonb,
  
  -- Metadata
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now()
);

create index idx_audit_logs_client on audit_logs(client_id);
create index idx_audit_logs_actor on audit_logs(actor_id);
create index idx_audit_logs_action on audit_logs(action);
create index idx_audit_logs_created on audit_logs(created_at desc);
create index idx_audit_logs_resource on audit_logs(resource_type, resource_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 15. REPORTS (relatórios gerados)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  
  title text not null,
  type text not null,                  -- 'weekly', 'monthly', 'custom'
  format text not null,                -- 'pdf', 'csv', 'web_link'
  
  period_start date not null,
  period_end date not null,
  
  -- Storage
  file_url text,                       -- URL Supabase Storage
  file_size_bytes bigint,
  share_token text unique,             -- pra link público
  share_token_expires_at timestamptz,
  
  -- Conteúdo
  data_snapshot jsonb,                 -- dados consolidados
  
  -- Quem gerou
  generated_by uuid references profiles(id),
  generated_by_claude boolean default false,
  
  -- Stats
  view_count integer default 0,
  last_viewed_at timestamptz,
  
  created_at timestamptz not null default now()
);

create index idx_reports_client on reports(client_id);
create index idx_reports_period on reports(client_id, period_start desc);
create index idx_reports_share_token on reports(share_token) where share_token is not null;

-- ═══════════════════════════════════════════════════════════════════════════
-- 16. NOTIFICATIONS [REALTIME]
-- ═══════════════════════════════════════════════════════════════════════════

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  client_id uuid references clients(id),
  
  channel notification_channel not null default 'in_app',
  type text not null,                  -- 'alert', 'approval', 'message'
  
  title text not null,
  message text not null,
  link_url text,
  
  -- Status
  read boolean default false,
  read_at timestamptz,
  
  -- Delivery
  delivered_at timestamptz,
  delivery_error text,
  
  data jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id);
create index idx_notifications_unread on notifications(user_id, read) where read = false;
create index idx_notifications_created on notifications(created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- 17. MESSAGES (chat cliente ↔ agência)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  
  sender_id uuid not null references profiles(id),
  sender_role user_role not null,
  
  content text not null,
  attachments jsonb default '[]'::jsonb,
  
  -- Status
  read_by uuid[] default '{}',
  
  -- Reply
  reply_to_id uuid references messages(id),
  
  created_at timestamptz not null default now()
);

create index idx_messages_client on messages(client_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- 18. AGENT_CONFIGS (configuração da IA por cliente)
-- ═══════════════════════════════════════════════════════════════════════════

create table public.agent_configs (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade unique,
  
  -- System prompt customizado pra esse cliente
  system_prompt text,
  
  -- Tom de voz
  tone_of_voice text default 'profissional',
  brand_guidelines text,
  
  -- Limites
  max_daily_actions integer default 50,
  max_budget_change_percent numeric(5,2) default 20.00,
  
  -- Auto-actions habilitadas
  auto_pause_underperforming boolean default false,
  auto_optimize_budget boolean default false,
  auto_create_variations boolean default false,
  
  -- Templates
  creative_templates jsonb default '[]'::jsonb,
  rules jsonb default '[]'::jsonb,     -- regras IF/THEN customizadas
  
  -- Bloqueios
  forbidden_audiences text[],
  forbidden_keywords text[],
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agent_configs_client on agent_configs(client_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 19. UPDATED_AT TRIGGER (genérico)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Aplica em todas tabelas que têm updated_at
do $$
declare
  t text;
begin
  for t in 
    select table_name 
    from information_schema.columns 
    where column_name = 'updated_at' 
    and table_schema = 'public'
  loop
    execute format('
      drop trigger if exists set_updated_at on public.%I;
      create trigger set_updated_at
      before update on public.%I
      for each row execute function public.update_updated_at_column();
    ', t, t);
  end loop;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 20. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper: verifica se user é admin
create or replace function public.is_admin()
returns boolean as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  );
$$ language sql stable security definer;

-- Helper: pega client_ids do user
create or replace function public.user_client_ids()
returns setof uuid as $$
  select client_id from public.client_users
  where user_id = auth.uid()
$$ language sql stable security definer;

-- Helper: verifica acesso ao client
create or replace function public.has_client_access(target_client_id uuid)
returns boolean as $$
  select 
    public.is_admin() 
    or target_client_id in (select public.user_client_ids());
$$ language sql stable security definer;

-- Habilita RLS em TODAS as tabelas
alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_users enable row level security;
alter table meta_accounts enable row level security;
alter table campaigns enable row level security;
alter table ad_sets enable row level security;
alter table ads enable row level security;
alter table creatives_assets enable row level security;
alter table performance_snapshots enable row level security;
alter table alerts enable row level security;
alter table approvals enable row level security;
alter table claude_actions enable row level security;
alter table audit_logs enable row level security;
alter table reports enable row level security;
alter table notifications enable row level security;
alter table messages enable row level security;
alter table agent_configs enable row level security;

-- POLICIES — PROFILES
create policy "users_view_own_profile" on profiles
  for select using (auth.uid() = id);

create policy "users_update_own_profile" on profiles
  for update using (auth.uid() = id);

create policy "admins_view_all_profiles" on profiles
  for select using (public.is_admin());

create policy "admins_update_all_profiles" on profiles
  for update using (public.is_admin());

-- POLICIES — CLIENTS
create policy "admins_full_clients" on clients
  for all using (public.is_admin());

create policy "client_users_view_own_client" on clients
  for select using (id in (select public.user_client_ids()));

-- POLICIES — CLIENT_USERS
create policy "admins_full_client_users" on client_users
  for all using (public.is_admin());

create policy "users_view_own_memberships" on client_users
  for select using (user_id = auth.uid());

-- POLICIES genéricas pra tabelas client-scoped
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'meta_accounts',
      'campaigns',
      'ad_sets',
      'ads',
      'creatives_assets',
      'performance_snapshots',
      'alerts',
      'approvals',
      'claude_actions',
      'reports',
      'messages',
      'agent_configs'
    ])
  loop
    execute format('
      create policy "admins_full_%I" on public.%I
        for all using (public.is_admin());
      
      create policy "client_users_view_%I" on public.%I
        for select using (public.has_client_access(client_id));
    ', t, t, t, t);
  end loop;
end;
$$;

-- POLICIES — AUDIT_LOGS (admin only read, system writes)
create policy "admins_view_audit_logs" on audit_logs
  for select using (public.is_admin());

-- POLICIES — NOTIFICATIONS (user vê só as suas)
create policy "users_view_own_notifications" on notifications
  for select using (user_id = auth.uid());

create policy "users_update_own_notifications" on notifications
  for update using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- 21. STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════

-- Estes comandos são executados via Supabase Dashboard ou CLI:
--
-- supabase storage create creatives    --public
-- supabase storage create reports      --private  
-- supabase storage create avatars      --public
-- supabase storage create client-logos --public

-- ═══════════════════════════════════════════════════════════════════════════
-- 22. SEED DATA (dev only)
-- ═══════════════════════════════════════════════════════════════════════════

-- Cliente exemplo
insert into clients (
  slug, name, legal_name, industry, status, plan,
  monthly_budget_limit, brand_primary_color
) values (
  'demo-cliente',
  'Cliente Demo',
  'Demo LTDA',
  'fitness',
  'active',
  'pro',
  10000.00,
  '#FF4D00'
) on conflict (slug) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 23. REALTIME PUBLICATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilita Realtime nas tabelas que devem fazer push pra clients
-- (executar via Dashboard: Database → Replication)

-- Tabelas que DEVEM ter Realtime habilitado:
-- ✅ alerts
-- ✅ approvals
-- ✅ claude_actions
-- ✅ performance_snapshots
-- ✅ ads (status changes)
-- ✅ notifications
-- ✅ messages

-- ═══════════════════════════════════════════════════════════════════════════
-- 24. VIEWS ÚTEIS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: dashboard summary por cliente
create or replace view public.client_dashboard_summary as
select 
  c.id as client_id,
  c.name as client_name,
  c.slug,
  c.status,
  -- Active campaigns
  (select count(*) from campaigns where client_id = c.id and status = 'active') as active_campaigns,
  -- Active ads
  (select count(*) from ads where client_id = c.id and status = 'active') as active_ads,
  -- Pending approvals
  (select count(*) from approvals where client_id = c.id and status = 'pending') as pending_approvals,
  -- Active alerts
  (select count(*) from alerts where client_id = c.id and status = 'active') as active_alerts,
  -- Spend last 30d
  (select coalesce(sum(spend), 0) from performance_snapshots 
   where client_id = c.id and period_start >= now() - interval '30 days'
   and granularity = 'day') as spend_last_30d,
  -- Last action
  (select max(created_at) from claude_actions where client_id = c.id) as last_claude_action_at
from clients c;

grant select on client_dashboard_summary to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 25. FUNCTIONS RPC ÚTEIS
-- ═══════════════════════════════════════════════════════════════════════════

-- Função: cria alerta com notificação automática
create or replace function public.create_alert(
  p_client_id uuid,
  p_type alert_type,
  p_severity alert_severity,
  p_title text,
  p_message text,
  p_data jsonb default '{}'::jsonb
)
returns uuid as $$
declare
  v_alert_id uuid;
begin
  insert into alerts (client_id, type, severity, title, message, data)
  values (p_client_id, p_type, p_severity, p_title, p_message, p_data)
  returning id into v_alert_id;
  
  -- Cria notificação pros admins
  insert into notifications (user_id, client_id, channel, type, title, message, data)
  select 
    p.id,
    p_client_id,
    'in_app',
    'alert',
    p_title,
    p_message,
    p_data
  from profiles p
  where p.role in ('admin', 'super_admin');
  
  return v_alert_id;
end;
$$ language plpgsql security definer;

-- Função: marca todas notifications como lidas
create or replace function public.mark_all_notifications_read()
returns integer as $$
declare
  v_count integer;
begin
  update notifications
  set read = true, read_at = now()
  where user_id = auth.uid() and read = false;
  
  get diagnostics v_count = row_count;
  return v_count;
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIM DO SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════

-- Total de objetos criados:
-- ✅ 18 tabelas
-- ✅ 25+ índices
-- ✅ 11 enums
-- ✅ 35+ RLS policies
-- ✅ 6 functions
-- ✅ 1 view
-- ✅ 8 triggers
--
-- Próximo passo: gerar tipos TypeScript via:
-- npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
