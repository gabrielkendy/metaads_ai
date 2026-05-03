# 📚 Claude Desktop — Documentação master

> Tudo que você precisa pra configurar o **Agente BASE** no Claude Desktop. Os 5 documentos abaixo formam o "cérebro" do agente — quando juntos no Claude Project, ele opera autonomamente seguindo workflows, registra tudo na plataforma e mantém sync em tempo real.

---

## 🚀 Começar aqui

| Ordem | Documento | Tempo | Pra que serve |
|---|---|---|---|
| **1** | [`QUICK-START.md`](./QUICK-START.md) | 10 min | Setup passo-a-passo do Claude Desktop |
| **2** | [`SYSTEM-PROMPT.md`](./SYSTEM-PROMPT.md) | 5 min | Cole no Project Custom Instructions |
| **3** | [`WORKFLOWS.md`](./WORKFLOWS.md) | leitura | Anexa ao Project como conhecimento |
| **4** | [`TOOLS-REFERENCE.md`](./TOOLS-REFERENCE.md) | leitura | Anexa ao Project — referência das 44 tools |
| **5** | [`REALTIME.md`](./REALTIME.md) | leitura | Como funciona sync tempo real (debug) |

---

## 🎯 Filosofia

### O agente é **request-response com memória de projeto**

Você (Claude Desktop) **NÃO mantém WebSocket aberto** com Supabase. Você é invocado por turno de conversa. Isso significa:

- **Polling no início**: toda nova conversa, busca alerts ativos + approvals pendentes
- **Push pro cliente**: tudo que você registra propaga via Realtime do Supabase em < 500ms
- **Cliente final TEM** WebSocket aberto na browser dele → vê em tempo real

### Modo "Ledger" — você é o registrador

Você usa **dois MCPs em paralelo**:

1. **MCP oficial Meta** (já instalado no seu Claude Desktop) — pra TODAS as ações reais no Meta Ads (`create_campaign`, `pause_ad`, `get_insights`)
2. **MCP "base-trafego"** (nosso) — pra REGISTRAR essas ações na plataforma BASE

> **Vantagem**: zero gasto com API Anthropic. Você usa plano Max.

### Toda ação no Meta = registro na plataforma BASE

```
Você criou campanha no Meta → register_campaign na plataforma → cliente vê em < 1s
Você pausou ad no Meta      → update_ad_status                → cliente vê
Você sincronizou métricas   → record_performance_snapshot     → dashboard atualiza
Você quer avisar cliente    → send_message_to_client          → chat abre toast
```

---

## 📁 Estrutura completa dos arquivos

```
docs/claude-desktop/
├── README.md              ← este arquivo (índice)
├── QUICK-START.md         ← setup em 10 min
├── SYSTEM-PROMPT.md       ← cérebro do agente (cole no Project)
├── WORKFLOWS.md           ← 10+ fluxos detalhados
├── TOOLS-REFERENCE.md     ← manual das 44 tools
└── REALTIME.md            ← arquitetura de sync
```

---

## 🎓 Como o Claude Project deve ficar

```
┌─────────────────────────────────────────────────────────────┐
│ 📁 Claude Project: "BASE Tráfego Command"                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📝 Custom Instructions:                                     │
│     SYSTEM-PROMPT.md (conteúdo entre INÍCIO/FIM)             │
│                                                              │
│  📚 Project Knowledge (files):                               │
│     ├─ WORKFLOWS.md                                          │
│     ├─ TOOLS-REFERENCE.md                                    │
│     ├─ REALTIME.md                                           │
│     └─ ../SECURITY.md                                        │
│                                                              │
│  🔌 MCP Servers (em claude_desktop_config.json):             │
│     ├─ "meta-marketing" (oficial Meta — já tinha)            │
│     └─ "base-trafego" (nosso)                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 Como o agente "aprende" o estado dos clientes

```
┌─────────────────────────┐
│  Início de conversa     │
│  (você abre Claude)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────────┐
│  Polling automático (System Prompt manda):  │
│                                              │
│  1. list_alerts(status="active")             │
│     → "Tem 2 alertas ativos: ..."           │
│                                              │
│  2. list_pending_approvals()                 │
│     → "3 aprovações esperando decisão"      │
│                                              │
│  3. SE Kendy mencionar cliente específico:  │
│     a. get_client(slug)                      │
│     b. get_client_summary(client_id)         │
│     c. SE métricas > 1h desatualizadas:     │
│        → sync via MCP Meta + register        │
└─────────────────────────────────────────────┘
            │
            ▼
   Resposta contextualizada
```

---

## 🌊 Fluxo end-to-end típico

### Cenário: "Cria campanha pro Just Burn"

```
T+0s    Kendy: "Cria campanha de conversão pro Just Burn R$ 200/dia"

T+1s    Claude: Polling inicial
        ├─ list_alerts → ok, sem alertas
        ├─ list_pending_approvals → ok, fila limpa
        └─ get_client(slug="just-burn") → client_id

T+2s    Claude: "Vou criar 'Just Burn — Conversão Maio' R$ 200/dia.
                Budget mensal R$ 6.000, dentro do limite. Confirma?"

T+5s    Kendy: "sim"

T+6s    Claude: (MCP Meta) create_campaign → meta_campaign_id
T+8s    Claude: register_campaign na plataforma
T+8.1s  Plataforma: INSERT campaigns + Realtime broadcast
T+8.2s  Browser do Marina (cliente): toast aparece "Nova campanha 🚀"

T+9s    Claude: (MCP Meta) create_adset → meta_ad_set_id
T+10s   Claude: register_ad_set

T+12s   Claude: (MCP Meta) create_ad VAR_A → meta_ad_id
T+13s   Claude: register_ad (status pending_approval)
T+13.1s Browser Marina: novo card "JB-Conv-VarA" aparece em /criativos

T+15s   Claude: cria VAR_B + VAR_C (mesmo padrão)

T+18s   Claude: send_message_to_client(client_id, "Marina, lancei
                a campanha de conversão. 3 variações esperando aprovação.")
T+18.1s Browser Marina: chat abre + toast "Mensagem nova"

T+19s   Claude: "Pronto! Criei a campanha + 3 criativos. Marina já 
                foi avisada. Quer que eu monitore as próximas 6h e te 
                avise quando ela aprovar?"

T+20s   Kendy: "tranquilo"

T+30s   Claude (em background, próxima conversa):
        list_ads(client_id="...", status="approved") → vazio ainda
        ...

(2h depois Marina aprova os 3 criativos via dashboard)

T+2h    Realtime: ads.status mudou pra "approved"
        Marina vê confirmação na dashboard

T+2h+...Kendy abre Claude: "Ela aprovou?"
        Claude: list_ads(client_id, status="approved") → 3 ads
        Claude: "Sim, aprovou os 3 às 14:23. Quer que eu ative 
                no Meta agora?"
```

**Observação**: o ciclo todo passou pelo **menor número de bytes possível** entre Claude ↔ Plataforma. Tudo fica em < 20s pra Kendy + Marina vê em real time.

---

## 🛠️ Mantendo o conhecimento do agente atualizado

À medida que você descobre novos padrões/edge cases, **atualiza estes documentos**:

| Mudou alguma tool? | Atualiza | `TOOLS-REFERENCE.md` |
|---|---|---|
| Descobriu workflow novo? | Atualiza | `WORKFLOWS.md` |
| Comportamento padrão deve mudar? | Atualiza | `SYSTEM-PROMPT.md` |
| Realtime quebrou? | Documenta no | `REALTIME.md` |

E re-anexa no Claude Project:
1. Project → Knowledge → remove file antigo
2. Re-upload version nova
3. Próxima conversa Claude usa novo conhecimento

---

## 🧪 Testes recomendados após setup

Marca cada um quando rodar:

```
☐ list_clients retorna 3 (Just Burn, Beat Life, Manchester)
☐ get_client(slug="just-burn") retorna client_id válido
☐ link_meta_account vincula sua conta Meta real
☐ register_campaign cria entry e dispara Realtime
☐ Browser /admin mostra a campanha em < 2s
☐ send_message_to_client → mensagem aparece em /cliente/.../mensagens
☐ create_alert → admin vê toast no sino
☐ generate_report cria entry em reports
☐ /admin/agent-config carrega config do Just Burn
☐ Magic link (login) funciona com email Resend
☐ Slash command /analise-cliente client_slug=just-burn dispara workflow
```

---

## 🆘 Quando travar

1. Re-leia `QUICK-START.md` seção Troubleshooting
2. Verifica logs: `apps/mcp/logs/mcp-server.log`
3. Testa MCP isolado: `cd apps/mcp && pnpm dev` e ver se sobe
4. Re-build: `pnpm --filter @base-trafego/mcp run build`
5. Re-link Claude Desktop config

---

## 🎁 Dica final

**Crie 4 Claude Projects** (um por modo de operação):

| Projeto | Custom Instructions adicional |
|---|---|
| `BASE — Operação` | (default — `SYSTEM-PROMPT.md`) |
| `BASE — Análise profunda` | "modo analítico: 3 níveis de profundidade, benchmarks, hipóteses" |
| `BASE — Onboarding` | "modo onboarding: foque coleta de info da marca + 1ª camp teste" |
| `BASE — Crise` | "modo emergência: pause antes de ajustar, estabilize antes de otimizar" |

Em cada projeto, ANEXA todos os 5 docs (mesmos arquivos, contexto compartilhado).

---

**Bora operar! 🚀**
