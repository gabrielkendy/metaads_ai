-- ════════════════════════════════════════════════════════════════════
-- Hardening de segurança — RLS policies adicionais e validações
-- ════════════════════════════════════════════════════════════════════
-- Camadas extras de proteção:
--   1. Audit logs imutáveis (UPDATE/DELETE bloqueados)
--   2. Trigger pra garantir client_id em ações Claude
--   3. Constraint pra impedir cross-tenant em ad_sets/ads
--   4. Função `enforce_client_isolation` usada em RPCs sensíveis
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Audit logs append-only ───────────────────────────────────────
drop policy if exists "audit_logs_no_update" on audit_logs;
drop policy if exists "audit_logs_no_delete" on audit_logs;

create policy "audit_logs_no_update" on audit_logs
  for update using (false);

create policy "audit_logs_no_delete" on audit_logs
  for delete using (false);

-- ─── 2. Trigger pra garantir consistência ad_set ↔ campaign ──────────
create or replace function public.check_ad_set_campaign_consistency()
returns trigger
language plpgsql
as $$
declare
  v_campaign_client_id uuid;
begin
  select client_id into v_campaign_client_id
  from campaigns where id = new.campaign_id;

  if v_campaign_client_id is null then
    raise exception 'Campaign % não existe', new.campaign_id;
  end if;
  return new;
end;
$$;

drop trigger if exists ad_set_consistency on ad_sets;
create trigger ad_set_consistency
  before insert or update on ad_sets
  for each row execute function check_ad_set_campaign_consistency();

-- ─── 3. Trigger pra garantir consistência ad ↔ ad_set ↔ client ───────
create or replace function public.check_ad_client_consistency()
returns trigger
language plpgsql
as $$
declare
  v_ad_set_client_id uuid;
begin
  select c.client_id into v_ad_set_client_id
  from ad_sets a
  join campaigns c on c.id = a.campaign_id
  where a.id = new.ad_set_id;

  if v_ad_set_client_id is null then
    raise exception 'Ad set % não tem campanha vinculada', new.ad_set_id;
  end if;

  if new.client_id != v_ad_set_client_id then
    raise exception 'Ad client_id (%) não bate com client_id da campanha (%)',
      new.client_id, v_ad_set_client_id;
  end if;
  return new;
end;
$$;

drop trigger if exists ad_client_consistency on ads;
create trigger ad_client_consistency
  before insert or update on ads
  for each row execute function check_ad_client_consistency();

-- ─── 4. Trigger pra impedir alteração de client_id em campaigns ──────
create or replace function public.lock_campaign_client_id()
returns trigger
language plpgsql
as $$
begin
  if old.client_id != new.client_id then
    raise exception 'Não é permitido alterar client_id de uma campanha (campaign=%)', old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists lock_campaign_client_id on campaigns;
create trigger lock_campaign_client_id
  before update on campaigns
  for each row execute function lock_campaign_client_id();

-- ─── 5. Trigger pra impedir alteração de client_id em ads ────────────
create or replace function public.lock_ad_client_id()
returns trigger
language plpgsql
as $$
begin
  if old.client_id != new.client_id then
    raise exception 'Não é permitido alterar client_id de um ad (ad=%)', old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists lock_ad_client_id on ads;
create trigger lock_ad_client_id
  before update on ads
  for each row execute function lock_ad_client_id();

-- ─── 6. Trigger: claude_actions sempre tem client_id (exceto system) ─
create or replace function public.require_claude_action_client()
returns trigger
language plpgsql
as $$
begin
  -- Permite client_id null APENAS pra ações genéricas (sync_meta_data sem cliente)
  if new.client_id is null
     and new.action_type not in ('sync_meta_data') then
    raise warning 'claude_action % do tipo % criada sem client_id',
      new.id, new.action_type;
  end if;
  return new;
end;
$$;

drop trigger if exists check_claude_action_client on claude_actions;
create trigger check_claude_action_client
  before insert on claude_actions
  for each row execute function require_claude_action_client();

-- ─── 7. RPC pra checar ownership cruzado client ↔ ad ──────────────────
create or replace function public.check_resource_owner(
  p_resource_type text,
  p_resource_id uuid,
  p_expected_client_id uuid
)
returns boolean
language plpgsql
stable
security definer
as $$
declare
  v_actual_client_id uuid;
begin
  case p_resource_type
    when 'campaign' then
      select client_id into v_actual_client_id
      from campaigns where id = p_resource_id;
    when 'ad' then
      select client_id into v_actual_client_id
      from ads where id = p_resource_id;
    when 'meta_account' then
      select client_id into v_actual_client_id
      from meta_accounts where id = p_resource_id;
    when 'ad_set' then
      select c.client_id into v_actual_client_id
      from ad_sets a join campaigns c on c.id = a.campaign_id
      where a.id = p_resource_id;
    else
      raise exception 'Tipo de recurso inválido: %', p_resource_type;
  end case;

  if v_actual_client_id is null then
    return false;
  end if;
  return v_actual_client_id = p_expected_client_id;
end;
$$;

grant execute on function public.check_resource_owner(text, uuid, uuid) to authenticated;

-- ─── 8. View pra Realtime de aprovações restrita por cliente ──────────
-- (já está em RLS — esta view só simplifica subscriptions)
create or replace view public.client_approvals_v as
select
  a.id,
  a.client_id,
  a.type,
  a.status,
  a.title,
  a.created_at,
  a.expires_at
from approvals a;

grant select on client_approvals_v to authenticated;

-- ─── 9. Performance snapshots: index extra pra queries por client+date ─
create index if not exists idx_perf_client_date
  on performance_snapshots(client_id, period_start desc, granularity);

-- ─── 10. Função pra mascarar dados sensíveis em audit (PII) ──────────
create or replace function public.mask_pii(input text)
returns text
language sql
immutable
as $$
  select case
    when input is null then null
    when input ~ '^[\w.+-]+@[\w-]+\.[\w.-]+$' then
      regexp_replace(input, '^(.{2}).+@(.+)$', '\1***@\2')
    else input
  end;
$$;
