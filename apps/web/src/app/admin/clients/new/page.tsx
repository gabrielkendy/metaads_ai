import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { ClientForm } from "@/components/admin/client-form";

export const metadata: Metadata = { title: "Novo cliente" };

export default function NewClientPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-body-sm text-text-tertiary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar pra clientes
      </Link>

      <div>
        <p className="text-label mb-1">Cadastro</p>
        <h1 className="text-h1">Novo cliente</h1>
        <p className="text-body text-text-secondary mt-1">
          Adiciona um cliente novo pra começar a gerenciar tráfego.
        </p>
      </div>

      <GlassCard className="p-8">
        <ClientForm mode="create" />
      </GlassCard>
    </div>
  );
}
