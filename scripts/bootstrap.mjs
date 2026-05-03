#!/usr/bin/env node
/**
 * BOOTSTRAP automático pós-schema.
 *
 * Pré-requisito: cole supabase/SCHEMA-CONSOLIDADO.sql no SQL Editor do Supabase.
 * Depois rode: node scripts/bootstrap.mjs
 *
 * O que esse script faz:
 *  1. Verifica que as tabelas existem
 *  2. Cria conta super_admin Kendy via auth.admin
 *  3. Insere 3 clientes demo (Just Burn, Beat Life, Manchester Burger)
 *  4. Cria agent_configs pros 3
 *  5. Configura redirect URLs do auth (manual via dashboard depois)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lê env
const envPath = join(__dirname, "..", "apps", "web", ".env.local");
const envText = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "contato@kendyproducoes.com.br";
const ADMIN_NAME = process.env.ADMIN_NAME || "Kendy";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("❌ env vars faltando em apps/web/.env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const log = (...args) => console.log("·", ...args);
const ok = (...args) => console.log("✅", ...args);
const fail = (...args) => console.log("❌", ...args);

async function main() {
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("   BASE TRAFEGO COMMAND - Bootstrap");
  console.log("════════════════════════════════════════════════════════════════\n");

  // 1. Verifica que schema foi aplicado
  log("Verificando schema...");
  const { data: tableCheck, error: tableErr } = await sb
    .from("clients")
    .select("id", { count: "exact", head: true });

  if (tableErr) {
    fail("Tabela 'clients' não encontrada.");
    console.log("\n┌─────────────────────────────────────────────────────────────┐");
    console.log("│ AÇÃO NECESSÁRIA:                                            │");
    console.log("│                                                             │");
    console.log("│ 1. Vá em: https://supabase.com/dashboard/project/" + env.SUPABASE_PROJECT_ID);
    console.log("│ 2. SQL Editor → New Query                                   │");
    console.log("│ 3. Cole TODO o conteúdo de:                                 │");
    console.log("│    supabase/SCHEMA-CONSOLIDADO.sql                          │");
    console.log("│ 4. Clica RUN                                                │");
    console.log("│ 5. Espera ~5s                                               │");
    console.log("│ 6. Volta aqui e roda: node scripts/bootstrap.mjs            │");
    console.log("└─────────────────────────────────────────────────────────────┘\n");
    process.exit(1);
  }
  ok("Schema aplicado.");

  // 2. Cria/garante usuário admin
  log(`Garantindo conta admin: ${ADMIN_EMAIL}`);
  let adminId;

  // Tenta listar primeiro
  const { data: existingUsers } = await sb.auth.admin.listUsers({ perPage: 200 });
  const existing = existingUsers?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (existing) {
    ok(`Admin já existe: ${existing.id}`);
    adminId = existing.id;
  } else {
    const { data: newUser, error: createErr } = await sb.auth.admin.createUser({
      email: ADMIN_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    if (createErr) {
      fail("Erro criando admin:", createErr.message);
      process.exit(1);
    }
    ok(`Admin criado: ${newUser.user.id}`);
    adminId = newUser.user.id;
  }

  // 3. Atualiza profile pra super_admin
  log("Promovendo a super_admin...");
  const { error: profileErr } = await sb
    .from("profiles")
    .upsert(
      {
        id: adminId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: "super_admin",
        is_active: true,
      },
      { onConflict: "id" },
    );
  if (profileErr) {
    fail("Erro promovendo profile:", profileErr.message);
  } else {
    ok("Profile = super_admin");
  }

  // 4. Insere 3 clientes demo
  log("Inserindo 3 clientes demo...");
  const clients = [
    {
      slug: "just-burn",
      name: "Just Burn Club",
      legal_name: "Just Burn Club LTDA",
      industry: "fitness",
      plan: "pro",
      status: "active",
      monthly_budget_limit: 15000,
      brand_primary_color: "#FF4D00",
      description: "Academia de alta performance em Belo Horizonte",
      requires_approval_above: 1500,
    },
    {
      slug: "beat-life",
      name: "Beat Life",
      legal_name: "Beat Life Suplementos LTDA",
      industry: "supplements",
      plan: "pro",
      status: "active",
      monthly_budget_limit: 12000,
      brand_primary_color: "#00C853",
      description: "Suplementos premium nacionais",
    },
    {
      slug: "manchester-burger",
      name: "Manchester Burger",
      legal_name: "Manchester Hamburgueria LTDA",
      industry: "food",
      plan: "starter",
      status: "active",
      monthly_budget_limit: 4500,
      brand_primary_color: "#D32F2F",
      description: "Hamburgueria artesanal",
    },
  ];

  for (const c of clients) {
    const { data: existing } = await sb
      .from("clients")
      .select("id")
      .eq("slug", c.slug)
      .maybeSingle();

    if (existing) {
      const { error } = await sb.from("clients").update(c).eq("id", existing.id);
      if (error) fail(`Erro atualizando ${c.slug}:`, error.message);
      else ok(`Cliente atualizado: ${c.name}`);
    } else {
      const { data, error } = await sb.from("clients").insert(c).select().single();
      if (error) {
        fail(`Erro criando ${c.slug}:`, error.message);
        continue;
      }
      ok(`Cliente criado: ${c.name} (${data.id})`);
      // agent_config inicial
      await sb.from("agent_configs").insert({ client_id: data.id });
    }
  }

  // 5. Resumo final
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("   ✅ BOOTSTRAP COMPLETO");
  console.log("════════════════════════════════════════════════════════════════");
  console.log("");
  console.log("→ Admin:        " + ADMIN_EMAIL + " (super_admin)");
  console.log("→ Clientes:     3 ativos");
  console.log("→ Próximo:      cd apps/web && pnpm dev → abrir http://localhost:3000/login");
  console.log("");
  console.log("Lembretes (configurar no Dashboard Supabase):");
  console.log("  Authentication → URL Configuration:");
  console.log("    Site URL: http://localhost:3000");
  console.log("    Redirect URLs:");
  console.log("      http://localhost:3000/auth/callback");
  console.log("      https://command.agenciabase.tech/auth/callback");
  console.log("  Authentication → Providers → Email: Magic Link ON");
  console.log("");
  console.log("Pra emails saírem com a marca BASE (em vez de noreply@supabase.io):");
  console.log("  Authentication → SMTP Settings:");
  console.log("    Host: smtp.resend.com");
  console.log("    Port: 465");
  console.log("    User: resend");
  console.log("    Pass: " + (env.RESEND_API_KEY || "<RESEND_API_KEY>"));
  console.log("    Sender: " + (env.RESEND_FROM_EMAIL || "onboarding@resend.dev"));
  console.log("");
}

main().catch((e) => {
  console.error("\n❌ Erro fatal:", e);
  process.exit(1);
});
