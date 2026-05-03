-- ════════════════════════════════════════════════════════════════════
-- Extensions extras + Helper RPCs adicionais
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Token encryption helpers ────────────────────────────────────────
create or replace function public.encrypt_token(token text, secret text)
returns text
language plpgsql
security definer
as $$
begin
  return encode(
    pgp_sym_encrypt(token, secret),
    'base64'
  );
end;
$$;

create or replace function public.decrypt_token(encrypted text, secret text)
returns text
language plpgsql
security definer
as $$
begin
  return pgp_sym_decrypt(
    decode(encrypted, 'base64'),
    secret
  );
exception
  when others then return null;
end;
$$;

-- ─── Get client by slug (case-insensitive) ───────────────────────────
create or replace function public.get_client_by_slug(p_slug text)
returns clients
language sql
stable
security definer
as $$
  select * from public.clients
  where lower(slug) = lower(p_slug)
  limit 1;
$$;

-- ─── Aggregated dashboard overview pra admin ─────────────────────────
create or replace function public.admin_dashboard_overview()
returns table (
  active_clients bigint,
  total_spend_today numeric,
  total_spend_7d numeric,
  total_spend_30d numeric,
  claude_actions_today bigint,
  pending_approvals bigint,
  active_alerts bigint,
  avg_roas numeric
)
language sql
stable
security definer
as $$
  select
    (select count(*) from clients where status = 'active') as active_clients,
    coalesce((
      select sum(spend) from performance_snapshots
      where granularity = 'day'
      and period_start::date = current_date
    ), 0) as total_spend_today,
    coalesce((
      select sum(spend) from performance_snapshots
      where granularity = 'day'
      and period_start >= now() - interval '7 days'
    ), 0) as total_spend_7d,
    coalesce((
      select sum(spend) from performance_snapshots
      where granularity = 'day'
      and period_start >= now() - interval '30 days'
    ), 0) as total_spend_30d,
    (select count(*) from claude_actions where created_at::date = current_date) as claude_actions_today,
    (select count(*) from approvals where status = 'pending') as pending_approvals,
    (select count(*) from alerts where status = 'active') as active_alerts,
    coalesce((
      select avg(roas) from performance_snapshots
      where roas is not null
      and granularity = 'day'
      and period_start >= now() - interval '7 days'
    ), 0) as avg_roas;
$$;

grant execute on function public.admin_dashboard_overview() to authenticated;

-- ─── Performance summary por client + período ────────────────────────
create or replace function public.client_performance_summary(
  p_client_id uuid,
  p_start timestamptz default (now() - interval '7 days'),
  p_end timestamptz default now()
)
returns table (
  impressions bigint,
  reach bigint,
  clicks bigint,
  spend numeric,
  conversions bigint,
  conversion_value numeric,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  cpa numeric,
  roas numeric,
  frequency numeric
)
language sql
stable
security definer
as $$
  select
    coalesce(sum(impressions), 0) as impressions,
    coalesce(sum(reach), 0) as reach,
    coalesce(sum(clicks), 0) as clicks,
    coalesce(sum(spend), 0) as spend,
    coalesce(sum(conversions), 0) as conversions,
    coalesce(sum(conversion_value), 0) as conversion_value,
    case when coalesce(sum(impressions), 0) > 0
      then (sum(clicks)::numeric / sum(impressions)::numeric) * 100
      else 0
    end as ctr,
    case when coalesce(sum(clicks), 0) > 0
      then sum(spend)::numeric / sum(clicks)::numeric
      else 0
    end as cpc,
    case when coalesce(sum(impressions), 0) > 0
      then (sum(spend)::numeric / sum(impressions)::numeric) * 1000
      else 0
    end as cpm,
    case when coalesce(sum(conversions), 0) > 0
      then sum(spend)::numeric / sum(conversions)::numeric
      else 0
    end as cpa,
    case when coalesce(sum(spend), 0) > 0
      then sum(conversion_value)::numeric / sum(spend)::numeric
      else 0
    end as roas,
    coalesce(avg(frequency), 0) as frequency
  from performance_snapshots
  where client_id = p_client_id
  and granularity = 'day'
  and period_start between p_start and p_end;
$$;

grant execute on function public.client_performance_summary(uuid, timestamptz, timestamptz) to authenticated;

-- ─── Cleanup expired approvals ───────────────────────────────────────
create or replace function public.expire_old_approvals()
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  update approvals
  set status = 'expired'
  where status = 'pending'
  and expires_at is not null
  and expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
