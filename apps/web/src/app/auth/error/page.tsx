import Link from "next/link";
import type { Metadata } from "next";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Erro de autenticação",
};

const REASONS: Record<string, { title: string; message: string }> = {
  forbidden: {
    title: "Acesso negado",
    message: "Sua conta não tem permissão de admin nessa plataforma.",
  },
  no_client_access: {
    title: "Sem vínculo com cliente",
    message:
      "Sua conta ainda não foi vinculada a nenhum cliente. Fale com a equipe BASE pra liberar acesso.",
  },
  client_not_found: {
    title: "Cliente não encontrado",
    message: "O cliente solicitado não existe ou foi removido.",
  },
  oauth: {
    title: "Erro no OAuth",
    message: "Não consegui completar o login com o provedor.",
  },
  exchange_failed: {
    title: "Sessão inválida",
    message: "O link mágico expirou ou já foi usado. Solicite um novo.",
  },
  missing_code: {
    title: "Link inválido",
    message: "Esse link de acesso é inválido. Solicite um novo no login.",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; message?: string }>;
}) {
  const sp = await searchParams;
  const reason = sp.reason ?? "forbidden";
  const info = REASONS[reason] ?? REASONS.forbidden;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <GlassCard className="p-10 max-w-md w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-warning-bg border border-warning-border flex items-center justify-center mb-5">
          <AlertTriangle className="w-6 h-6 text-warning-text" strokeWidth={1.75} />
        </div>
        <h1 className="text-h2 mb-2">{info.title}</h1>
        <p className="text-body text-text-secondary mb-2">{info.message}</p>
        {sp.message && (
          <p className="text-body-sm text-text-tertiary mb-6 font-mono">
            {decodeURIComponent(sp.message)}
          </p>
        )}
        <div className="flex gap-3 justify-center mt-8">
          <Link href="/login">
            <GlassButton variant="primary">Voltar pro login</GlassButton>
          </Link>
          <Link href="/">
            <GlassButton variant="glass">Início</GlassButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
