import Link from "next/link";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassCard } from "@/components/glass/glass-card";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6">
      <GlassCard className="max-w-md p-10 text-center">
        <p className="text-label mb-1">404</p>
        <h1 className="text-h1 mb-2">Página não encontrada</h1>
        <p className="text-body text-text-secondary mb-6">
          O endereço que você procurou não existe (ou foi movido). Use os atalhos abaixo.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/">
            <GlassButton>Início</GlassButton>
          </Link>
          <Link href="/admin">
            <GlassButton variant="glass">Dashboard admin</GlassButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
