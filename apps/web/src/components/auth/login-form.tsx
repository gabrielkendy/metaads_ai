"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { loginWithMagicLink, loginWithGoogle } from "@/lib/auth/actions";
import { GlassButton } from "@/components/glass/glass-button";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const [googlePending, startGoogleTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    const fd = new FormData();
    fd.set("email", email.trim());
    if (redirectTo) fd.set("redirect_to", redirectTo);

    startTransition(async () => {
      const result = await loginWithMagicLink(fd);
      if (result.ok) {
        toast.success("Verifique seu email", {
          description: "Enviamos um link mágico de acesso. Pode demorar até 1min.",
        });
        setSent(true);
      } else {
        toast.error("Não consegui enviar o link", {
          description: result.error,
        });
      }
    });
  }

  function onGoogle() {
    startGoogleTransition(async () => {
      await loginWithGoogle(redirectTo);
    });
  }

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-success-bg border border-success-border flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-success-text" strokeWidth={1.75} />
        </div>
        <h2 className="text-h3 mb-2">Link enviado!</h2>
        <p className="text-body-sm text-text-secondary">
          Cheque <span className="text-text-primary font-medium">{email}</span> e clique no link
          mágico pra entrar. Pode demorar até 1 minuto.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
        >
          Usar outro email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-label-lg block">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="voce@empresa.com"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 focus:bg-glass-medium outline-none transition-all duration-200 text-body placeholder:text-text-muted"
            />
          </div>
        </div>

        <GlassButton type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              Receber link mágico
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </GlassButton>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border-default" />
        <span className="text-label">ou</span>
        <div className="flex-1 h-px bg-border-default" />
      </div>

      <GlassButton
        type="button"
        variant="glass"
        className="w-full"
        onClick={onGoogle}
        disabled={googlePending}
      >
        {googlePending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
            <path
              fill="#fff"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
            />
            <path
              fill="#fff"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.997 10.997 0 0 0 12 23Z"
              opacity=".88"
            />
            <path
              fill="#fff"
              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18a10.997 10.997 0 0 0 0 9.88l3.66-2.84Z"
              opacity=".7"
            />
            <path
              fill="#fff"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.06 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
              opacity=".55"
            />
          </svg>
        )}
        Entrar com Google
      </GlassButton>
    </div>
  );
}
