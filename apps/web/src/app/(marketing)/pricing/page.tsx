import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { StatusPill } from "@/components/glass/status-pill";
import { PLANS, type PlanId } from "@base-trafego/shared/constants";
import { formatBRL } from "@base-trafego/shared/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Planos e preços do BASE Tráfego Command.",
};

export default function PricingPage() {
  const plans = Object.values(PLANS);
  return (
    <div className="min-h-[100dvh] py-20 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-label mb-2">Planos</p>
          <h1 className="text-display-md mb-4">Pricing transparente</h1>
          <p className="text-body-lg text-text-secondary max-w-2xl mx-auto">
            Escolha o plano que faz sentido pra sua operação. Cancela a qualquer momento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const id = plan.id as PlanId;
            return (
              <GlassCard
                key={id}
                aura={"popular" in plan && plan.popular}
                className="p-8 flex flex-col"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-h2">{plan.name}</h3>
                  {"popular" in plan && plan.popular && (
                    <StatusPill variant="info" pulse>
                      Popular
                    </StatusPill>
                  )}
                </div>
                <p className="text-body-sm text-text-secondary mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-metric-md">{formatBRL(plan.price, { minimumFractionDigits: 0 })}</span>
                  <span className="text-body-sm text-text-tertiary">/mês</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-body-sm">
                      <Check className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <GlassButton
                    variant={"popular" in plan && plan.popular ? "primary" : "glass"}
                    className="w-full"
                  >
                    Começar
                  </GlassButton>
                </Link>
              </GlassCard>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-body-sm text-text-tertiary">
            Precisa de algo customizado?{" "}
            <a href="mailto:contato@agenciabase.tech" className="text-text-primary underline-offset-4 hover:underline">
              Fale conosco
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
