"use client";

import { GlassButton } from "@/components/glass/glass-button";
import { GlassCard } from "@/components/glass/glass-card";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6">
      <GlassCard className="max-w-md p-10 text-center">
        <p className="text-label mb-1">500</p>
        <h1 className="text-h1 mb-2">Algo deu errado</h1>
        <p className="text-body text-text-secondary mb-6">
          Já fomos notificados. Tente novamente em alguns segundos.
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-text-tertiary mb-4">ref: {error.digest}</p>
        )}
        <GlassButton onClick={reset}>Tentar novamente</GlassButton>
      </GlassCard>
    </div>
  );
}
