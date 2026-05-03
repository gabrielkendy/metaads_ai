-- ════════════════════════════════════════════════════════════════════
-- Storage Buckets + Policies
-- ════════════════════════════════════════════════════════════════════

-- Buckets
insert into storage.buckets (id, name, public)
values
  ('creatives', 'creatives', true),
  ('reports', 'reports', false),
  ('avatars', 'avatars', true),
  ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

-- Public read em buckets públicos
drop policy if exists "Public read public buckets" on storage.objects;
create policy "Public read public buckets" on storage.objects
  for select
  using (bucket_id in ('creatives', 'avatars', 'client-logos'));

-- Authenticated upload em todos buckets (com check de path por user)
drop policy if exists "Authenticated upload" on storage.objects;
create policy "Authenticated upload" on storage.objects
  for insert
  with check (auth.role() = 'authenticated');

-- Authenticated update própria pasta
drop policy if exists "Authenticated update own files" on storage.objects;
create policy "Authenticated update own files" on storage.objects
  for update
  using (auth.uid()::text = (storage.foldername(name))[1])
  with check (auth.uid()::text = (storage.foldername(name))[1]);

-- Admins lêem reports
drop policy if exists "Admins read reports" on storage.objects;
create policy "Admins read reports" on storage.objects
  for select
  using (
    bucket_id = 'reports'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin')
    )
  );

-- Clients lêem reports do próprio client_id (path: <client_id>/<file>)
drop policy if exists "Clients read own reports" on storage.objects;
create policy "Clients read own reports" on storage.objects
  for select
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] in (
      select client_id::text from public.client_users where user_id = auth.uid()
    )
  );
