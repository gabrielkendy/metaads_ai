import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard } from "@/components/glass/glass-card";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no BASE Tráfego Command",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <GlassCard className="max-w-md w-full p-10 text-center">
        <p className="text-label mb-2">Em breve</p>
        <h1 className="text-h1 mb-3">Cadastro auto-serviço</h1>
        <p className="text-body text-text-secondary mb-6">
          Por enquanto, novos clientes são onboardados manualmente pela equipe BASE.
          Use o link de login (magic link) que você recebeu por email.
        </p>
        <Link
          href="/login"
          className="text-body-sm text-text-primary underline-offset-4 hover:underline"
        >
          Já tem acesso? Entrar →
        </Link>
      </GlassCard>
    </div>
  );
}
