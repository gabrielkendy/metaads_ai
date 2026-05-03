/**
 * Seed script — popula o banco com dados de demonstração.
 * Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run db:seed
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar setadas");
  process.exit(1);
}

const sb = createClient(url, key);

const demoClients = [
  {
    slug: "just-burn",
    name: "Just Burn Club",
    industry: "fitness",
    plan: "pro",
    monthly_budget_limit: 15000,
    brand_primary_color: "#FF4D00",
    description: "Academia de alta performance em BH",
    status: "active" as const,
  },
  {
    slug: "beat-life",
    name: "Beat Life",
    industry: "supplements",
    plan: "pro",
    monthly_budget_limit: 12000,
    brand_primary_color: "#00C853",
    description: "Suplementos premium nacionais",
    status: "active" as const,
  },
  {
    slug: "manchester-burger",
    name: "Manchester Burger",
    industry: "food",
    plan: "starter",
    monthly_budget_limit: 4500,
    brand_primary_color: "#D32F2F",
    description: "Hamburgueria artesanal",
    status: "active" as const,
  },
];

async function run() {
  console.log("➜ Seedando clientes…");
  for (const client of demoClients) {
    const { data, error } = await sb
      .from("clients")
      .upsert(client, { onConflict: "slug" })
      .select()
      .single();
    if (error) {
      console.error(`Erro em ${client.slug}:`, error.message);
      continue;
    }
    console.log(`  ✓ ${data.name}`);
    await sb
      .from("agent_configs")
      .upsert({ client_id: data.id }, { onConflict: "client_id" });
  }

  console.log("\n✅ Seed concluído");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
