# 📧 Configurar Resend SMTP no Supabase — passo-a-passo

> Hoje os emails de magic link saem como `noreply@mail.app.supabase.io` (genérico). Após esse setup, vão sair como **"BASE Tráfego Command <onboarding@resend.dev>"** com sua marca.

**Tempo**: 3 minutos · **Custo**: zero (free tier Resend = 3.000 emails/mês)

---

## 🎯 Caminho exato no Supabase Dashboard (2026)

O Supabase mudou a UI recentemente. As 3 possíveis localizações da SMTP — **tente nessa ordem**:

### 📍 Caminho 1 (mais provável — UI atual)

🔗 **https://supabase.com/dashboard/project/fhjkgbjavpitkhgptbvp/auth/templates**

1. Abre o link acima
2. Na parte SUPERIOR da página tem **abas**: `Auth Hooks` · `Templates` · `URL Configuration` · **`SMTP Settings`**
3. Clica em **SMTP Settings**

### 📍 Caminho 2 (alternativa)

🔗 **https://supabase.com/dashboard/project/fhjkgbjavpitkhgptbvp/settings/auth**

1. Abre o link
2. Scroll até a seção **"SMTP Settings"** ou **"Custom SMTP"**
3. Toggle **"Enable Custom SMTP"** → ON

### 📍 Caminho 3 (se nenhum acima)

1. Sidebar esquerda: clica em **⚙ Project Settings** (ícone de engrenagem no rodapé)
2. Sub-menu: **Authentication**
3. Scroll até **SMTP Settings**

### 📍 Caminho 4 (fallback)

Se NADA disso aparecer:

1. Sidebar esquerda: clica em **🔐 Authentication** 
2. Aba secundária superior: procure **"Email"** ou **"SMTP"**
3. Pode estar dentro de **Providers → Email**

---

## ✏️ O que preencher (cola exatamente isso)

Quando achar a tela de SMTP Settings, vai ter um toggle "Enable Custom SMTP" e os campos abaixo:

| Campo | Valor pra colar |
|---|---|
| **Enable Custom SMTP** | ✅ ATIVA o toggle |
| **Sender email** | `onboarding@resend.dev` |
| **Sender name** | `BASE Tráfego Command` |
| **Host** | `smtp.resend.com` |
| **Port number** | `465` |
| **Minimum interval between emails** | `60` (segundos — opcional) |
| **Username** | `resend` |
| **Password** | `re_44mRzm3d_4ieDAt8nVR3MPyxUmwXwq2DZ` |

> ⚠️ **Atenção ao password**: cola SEM espaços. Esse é seu Resend API key.

Clica **Save** (botão verde geralmente no topo direito ou rodapé).

---

## 🧪 Testar imediatamente

### Opção A — pelo Supabase Dashboard

Algumas telas têm um botão **"Send test email"** abaixo dos campos SMTP. Se aparecer:
1. Clica
2. Digita: `contato@kendyproducoes.com.br`
3. Verifica caixa de entrada (chega em < 30s)

### Opção B — pelo seu próprio app (RECOMENDADO)

Faz login real na sua plataforma — assim você testa o fluxo end-to-end:

1. Abre **https://base-trafego-command.vercel.app/login**
2. Digita: `contato@kendyproducoes.com.br`
3. Clica **Receber link mágico**
4. Verifica email — deve chegar com:
   - **De**: `BASE Tráfego Command <onboarding@resend.dev>`  ✅ (era `noreply@mail.app.supabase.io`)
   - **Assunto**: `Seu link mágico — BASE Tráfego Command`
   - **Conteúdo**: link de magic link

5. Clica no link → cai em `/admin` logado como `super_admin` ✅

---

## ❓ Não estou achando a tela de SMTP no Supabase

### Diagnóstico rápido

Cola este link no browser (com sessão Supabase já logada):

🔗 **https://supabase.com/dashboard/project/fhjkgbjavpitkhgptbvp/settings/auth**

Aperte **Ctrl+F** e busca por: **"SMTP"**

Se a página tem essa palavra:
- Aparece o card de SMTP → segue passos acima
- Não aparece → tente **Ctrl+F** com palavra **"email"** e procura uma seção tipo "Email Provider"

### Alternativa: usar Resend padrão (sem custom SMTP)

**Se o Supabase não deixar configurar custom SMTP no plano free**, você pode:

1. Manter os emails saindo como `noreply@mail.app.supabase.io` por enquanto (funciona normal)
2. Pagar o plano **Pro do Supabase ($25/mês)** que destrava custom SMTP

Pra MVP isso não é bloqueante — é mais cosmético.

### Alternativa avançada (Resend direto sem Supabase)

Se preferir bypassar Supabase Auth + usar Resend direto via API, eu posso:
1. Trocar `signInWithOtp` por implementação custom usando Resend SDK
2. Gerar magic links manualmente + JWT
3. Validar via callback custom

→ Me avisa que faço.

---

## 🔧 Se chegar no email "errado" (Spam ou supabase)

Possíveis causas:

| Sintoma | Causa | Fix |
|---|---|---|
| Email caiu no Spam | `onboarding@resend.dev` é compartilhado | Verifica domínio próprio no Resend (passo opcional abaixo) |
| Email vem de `mail.app.supabase.io` | SMTP não foi salvo | Volta no SMTP Settings → save de novo |
| Email não chega | Resend bloqueando | Vai em https://resend.com/emails e vê logs |
| Erro "from invalid domain" | `onboarding@resend.dev` requer domínio verificado em alguns casos | Vê passo opcional |

---

## 📦 OPCIONAL — Verificar domínio próprio (`agenciabase.tech`)

Pra emails saírem com **`command@agenciabase.tech`** em vez de `onboarding@resend.dev`:

### 1. Resend Dashboard

🔗 https://resend.com/domains

1. Clica **+ Add Domain**
2. Digite: `agenciabase.tech`
3. Resend mostra **3 registros DNS** pra adicionar

### 2. Cloudflare DNS (assumindo seu domínio está no Cloudflare)

🔗 https://dash.cloudflare.com → seleciona `agenciabase.tech` → **DNS**

Pra cada um dos 3 registros que Resend mostrou:

| Tipo | Nome | Conteúdo |
|---|---|---|
| **TXT** | `agenciabase.tech` (ou `@`) | `v=spf1 include:amazonses.com ~all` (exemplo — usa o que Resend mostrou) |
| **TXT** | `resend._domainkey.agenciabase.tech` | longa string DKIM (Resend mostra) |
| **MX** | `send.agenciabase.tech` | `feedback-smtp.us-east-1.amazonses.com` priority `10` |

> **Cloudflare proxy**: deixa **DNS only** (cinza, não laranja) pra todos esses.

### 3. Volta no Resend → Verify

1. Resend → Domains → **agenciabase.tech** → **Verify DNS Records**
2. Pode demorar 5-30min pra propagar
3. Quando ficar **"Verified" verde**: pronto

### 4. Atualiza Supabase SMTP

Volta na tela de SMTP Settings (Caminho 1/2/3 acima):

| Campo | Novo valor |
|---|---|
| **Sender email** | `command@agenciabase.tech` |
| **Sender name** | `BASE Tráfego Command` |

Save → testa.

---

## ✅ Checklist final

```
☐ Resend SMTP configurado em Supabase
☐ Save deu sucesso (sem erro vermelho)
☐ Test email chegou (ou login real funcionou)
☐ Email vem com "BASE Tráfego Command" no remetente
☐ Magic link funciona end-to-end (clica → entra em /admin)
```

Se marcar tudo, **o Resend está plugado**. 🎉

---

## 🆘 Travou? Me manda print

Se nenhum dos 4 caminhos funcionar, me manda screenshot da tela atual do Supabase Dashboard (sidebar + main area) que eu te aponto onde clicar.
