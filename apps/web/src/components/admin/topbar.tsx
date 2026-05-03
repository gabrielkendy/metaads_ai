"use client";

import { Bell, Command, Search, Menu } from "lucide-react";
import { useState } from "react";
import { GlassButton } from "@/components/glass/glass-button";
import { cn } from "@/lib/utils";

export function AdminTopbar({
  pageTitle,
  unreadNotifications = 0,
  user,
}: {
  pageTitle?: string;
  unreadNotifications?: number;
  user?: { full_name?: string | null; email: string; avatar_url?: string | null };
}) {
  const [mobileMenu, setMobileMenu] = useState(false);

  const initials =
    user?.full_name
      ?.split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border-subtle bg-bg-base/70 backdrop-blur-xl">
      <div className="h-full px-4 sm:px-6 flex items-center gap-3">
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-glass-light"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          <Menu className="w-5 h-5" />
        </button>

        {pageTitle && (
          <h1 className="text-h4 hidden sm:block">{pageTitle}</h1>
        )}

        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              placeholder="Buscar clientes, campanhas, ações…"
              className="w-full h-10 pl-10 pr-16 rounded-xl bg-glass-light border border-border-default focus:bg-glass-medium focus:border-brand-500 outline-none transition-all text-body-sm placeholder:text-text-muted"
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
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger-text shadow-[0_0_10px_rgba(248,113,113,0.6)]" />
            )}
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-border-subtle ml-1">
            <div className="w-8 h-8 rounded-full bg-glass-medium border border-border-default flex items-center justify-center font-mono text-xs font-medium overflow-hidden">
              {user?.avatar_url ? (
                // biome-ignore lint/a11y/useAltText: avatar
                <img src={user.avatar_url} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-body-sm font-medium leading-tight">
                {user?.full_name ?? user?.email?.split("@")[0]}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
                Admin
              </div>
            </div>
          </div>
        </div>
      </div>

      {mobileMenu && (
        <div
          className={cn(
            "lg:hidden absolute top-16 inset-x-0 bg-bg-elevated border-b border-border-subtle p-4 z-20",
          )}
        >
          <p className="text-body-sm text-text-tertiary">
            Use a sidebar pra navegar (em breve no mobile).
          </p>
        </div>
      )}
    </header>
  );
}
