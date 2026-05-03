import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { GlassCard } from "@/components/glass/glass-card";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o BASE Tráfego Command",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_to?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-label flex items-center gap-2 mb-10 text-text-tertiary hover:text-text-primary transition-colors"
        >
          ← BASE TRÁFEGO COMMAND
        </Link>

        <GlassCard className="p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-h1 text-text-primary">Entrar</h1>
            <p className="text-body text-text-secondary mt-2">
              Use seu email pra receber um link mágico de acesso.
            </p>
          </div>

          <LoginForm redirectTo={sp.redirect_to} />

          <div className="mt-6 pt-6 border-t border-border-subtle text-center">
            <p className="text-body-sm text-text-tertiary mb-2">Quer só dar uma olhada?</p>
            <Link
              href="/demo"
              className="text-body-sm text-brand-400 hover:text-brand-300 underline-offset-4 hover:underline font-medium"
            >
              Ver demo interativa →
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-border-subtle">
            <p className="text-body-sm text-text-tertiary text-center">
              Ao continuar, você concorda com nossos{" "}
              <Link href="/terms" className="text-text-secondary underline-offset-4 hover:underline">
                termos
              </Link>{" "}
              e{" "}
              <Link
                href="/privacy"
                className="text-text-secondary underline-offset-4 hover:underline"
              >
                privacidade
              </Link>
              .
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
