-- ════════════════════════════════════════════════════════════════════
-- RESET COMPLETO + REAPLICAR SCHEMA
-- ════════════════════════════════════════════════════════════════════
-- Use este arquivo se a primeira tentativa do SCHEMA-CONSOLIDADO.sql
-- falhou no meio (deixando tabelas órfãs).
--
-- O que faz:
--   1. Dropa TUDO do schema public (tabelas, types, funções)
--   2. Mantém auth.* intacto (users continuam)
--   3. Você cola este arquivo, RUN, e fim
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. RESET ───────────────────────────────────────────────────────
-- Dropa todas tabelas/views/funções do schema public
do $$
declare
  r record;
begin
  -- triggers em auth.users
  drop trigger if exists on_auth_user_created on auth.users;

  -- views
  for r in (
    select viewname from pg_views where schemaname = 'public'
  ) loop
    execute format('drop view if exists public.%I cascade', r.viewname);
  end loop;

  -- tabelas (cascata pega FKs)
  for r in (
    select tablename from pg_tables where schemaname = 'public'
  ) loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;

  -- funções
  for r in (
    select proname, oidvectortypes(proargtypes) as args
    from pg_proc
    where pronamespace = (select oid from pg_namespace where nspname = 'public')
  ) loop
    begin
      execute format('drop function if exists public.%I(%s) cascade', r.proname, r.args);
    exception when others then null;
    end;
  end loop;

  -- types/enums
  for r in (
    select typname from pg_type
    where typnamespace = (select oid from pg_namespace where nspname = 'public')
    and typtype = 'e'
  ) loop
    execute format('drop type if exists public.%I cascade', r.typname);
  end loop;
end $$;

-- ─── 2. AGORA cole TODO o SCHEMA-CONSOLIDADO.sql logo abaixo ────────
-- ─── (copie de supabase/SCHEMA-CONSOLIDADO.sql)                ──────
--
-- OU mais simples: rode este RESET primeiro (clica RUN),
--                  depois rode SCHEMA-CONSOLIDADO.sql separadamente.
