# @base-trafego/mcp

MCP Server (TypeScript) que conecta o Claude Desktop à plataforma BASE Tráfego Command.

## Capabilities

- **35+ tools** divididas em: clients (5), meta_accounts (3), campaigns (7), ad_sets (4), ads (6), performance (5), alerts (3), approvals (2), reports (2)
- **8 resources** (`base://clients`, `base://client/{id}`, `base://alerts/active`, `base://approvals/pending`, `base://templates/creatives`, etc.)
- **5 prompts** pré-definidos: `analise-cliente`, `criar-campanha`, `pausar-criativos-cansados`, `relatorio-semanal`, `otimizar-orcamento`
- **Modo MOCK** quando `USE_META_MOCK=true` — permite operar a UI sem ter Meta App configurado.

## Setup local

```bash
cd apps/mcp
cp .env.example .env
# preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no mínimo

bun install
bun run build
```

## Conectar ao Claude Desktop

Edite o arquivo de config do Claude Desktop:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Adicione:

```json
{
  "mcpServers": {
    "base-trafego": {
      "command": "node",
      "args": ["C:\\caminho\\absoluto\\base-trafego-command\\apps\\mcp\\dist\\index.js"],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJ...",
        "SUPABASE_ENCRYPTION_KEY": "uma-string-de-32-bytes",
        "META_APP_ID": "",
        "META_APP_SECRET": "",
        "META_API_VERSION": "v22.0",
        "USE_META_MOCK": "true",
        "PLATFORM_URL": "http://localhost:3000",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

Reinicie o Claude Desktop e digite `/` numa nova conversa — você verá `analise-cliente`, `criar-campanha`, etc. listados.

## Dev mode (sem buildar)

```bash
bun run dev
```

## Logs

Tudo é gravado em `./logs/mcp-server.log` e também em stderr (visível no Claude Desktop devtools).
