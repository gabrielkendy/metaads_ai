#!/usr/bin/env node
// Atualiza env vars de produção via PATCH (não deleta — só corrige valores)
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "apps", "web", ".env.local");
const envText = readFileSync(envPath, "utf8");

const TOKEN = "vca_7mO9ouj8MSiPbkICVizhOkRImqHZqQRnoVa8nvnvOYV60hlnnd23MCvY";
const TEAM = "team_oB1b2tVGrA607AGMTS33HDq1";
const PROJ = "prj_9SJVGbvyGTuRI0HAVzdRKIp5Q5TG";

// Lê env vars locais
const vars = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (!m) continue;
  vars[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
vars.NEXT_PUBLIC_APP_URL = "https://base-trafego-command.vercel.app";

// Vars locais que NÃO sobem
const skip = new Set([
  "SUPABASE_PROJECT_ID",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "GITHUB_REPO",
  "NODE_ENV",
]);

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function listEnvs() {
  const r = await fetch(`https://api.vercel.com/v9/projects/${PROJ}/env?teamId=${TEAM}`, {
    headers,
  });
  const j = await r.json();
  return j.envs ?? [];
}

async function patchEnv(envId, value) {
  const r = await fetch(
    `https://api.vercel.com/v9/projects/${PROJ}/env/${envId}?teamId=${TEAM}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ value }),
    },
  );
  return { ok: r.ok, status: r.status, body: await r.text() };
}

async function deleteEnv(envId) {
  const r = await fetch(
    `https://api.vercel.com/v9/projects/${PROJ}/env/${envId}?teamId=${TEAM}`,
    { method: "DELETE", headers },
  );
  return r.ok;
}

async function createEnv(key, value, target) {
  const r = await fetch(`https://api.vercel.com/v10/projects/${PROJ}/env?teamId=${TEAM}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: [target],
    }),
  });
  return { ok: r.ok, status: r.status, body: await r.text() };
}

async function main() {
  console.log("\n🔧 Corrigindo env vars Vercel (PATCH valores limpos)\n");

  const existing = await listEnvs();
  console.log(`Total existente: ${existing.length} env vars`);

  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const [key, value] of Object.entries(vars)) {
    if (skip.has(key) || !value) {
      skipped++;
      continue;
    }
    const cleaned = value.trim();

    for (const target of ["production", "preview", "development"]) {
      const found = existing.find((e) => e.key === key && e.target.includes(target));

      if (found) {
        const r = await patchEnv(found.id, cleaned);
        if (r.ok) {
          console.log(`  ✓ PATCH ${key.padEnd(35)} (${target})`);
          fixed++;
        } else {
          console.log(
            `  ✗ PATCH ${key.padEnd(35)} (${target}) — ${r.status}: ${r.body.slice(0, 120)}`,
          );
          failed++;
        }
      } else {
        const r = await createEnv(key, cleaned, target);
        if (r.ok) {
          console.log(`  ✓ POST  ${key.padEnd(35)} (${target})`);
          fixed++;
        } else {
          console.log(
            `  ✗ POST  ${key.padEnd(35)} (${target}) — ${r.status}: ${r.body.slice(0, 120)}`,
          );
          failed++;
        }
      }
    }
  }

  console.log(`\n✅ ${fixed} atualizadas · ${failed} falharam · ${skipped} puladas\n`);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
