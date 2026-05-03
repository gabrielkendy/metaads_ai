"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "home", label: "Visão geral", path: "" },
  { id: "criativos", label: "Criativos", path: "/criativos" },
  { id: "historico", label: "Histórico", path: "/historico" },
  { id: "investimento", label: "Investimento", path: "/investimento" },
  { id: "mensagens", label: "Mensagens", path: "/mensagens" },
];

export function ClientTopbar({
  client,
  user,
}: {
  client: { name: string; slug: string; logo_url: string | null; brand_primary_color: string };
  user: { full_name: string | null; email: string; avatar_url: string | null };
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg-base/70 backdrop-blur-xl">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center gap-6">
        <Link href={`/cliente/${client.slug}`} className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${client.brand_primary_color}40, ${client.brand_primary_color}10)`,
              color: client.brand_primary_color,
              border: `1px solid ${client.brand_primary_color}40`,
            }}
          >
            {client.logo_url ? (
              // biome-ignore lint/a11y/useAltText: avatar
              <img src={client.logo_url} className="w-full h-full object-cover" />
            ) : (
              client.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="hidden sm:block">
            <div className="text-body font-semibold leading-tight">{client.name}</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
              By Agência BASE
            </div>
          </div>
        </Link>

        <nav className="flex-1 hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar">
          {NAV.map((n) => {
            const href = `/cliente/${client.slug}${n.path}`;
            const active = pathname === href || (n.path === "" && pathname === `/cliente/${client.slug}`);
            return (
              <Link
                key={n.id}
                href={href}
                className={cn(
                  "px-3 py-2 rounded-lg text-body-sm transition-colors",
                  active
                    ? "bg-glass-medium text-text-primary"
                    : "text-text-tertiary hover:text-text-primary hover:bg-glass-light",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-body-sm font-medium leading-tight truncate max-w-32">
              {user.full_name ?? user.email.split("@")[0]}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
              Cliente
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-glass-medium border border-border-default flex items-center justify-center text-xs font-mono font-medium overflow-hidden">
            {user.avatar_url ? (
              // biome-ignore lint/a11y/useAltText: avatar
              <img src={user.avatar_url} className="w-full h-full object-cover" />
            ) : (
              (user.full_name ?? user.email)?.[0]?.toUpperCase()
            )}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
