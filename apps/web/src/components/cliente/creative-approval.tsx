"use client";

import { useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlassButton } from "@/components/glass/glass-button";
import { approveCreativeAction } from "@/lib/actions/creatives";

export function CreativeApprovalButton({ adId }: { adId: string }) {
  const [pending, startTransition] = useTransition();

  function handle(approved: boolean) {
    const feedback = !approved ? prompt("Por que não aprova? (opcional)") ?? undefined : undefined;
    startTransition(async () => {
      const r = await approveCreativeAction(adId, approved, feedback);
      if (r.ok) {
        toast.success(approved ? "Criativo aprovado" : "Criativo rejeitado");
      } else {
        toast.error("Erro", { description: r.error });
      }
    });
  }

  return (
    <div className="flex gap-2">
      <GlassButton
        variant="success"
        size="sm"
        className="flex-1"
        onClick={() => handle(true)}
        disabled={pending}
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Aprovar
      </GlassButton>
      <GlassButton
        variant="danger"
        size="sm"
        className="flex-1"
        onClick={() => handle(false)}
        disabled={pending}
      >
        <X className="w-4 h-4" />
        Rejeitar
      </GlassButton>
    </div>
  );
}
