"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Activity,
  Bot,
  FileBarChart2,
  Settings,
  Bell,
  ArrowLeft,
  Search,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
};

const NAV: NavItem[] = [
  { href: "/demo/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/demo/admin/clients", label: "Clientes", icon: Users },
  { href: "/demo/admin/approvals", label: "Aprovações", icon: ShieldCheck, badge: 3 },
  { href: "/demo/admin/audit", label: "Auditoria", icon: Activity },
  { href: "/demo/admin/agent-config", label: "Agente IA", icon: Bot },
  { href: "/demo/admin/reports", label: "Relatórios", icon: FileBarChart2 },
  { href: "/demo/admin/settings", label: "Configurações", icon: Settings },
];

export function DemoAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[100dvh]">
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border-subtle bg-bg-base/50 backdrop-blur-xl"
        style={{ height: "100dvh" }}
      >
        <div className="px-5 py-6 border-b border-border-subtle">
          <Link href="/demo" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_4px_16px_rgba(61,90,254,0.4)]">
              <span className="font-mono font-bold text-sm text-white">B</span>
            </div>
            <div>
              <div className="text-body-sm font-semibold leading-tight">BASE</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
                Tráfego · Demo
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== "/demo/admin" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all duration-200",
                  active
                    ? "bg-glass-medium text-text-primary"
                    : "text-text-tertiary hover:text-text-primary hover:bg-glass-light",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="demoActive"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-brand-500 rounded-r-full"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <Icon
                  className={cn("w-4 h-4", active && "text-brand-500")}
                  strokeWidth={1.75}
                />
                <span className="flex-1">{label}</span>
                {badge && badge > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-warning-bg text-warning-text border border-warning-border">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <Link
            href="/demo"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm text-text-tertiary hover:text-text-primary hover:bg-glass-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            <span>Voltar ao tour</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-border-subtle bg-bg-base/70 backdrop-blur-xl">
          <div className="h-full px-4 sm:px-6 flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-warning-text bg-warning-bg border border-warning-border px-2 py-1 rounded-full">
              modo demo
            </span>
            <div className="flex-1 max-w-xl mx-auto hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input
                  placeholder="Buscar clientes, campanhas, ações…"
                  disabled
                  className="w-full h-10 pl-10 pr-16 rounded-xl bg-glass-light border border-border-default text-body-sm placeholder:text-text-muted opacity-60 cursor-not-allowed"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-[10px] font-mono text-text-tertiary px-1.5 py-0.5 rounded bg-glass-medium border border-border-default">
                  <Command className="w-3 h-3" /> K
                </kbd>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="relative p-2 rounded-lg hover:bg-glass-light text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Notificações"
              >
                <Bell className="w-5 h-5" strokeWidth={1.75} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger-text shadow-[0_0_10px_rgba(248,113,113,0.6)]" />
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-border-subtle ml-1">
                <div className="w-8 h-8 rounded-full bg-glass-medium border border-border-default flex items-center justify-center font-mono text-xs font-medium">
                  K
                </div>
                <div className="hidden sm:block">
                  <div className="text-body-sm font-medium leading-tight">Kendy</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
                    Super Admin
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
