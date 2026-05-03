-- ════════════════════════════════════════════════════════════════════
-- SEED DATA — apenas dev/staging
-- Cria 3 clientes mockados pra testar UI sem Meta API
-- ════════════════════════════════════════════════════════════════════

-- Demo client 1: Just Burn Club
insert into clients (slug, name, legal_name, industry, status, plan, monthly_budget_limit, brand_primary_color, description)
values ('just-burn', 'Just Burn Club', 'Just Burn Club LTDA', 'fitness', 'active', 'pro', 15000, '#FF4D00', 'Academia de alta performance em BH')
on conflict (slug) do update set name = excluded.name, status = excluded.status, plan = excluded.plan;

-- Demo client 2: Beat Life
insert into clients (slug, name, legal_name, industry, status, plan, monthly_budget_limit, brand_primary_color, description)
values ('beat-life', 'Beat Life', 'Beat Life Suplementos LTDA', 'supplements', 'active', 'pro', 12000, '#00C853', 'Suplementos premium nacionais')
on conflict (slug) do update set name = excluded.name, status = excluded.status;

-- Demo client 3: Manchester Burger
insert into clients (slug, name, legal_name, industry, status, plan, monthly_budget_limit, brand_primary_color, description)
values ('manchester-burger', 'Manchester Burger', 'Manchester Hamburgueria LTDA', 'food', 'active', 'starter', 4500, '#D32F2F', 'Hamburgueria artesanal')
on conflict (slug) do update set name = excluded.name, status = excluded.status;

-- Demo claude action (pra UI ter algo no feed)
do $$
declare
  v_client_id uuid;
begin
  select id into v_client_id from clients where slug = 'just-burn' limit 1;
  if v_client_id is not null then
    insert into claude_actions (client_id, action_type, status, tool_name, input_payload, reasoning)
    values
      (v_client_id, 'sync_meta_data', 'success', 'sync_meta_account',
        '{"force": true}'::jsonb, 'Sync inicial pós-onboarding'),
      (v_client_id, 'create_campaign', 'success', 'create_campaign',
        '{"name": "Campanha Conversão Mulheres 25-45 BH"}'::jsonb,
        'Cliente solicitou nova campanha focada em conversão')
    on conflict do nothing;
  end if;
end $$;
