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
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@base-trafego/shared/constants";
import { signOut } from "@/lib/auth/actions";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: "approvals";
};

const NAV: NavItem[] = [
  { href: ROUTES.admin.home, label: "Visão geral", icon: LayoutDashboard },
  { href: ROUTES.admin.clients, label: "Clientes", icon: Users },
  { href: ROUTES.admin.approvals, label: "Aprovações", icon: ShieldCheck, badge: "approvals" },
  { href: ROUTES.admin.audit, label: "Auditoria", icon: Activity },
  { href: ROUTES.admin.agentConfig, label: "Agente IA", icon: Bot },
  { href: ROUTES.admin.reports, label: "Relatórios", icon: FileBarChart2 },
  { href: ROUTES.admin.settings, label: "Configurações", icon: Settings },
];

export function AdminSidebar({
  pendingApprovals = 0,
}: {
  pendingApprovals?: number;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border-subtle bg-bg-base/50 backdrop-blur-xl"
      style={{ height: "100dvh" }}
    >
      <div className="px-5 py-6 border-b border-border-subtle">
        <Link href={ROUTES.admin.home} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_4px_16px_rgba(61,90,254,0.4)]">
            <span className="font-mono font-bold text-sm text-white">B</span>
          </div>
          <div>
            <div className="text-body-sm font-semibold leading-tight">BASE</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
              Tráfego Command
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const showBadge = badge === "approvals" && pendingApprovals > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "text-body-sm font-medium transition-all duration-200",
                active
                  ? "bg-glass-medium text-text-primary"
                  : "text-text-tertiary hover:text-text-primary hover:bg-glass-light",
              )}
            >
              {active && (
                <motion.div
                  layoutId="adminActiveIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-brand-500 rounded-r-full"
                  transition={{ type: "spring", duration: 0.4 }}
                />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  active && "text-brand-500",
                )}
                strokeWidth={1.75}
              />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-warning-bg text-warning-text border border-warning-border">
                  {pendingApprovals > 99 ? "99+" : pendingApprovals}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="p-4 border-t border-border-subtle">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm text-text-tertiary hover:text-text-primary hover:bg-glass-light transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.75} />
          <span>Sair</span>
        </button>
      </form>
    </aside>
  );
}
