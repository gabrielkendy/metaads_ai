#!/usr/bin/env node
// Robusto: adiciona TODAS as env vars no Vercel (production + preview + development)
import { execSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cwd = join(root, "apps", "web");

// Lê .env.local
const envPath = join(cwd, ".env.local");
const envText = readFileSync(envPath, "utf8");
const vars = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (!m) continue;
  vars[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}

// Vars locais que NÃO vão pra Vercel
const skip = new Set([
  "SUPABASE_PROJECT_ID",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "GITHUB_REPO",
  "NODE_ENV",
]);

// Adiciona NEXT_PUBLIC_APP_URL com domínio Vercel (será atualizado depois do primeiro deploy)
vars["NEXT_PUBLIC_APP_URL"] = "https://base-trafego-command.vercel.app";

const ENVS = ["production", "preview", "development"];

function runAddVar(key, value, env) {
  return new Promise((resolve) => {
    const proc = spawn("vercel", ["env", "add", key, env], {
      cwd,
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    proc.stdout.on("data", (d) => {
      out += d.toString();
    });
    proc.stderr.on("data", (d) => {
      out += d.toString();
    });
    proc.stdin.write(`${value}\n`);
    proc.stdin.end();
    proc.on("close", (code) => {
      const success = code === 0 || out.includes("Added Environment Variable");
      const exists = out.includes("already exists");
      resolve({ success, exists, out });
    });
  });
}

function runRm(key, env) {
  return new Promise((resolve) => {
    const proc = spawn("vercel", ["env", "rm", key, env, "-y"], {
      cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    proc.stdout.on("data", (d) => {
      out += d.toString();
    });
    proc.stderr.on("data", (d) => {
      out += d.toString();
    });
    proc.on("close", () => resolve(out));
  });
}

async function main() {
  console.log("\n🚀 Sincronizando env vars com Vercel\n");
  let total = 0;
  let failed = 0;

  for (const [key, value] of Object.entries(vars)) {
    if (skip.has(key)) continue;
    if (!value) continue;
    for (const env of ENVS) {
      total++;
      // Remove existente (silencioso)
      await runRm(key, env);
      const r = await runAddVar(key, value, env);
      if (r.success) {
        console.log(`  ✓ ${key.padEnd(35)} (${env})`);
      } else {
        failed++;
        console.log(`  ✗ ${key.padEnd(35)} (${env}) — ${r.out.slice(0, 80)}`);
      }
    }
  }

  console.log(`\n✅ ${total - failed}/${total} env vars configuradas\n`);
  console.log("Listando...\n");
  console.log(execSync("vercel env ls", { cwd, encoding: "utf8" }));
}

main().catch((e) => {
  console.error("❌ Erro fatal:", e);
  process.exit(1);
});
