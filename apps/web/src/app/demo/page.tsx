import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Activity,
  FileBarChart2,
  ImageIcon,
  Wallet,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";

export const metadata: Metadata = {
  title: "Demo — Dashboard interativo",
  description: "Veja todas as telas do BASE Tráfego Command com dados mockados.",
};

const ADMIN = [
  {
    href: "/demo/admin",
    icon: LayoutDashboard,
    title: "Dashboard Admin",
    desc: "Visão geral com métricas, alertas, aprovações e feed Claude ao vivo.",
  },
  {
    href: "/demo/admin/clients",
    icon: Users,
    title: "Clientes",
    desc: "Lista grid com cards visuais de cada conta da agência.",
  },
  {
    href: "/demo/admin/approvals",
    icon: ShieldCheck,
    title: "Aprovações",
    desc: "Fila de ações Claude aguardando OK do admin.",
  },
  {
    href: "/demo/admin/audit",
    icon: Activity,
    title: "Auditoria",
    desc: "Tabela com TODA ação do sistema.",
  },
  {
    href: "/demo/admin/reports",
    icon: FileBarChart2,
    title: "Relatórios",
    desc: "Histórico de relatórios gerados (PDF, CSV, web link).",
  },
];

const CLIENT = [
  {
    href: "/demo/cliente/just-burn",
    icon: LayoutDashboard,
    title: "Cliente — Visão Geral",
    desc: "Dashboard white-label do Just Burn com métricas em tempo real.",
  },
  {
    href: "/demo/cliente/just-burn/criativos",
    icon: ImageIcon,
    title: "Cliente — Criativos",
    desc: "Galeria com aprovação inline + ads rodando.",
  },
  {
    href: "/demo/cliente/just-burn/historico",
    icon: Activity,
    title: "Cliente — Histórico",
    desc: "Timeline read-only do que aconteceu nas campanhas.",
  },
  {
    href: "/demo/cliente/just-burn/investimento",
    icon: Wallet,
    title: "Cliente — Investimento",
    desc: "Gráfico 30d + breakdown por campanha.",
  },
  {
    href: "/demo/cliente/just-burn/mensagens",
    icon: MessageSquare,
    title: "Cliente — Mensagens",
    desc: "Chat bidirecional cliente ↔ agência.",
  },
];

export default function DemoIndex() {
  return (
    <div className="min-h-[100dvh] py-16 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <Link
            href="/"
            className="text-label flex items-center gap-2 mb-6 text-text-tertiary hover:text-text-primary transition-colors"
          >
            ← Voltar pra landing
          </Link>
          <StatusPill variant="info" pulse className="mb-4">
            modo demo · dados mock
          </StatusPill>
          <h1 className="text-display-md mb-3">Tour pelas telas do BASE</h1>
          <p className="text-body-lg text-text-secondary max-w-2xl">
            Todas as views do produto navegáveis com dados mockados — sem precisar de
            Supabase, sem precisar de auth. Pra explorar livremente.
          </p>
        </div>

        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 bg-brand-500 rounded-full" />
            <h2 className="text-h3">Dashboard Admin</h2>
            <span className="text-body-sm text-text-tertiary">(Kendy)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADMIN.map((item) => (
              <Link key={item.href} href={item.href}>
                <GlassCard hoverable className="p-6 h-full group">
                  <item.icon
                    className="w-5 h-5 text-brand-500 mb-3 group-hover:scale-110 transition-transform"
                    strokeWidth={1.75}
                  />
                  <h3 className="text-h4 mb-1">{item.title}</h3>
                  <p className="text-body-sm text-text-secondary mb-4">{item.desc}</p>
                  <span className="text-body-sm text-text-tertiary inline-flex items-center gap-1 group-hover:text-text-primary transition-colors">
                    Explorar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 bg-brand-500 rounded-full" />
            <h2 className="text-h3">Dashboard Cliente</h2>
            <span className="text-body-sm text-text-tertiary">(white-label)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLIENT.map((item) => (
              <Link key={item.href} href={item.href}>
                <GlassCard hoverable className="p-6 h-full group">
                  <item.icon
                    className="w-5 h-5 text-brand-500 mb-3 group-hover:scale-110 transition-transform"
                    strokeWidth={1.75}
                  />
                  <h3 className="text-h4 mb-1">{item.title}</h3>
                  <p className="text-body-sm text-text-secondary mb-4">{item.desc}</p>
                  <span className="text-body-sm text-text-tertiary inline-flex items-center gap-1 group-hover:text-text-primary transition-colors">
                    Explorar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-16 text-center">
          <p className="text-body-sm text-text-tertiary mb-4">
            Pronto pra usar com dados reais?
          </p>
          <Link href="/login">
            <GlassButton size="lg">
              Entrar na conta real
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
