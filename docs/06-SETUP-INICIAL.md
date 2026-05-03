# 🚀 SETUP INICIAL — BASE TRÁFEGO COMMAND

> Passo a passo de configuração do ambiente
> Tempo estimado: 2-3 horas

---

## 0. PRÉ-REQUISITOS

### 0.1 Software Local (instala primeiro)

```bash
# Node.js 20 LTS (ou 22)
# Se tiver nvm: nvm install 22 && nvm use 22

# Bun (package manager + runtime mais rápido)
curl -fsSL https://bun.sh/install | bash
# Windows: powershell -c "irm bun.sh/install.ps1 | iex"

# Git
# Já tem ✅

# pnpm como fallback (opcional)
npm install -g pnpm
```

### 0.2 Editor

```
✅ Cursor (recomendado)
✅ Claude Code instalado no Cursor
✅ Extensão Tailwind CSS IntelliSense
✅ Extensão Biome (formatter + linter)
✅ Extensão Prisma (se usar)
```

### 0.3 Contas Necessárias

```
☐ Supabase     → supabase.com (free tier ok pra começar)
☐ Vercel       → vercel.com (já tem)
☐ Meta Business→ developers.facebook.com (cria App Dev)
☐ Anthropic    → console.anthropic.com (API key)
☐ GitHub       → já tem
☐ Resend       → resend.com (envio de email)
☐ Sentry       → sentry.io (errors)
☐ PostHog      → posthog.com (analytics)
```

---

## 1. CRIAR REPOSITÓRIO GITHUB

```bash
# No GitHub, cria repo: base-trafego-command (private)
# Clone localmente:

cd ~/Downloads
git clone https://github.com/gabrielkendy/base-trafego-command.git
cd base-trafego-command

# Adiciona estrutura inicial
mkdir -p apps packages docs

# .gitignore raiz
cat > .gitignore <<EOF
# Dependencies
node_modules/
.pnp
.pnp.js
.yarn/

# Build
.next/
out/
build/
dist/

# Env
.env
.env.local
.env*.local
.env.production

# Logs
logs/
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Misc
.turbo/
.vercel/
EOF

git add .
git commit -m "chore: initial structure"
git push origin main
```

---

## 2. SETUP MONOREPO (Turborepo)

```bash
# Cria estrutura monorepo
bun init -y

# Edita package.json raiz:
cat > package.json <<EOF
{
  "name": "base-trafego-command",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check",
    "db:types": "turbo db:types"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "@biomejs/biome": "^1.9.0",
    "typescript": "^5.5.0"
  },
  "packageManager": "bun@1.1.30",
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
EOF

# Cria turbo.json
cat > turbo.json <<EOF
{
  "\$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
EOF

# Configuração do Biome (linter + formatter unificado)
cat > biome.json <<EOF
{
  "\$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["node_modules", ".next", "dist", "build"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "off"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  }
}
EOF

bun install
```

---

## 3. CRIAR APP NEXT.JS (apps/web)

```bash
cd apps
bunx create-next-app@latest web \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint  # vamos usar Biome no monorepo

cd web
```

### 3.1 Instalar dependências core

```bash
cd apps/web

# Supabase
bun add @supabase/supabase-js @supabase/ssr

# UI
bun add framer-motion lucide-react sonner
bun add @radix-ui/react-avatar @radix-ui/react-dialog
bun add @radix-ui/react-dropdown-menu @radix-ui/react-label
bun add @radix-ui/react-popover @radix-ui/react-scroll-area
bun add @radix-ui/react-select @radix-ui/react-separator
bun add @radix-ui/react-slot @radix-ui/react-switch
bun add @radix-ui/react-tabs @radix-ui/react-toast
bun add @radix-ui/react-tooltip
bun add class-variance-authority clsx tailwind-merge

# Forms
bun add react-hook-form @hookform/resolvers zod

# Data fetching / state
bun add @tanstack/react-query

# Charts
bun add recharts

# Utils
bun add date-fns nuqs

# Dev
bun add -d @types/node @types/react @types/react-dom
```

### 3.2 Inicializar shadcn/ui

```bash
bunx shadcn@latest init

# Responda:
# Style: New York
# Base color: Zinc
# CSS variables: yes

# Adicionar componentes principais:
bunx shadcn@latest add button card input label
bunx shadcn@latest add dialog dropdown-menu select
bunx shadcn@latest add tabs sheet sonner skeleton
bunx shadcn@latest add table badge separator
bunx shadcn@latest add avatar tooltip popover
bunx shadcn@latest add form switch
```

### 3.3 Configurar Tailwind v4 (CSS Variables)

Substitui `apps/web/src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-bg-deepest: #050505;
  --color-bg-base: #0a0a0b;
  --color-bg-surface: #111113;
  --color-bg-elevated: #1a1a1d;
  --color-bg-overlay: #222226;
  
  /* Glass */
  --color-glass-thin: rgba(255, 255, 255, 0.02);
  --color-glass-light: rgba(255, 255, 255, 0.04);
  --color-glass-medium: rgba(255, 255, 255, 0.06);
  --color-glass-heavy: rgba(255, 255, 255, 0.08);
  
  /* Borders */
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-border-default: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.12);
  
  /* Text */
  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-text-tertiary: #71717a;
  --color-text-muted: #52525b;
  --color-text-disabled: #3f3f46;
  
  /* Brand */
  --color-brand-50: #eef1ff;
  --color-brand-500: #3d5afe;
  --color-brand-600: #2e47db;
  --color-brand-glow: rgba(61, 90, 254, 0.4);
  
  /* Semantic */
  --color-success-text: #4ade80;
  --color-warning-text: #fbbf24;
  --color-danger-text: #f87171;
  --color-info-text: #38bdf8;
  
  /* Fonts */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Geist Mono", "JetBrains Mono", monospace;
  --font-display: "Fraunces", "Inter", serif;
  
  /* Easings */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-back-out: cubic-bezier(0.34, 1.56, 0.64, 1);
}

* {
  border-color: var(--color-border-default);
}

html {
  background: var(--color-bg-base);
  color-scheme: dark;
}

body {
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-feature-settings: "ss01", "cv11";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-base);
}

::-webkit-scrollbar-thumb {
  background: var(--color-glass-medium);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-glass-heavy);
}

/* Selection */
::selection {
  background: var(--color-brand-500);
  color: white;
}

/* Focus visible */
*:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Animations */
@keyframes beam-rotate {
  to { transform: rotate(360deg); }
}

@keyframes pulse-soft {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-10px) translateX(10px); }
  66% { transform: translateY(10px) translateX(-10px); }
}

/* Utilities */
.font-mono-tabular {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.glass-card {
  background: var(--color-glass-light);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-default);
  border-radius: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 3.4 Configurar fonts

```tsx
// apps/web/src/app/layout.tsx
import { Inter, Fraunces } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${fraunces.variable} ${GeistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

```bash
# Instala Geist Mono
bun add geist
```

---

## 4. SETUP SUPABASE

### 4.1 Criar projeto

```
1. Vai em supabase.com → New Project
2. Nome: base-trafego-command
3. DB Password: [GERA E GUARDA NO 1PASSWORD]
4. Region: South America (São Paulo)
5. Plan: Free (depois Pro quando for produção)
6. Espera ~2 min criar
```

### 4.2 Rodar migrations

```bash
# Instalar Supabase CLI
brew install supabase/tap/supabase
# ou: scoop install supabase no Windows

# Login
supabase login

# Link com o projeto
cd apps/web
supabase init
supabase link --project-ref <seu-project-ref>

# Cria migration inicial
supabase migration new initial_schema

# Cole o SCHEMA-DATABASE.sql em:
# supabase/migrations/[timestamp]_initial_schema.sql

# Aplica
supabase db push
```

### 4.3 Configurar Auth providers

```
Dashboard Supabase → Authentication → Providers:

✅ Email:
   - Enable Email provider
   - Confirm email: ON
   - Magic link: ON
   - Custom SMTP (depois): Resend integration

✅ Google OAuth:
   - Habilita
   - Adiciona Client ID e Secret (Google Cloud Console)
   
✅ Site URL:
   - http://localhost:3000 (dev)
   - https://command.agenciabase.tech (prod)
   
✅ Redirect URLs:
   - http://localhost:3000/auth/callback
   - https://command.agenciabase.tech/auth/callback
```

### 4.4 Habilitar Realtime

```
Dashboard → Database → Replication:

Habilitar nas tabelas:
☑ alerts
☑ approvals
☑ claude_actions
☑ performance_snapshots
☑ ads
☑ notifications
☑ messages
```

### 4.5 Criar Storage Buckets

```bash
# Via SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('creatives', 'creatives', true),
  ('reports', 'reports', false),
  ('avatars', 'avatars', true),
  ('client-logos', 'client-logos', true);

-- Policies pra public buckets:
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
  USING (bucket_id IN ('creatives', 'avatars', 'client-logos'));

-- Authenticated upload:
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### 4.6 Gerar tipos TypeScript

```bash
# No diretório apps/web:
supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

### 4.7 Configurar env vars

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx  # nunca commitar!

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# Meta (depois)
META_APP_ID=
META_APP_SECRET=

# Resend (email)
RESEND_API_KEY=

# Sentry (depois)
SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. CRIAR MCP SERVER (apps/mcp)

```bash
cd apps
mkdir mcp && cd mcp

# package.json
cat > package.json <<EOF
{
  "name": "@base-trafego/mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "base-trafego-mcp": "./dist/index.js"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "@supabase/supabase-js": "^2.45.0",
    "facebook-nodejs-business-sdk": "^22.0.0",
    "zod": "^3.23.0",
    "winston": "^3.11.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0"
  }
}
EOF

# tsconfig.json
cat > tsconfig.json <<EOF
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "declaration": false,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

bun install

# Estrutura de pastas
mkdir -p src/{config,lib,tools,resources,prompts,schemas}
```

---

## 6. CONFIGURAR META BUSINESS APP

### 6.1 Criar App

```
1. developers.facebook.com → My Apps → Create App
2. Type: Business
3. Name: BASE Trafego Command
4. Use Case: Marketing API
5. Cria
```

### 6.2 Configurar Marketing API

```
App Dashboard → Add Product → Marketing API → Set Up

Permissões necessárias:
☑ ads_management
☑ ads_read
☑ business_management
☑ pages_read_engagement
☑ instagram_basic
☑ instagram_content_publish

Business Verification:
- Será necessário verificar a empresa pra app go live
- Pode usar app em modo dev até 5 contas Meta
```

### 6.3 Pegar credentials

```
Settings → Basic:
- App ID: [copia]
- App Secret: [copia, mostra só uma vez]

App Token (server-server):
- Tools → Access Token Tool
- Generate: para a Agência BASE
- Scope: ads_management, ads_read, business_management
```

---

## 7. CONFIGURAR VERCEL

### 7.1 Conectar repo

```
1. vercel.com/new
2. Import Git Repository → seleciona base-trafego-command
3. Framework: Next.js (auto-detect)
4. Root Directory: apps/web
5. Build Command: cd ../.. && bun install && bun run build --filter=web
6. Output: apps/web/.next
```

### 7.2 Env Vars

Adiciona no Vercel Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
META_APP_ID=
META_APP_SECRET=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
SENTRY_DSN=
```

### 7.3 Custom Domain

```
Vercel → Project → Settings → Domains:
Add: command.agenciabase.tech

Cloudflare:
Add CNAME: command → cname.vercel-dns.com (Somente DNS)
```

---

## 8. SETUP CLAUDE DESKTOP

### 8.1 Build do MCP Server

```bash
cd apps/mcp
bun run build
```

### 8.2 Configurar Claude Desktop

Edita `claude_desktop_config.json`:

```
macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
Windows: %APPDATA%\Claude\claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "base-trafego": {
      "command": "node",
      "args": [
        "/CAMINHO/ABSOLUTO/base-trafego-command/apps/mcp/dist/index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJxxx",
        "META_APP_ID": "xxx",
        "META_APP_SECRET": "xxx",
        "META_API_VERSION": "v22.0",
        "ANTHROPIC_API_KEY": "sk-ant-xxx",
        "PLATFORM_URL": "https://command.agenciabase.tech",
        "PLATFORM_WEBHOOK_SECRET": "xxx",
        "LOG_LEVEL": "info",
        "LOG_PATH": "/CAMINHO/ABSOLUTO/logs/mcp-server.log"
      }
    }
  }
}
```

### 8.3 Testar

```
1. Reinicia Claude Desktop
2. Cria uma nova conversa
3. Verifica se aparece "🔌 base-trafego" no menu
4. Pede: "Lista os clientes da agência"
5. Claude deve chamar tool list_clients
```

---

## 9. CHECKLIST DE PRONTIDÃO PRA EXECUÇÃO

```
INFRAESTRUTURA
☐ Repo GitHub criado
☐ Monorepo com Turbo configurado
☐ Vercel conectado
☐ Supabase projeto criado e schema aplicado
☐ Storage buckets criados
☐ Realtime habilitado nas tabelas
☐ Auth providers configurados

APLICAÇÃO
☐ apps/web Next.js criado
☐ Tailwind v4 configurado
☐ Fonts importadas
☐ shadcn/ui instalado
☐ Componentes base instalados
☐ Tipos do Supabase gerados

MCP SERVER
☐ apps/mcp criado
☐ Dependências instaladas
☐ Estrutura de pastas montada
☐ Build funcionando
☐ Claude Desktop conectado

INTEGRAÇÕES
☐ Meta Business App criado
☐ Credentials guardados
☐ Resend configurado (futuro)
☐ Sentry configurado (futuro)

DOMAIN
☐ command.agenciabase.tech apontando pra Vercel
☐ SSL ativo

SEGURANÇA
☐ Service role key NUNCA commitada
☐ Env vars no Vercel seguras
☐ RLS habilitado em todas tabelas
```

---

## 10. PRIMEIROS PASSOS APÓS SETUP

```
1. Criar conta admin no Supabase Auth (manualmente):
   - Authentication → Users → Add user
   - Email: kendy@agenciabase.tech
   - SQL: UPDATE profiles SET role='super_admin' WHERE email='kendy@agenciabase.tech';

2. Rodar dev server:
   - cd apps/web && bun run dev

3. Acessar http://localhost:3000

4. Continuar com PROMPT-CURSOR-MASTER.md (próximo passo)
```

---

> **Próximo:** `07-PROMPT-CURSOR-MASTER.md` (prompt mestre pra Cursor executar todo o desenvolvimento)
