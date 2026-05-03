-- ════════════════════════════════════════════════════════════════════
-- Realtime Publication — habilita push pra dashboards (idempotente)
-- ════════════════════════════════════════════════════════════════════

-- Cria publication se não existir
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Helper idempotente: adiciona tabela apenas se ainda não estiver na publication
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'alerts',
      'approvals',
      'claude_actions',
      'performance_snapshots',
      'ads',
      'notifications',
      'messages',
      'audit_logs'
    ])
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- replica identity full pra mandar payload completo via Realtime
alter table public.alerts replica identity full;
alter table public.approvals replica identity full;
alter table public.claude_actions replica identity full;
alter table public.ads replica identity full;
alter table public.notifications replica identity full;
alter table public.messages replica identity full;
