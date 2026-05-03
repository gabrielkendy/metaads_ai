#!/usr/bin/env bash
# Sobe todas env vars pra Vercel (production + preview + development)
set -e

cd "$(dirname "$0")/../apps/web"

# Lê pares KEY=VALUE do .env.local (apenas linhas válidas)
declare -A vars
while IFS='=' read -r key value; do
  # ignora comentário, linha vazia, quebrada
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  # Remove aspas se houver
  value="${value%\"}"
  value="${value#\"}"
  # Pula vars não-Vercel (locais)
  case "$key" in
    SUPABASE_PROJECT_ID|SUPABASE_PUBLISHABLE_KEY|SUPABASE_DB_PASSWORD|GITHUB_REPO|NODE_ENV)
      continue
      ;;
  esac
  vars["$key"]="$value"
done < .env.local

# Pra cada var e env, faz add (CLI sobrescreve se existir)
for key in "${!vars[@]}"; do
  value="${vars[$key]}"
  for env in production preview development; do
    # remove primeiro pra evitar duplicate
    echo "y" | vercel env rm "$key" "$env" >/dev/null 2>&1 || true
    # adiciona
    echo "$value" | vercel env add "$key" "$env" >/dev/null 2>&1
    echo "  ✓ $key ($env)"
  done
done

# Atualiza NEXT_PUBLIC_APP_URL pra production URL final
echo "https://base-trafego-command.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production >/dev/null 2>&1 || true

echo ""
echo "Env vars finais:"
vercel env ls 2>&1 | grep -E "^ \w" | head -30
