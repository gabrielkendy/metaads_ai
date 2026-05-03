import Link from "next/link";
import { ArrowRight, Bot, Shield, Activity, Zap, BarChart3 } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";

export default function LandingPage() {
  return (
    <div className="relative">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_4px_16px_rgba(61,90,254,0.4)]">
              <span className="font-mono font-bold text-sm text-white">B</span>
            </div>
            <span className="font-semibold">BASE Tráfego Command</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-body-sm text-text-tertiary">
            <Link href="/demo" className="hover:text-text-primary transition-colors">
              Demo
            </Link>
            <Link href="/pricing" className="hover:text-text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">
              Entrar
            </Link>
            <Link href="/demo">
              <GlassButton size="sm">Ver demo</GlassButton>
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative pt-40 pb-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <StatusPill variant="info" pulse className="mb-6">
            v1.0 — Operando ao vivo
          </StatusPill>
          <h1 className="text-display-md sm:text-display-lg max-w-4xl mx-auto">
            Meta Ads operados pela <span className="text-brand-500">IA</span>.<br />
            Você decide. Claude executa.
          </h1>
          <p className="mt-6 text-body-lg text-text-secondary max-w-2xl mx-auto">
            Mini-SaaS multi-tenant que conecta o Claude Desktop à plataforma da sua agência. Tudo
            com aprovação manual, auditoria completa e dashboards white-label pro cliente.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/demo">
              <GlassButton size="lg">
                Ver demo interativa
                <ArrowRight className="w-4 h-4" />
              </GlassButton>
            </Link>
            <Link href="/login">
              <GlassButton size="lg" variant="glass">
                Entrar
              </GlassButton>
            </Link>
            <Link href="/pricing">
              <GlassButton size="lg" variant="ghost">
                Pricing
              </GlassButton>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-8 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Bot,
              title: "Claude Desktop integrado",
              desc: "MCP server expõe 35+ tools. Você conversa, Claude executa Meta Ads.",
            },
            {
              icon: Shield,
              title: "Aprovação obrigatória",
              desc: "Ações de alto impacto exigem 1 clique seu. Zero risco de Claude estourar orçamento.",
            },
            {
              icon: Activity,
              title: "Realtime para cliente",
              desc: "Dashboard white-label do cliente atualiza em tempo real conforme operações rolam.",
            },
            {
              icon: Zap,
              title: "Anomaly detection",
              desc: "Cron detecta CTR caindo, fadiga, CPM alto — cria alertas proativos.",
            },
            {
              icon: BarChart3,
              title: "Relatórios automáticos",
              desc: "Semanal, mensal, executivo — gerados pelo agente IA, prontos pro cliente.",
            },
            {
              icon: Bot,
              title: "Auditoria completa",
              desc: "Cada ação Claude → Meta API fica logada. Compliance LGPD pronto.",
            },
          ].map((f) => (
            <GlassCard key={f.title} className="p-6" hoverable>
              <f.icon className="w-5 h-5 text-brand-500 mb-3" strokeWidth={1.75} />
              <h3 className="text-h4 mb-1">{f.title}</h3>
              <p className="text-body-sm text-text-secondary">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <footer className="border-t border-border-subtle py-10 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm text-text-tertiary">
          <div>© {new Date().getFullYear()} Agência BASE — todos os direitos reservados.</div>
          <nav className="flex items-center gap-5">
            <Link href="/pricing" className="hover:text-text-primary">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-text-primary">
              Privacidade
            </Link>
            <Link href="/terms" className="hover:text-text-primary">
              Termos
            </Link>
            <Link href="/lgpd" className="hover:text-text-primary">
              LGPD
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
