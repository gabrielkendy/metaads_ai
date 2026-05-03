"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GlassButton } from "@/components/glass/glass-button";
import { createClientAction, updateClientAction } from "@/lib/actions/clients";
import { slugify } from "@base-trafego/shared/utils";

interface ClientFormProps {
  mode: "create" | "edit";
  defaultValues?: Record<string, unknown>;
}

const FormField = ({
  label,
  name,
  hint,
  ...props
}: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="space-y-1.5 block">
    <span className="text-label-lg block">{label}</span>
    <input
      name={name}
      className="w-full h-10 px-3 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 focus:bg-glass-medium outline-none text-body-sm transition-all"
      {...props}
    />
    {hint && <span className="text-[11px] text-text-tertiary block">{hint}</span>}
  </label>
);

export function ClientForm({ mode, defaultValues }: ClientFormProps) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState((defaultValues?.name as string) ?? "");
  const [slug, setSlug] = useState((defaultValues?.slug as string) ?? "");

  function autoSlug(n: string) {
    setName(n);
    if (!defaultValues?.slug) setSlug(slugify(n));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const action = mode === "create" ? createClientAction : updateClientAction;
      const result = await action(fd);
      if (result && !result.ok) {
        toast.error("Não foi possível salvar", { description: result.error });
      } else if (mode === "edit") {
        toast.success("Cliente atualizado");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {mode === "edit" && Boolean(defaultValues?.id) && (
        <input type="hidden" name="id" defaultValue={defaultValues?.id as string} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          label="Nome do cliente"
          name="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => autoSlug(e.target.value)}
          placeholder="Just Burn Club"
        />
        <FormField
          label="Slug (URL)"
          name="slug"
          required
          pattern="[a-z0-9-]+"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          hint="ex: just-burn — só letras minúsculas, números e hífen"
        />
        <FormField
          label="Razão social"
          name="legal_name"
          defaultValue={defaultValues?.legal_name as string}
          placeholder="Just Burn Club LTDA"
        />
        <FormField
          label="CNPJ"
          name="cnpj"
          defaultValue={defaultValues?.cnpj as string}
          placeholder="00.000.000/0000-00"
        />
        <FormField
          label="Setor"
          name="industry"
          defaultValue={defaultValues?.industry as string}
          placeholder="fitness, food, fashion…"
        />
        <FormField
          label="Website"
          name="website_url"
          type="url"
          defaultValue={defaultValues?.website_url as string}
          placeholder="https://"
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-label-lg block">Descrição</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description as string}
          placeholder="Curta descrição do negócio do cliente"
          className="w-full px-3 py-2.5 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 focus:bg-glass-medium outline-none text-body-sm transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <label className="space-y-1.5 block">
          <span className="text-label-lg block">Status</span>
          <select
            name="status"
            defaultValue={(defaultValues?.status as string) ?? "onboarding"}
            className="w-full h-10 px-3 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 outline-none text-body-sm"
          >
            <option value="onboarding">Onboarding</option>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="churned">Churn</option>
          </select>
        </label>

        <label className="space-y-1.5 block">
          <span className="text-label-lg block">Plano</span>
          <select
            name="plan"
            defaultValue={(defaultValues?.plan as string) ?? "pro"}
            className="w-full h-10 px-3 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 outline-none text-body-sm"
          >
            <option value="starter">Starter — R$ 1.500/mês</option>
            <option value="pro">Pro — R$ 3.500/mês</option>
            <option value="premium">Premium — R$ 8.000/mês</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <FormField
          label="Limite mensal de ad spend (BRL)"
          name="monthly_budget_limit"
          type="number"
          step="1"
          defaultValue={defaultValues?.monthly_budget_limit as never}
          placeholder="20000"
        />
        <FormField
          label="Soft cap (alerta)"
          name="monthly_budget_soft_cap"
          type="number"
          step="1"
          defaultValue={defaultValues?.monthly_budget_soft_cap as never}
          placeholder="15000"
        />
        <FormField
          label="Aprovação obrigatória acima de"
          name="requires_approval_above"
          type="number"
          step="100"
          defaultValue={(defaultValues?.requires_approval_above as never) ?? 1000}
          hint="ações Claude com impacto > esse valor exigem aprovação"
        />
        <FormField
          label="Máx contas Meta"
          name="max_meta_accounts"
          type="number"
          step="1"
          defaultValue={(defaultValues?.max_meta_accounts as never) ?? 1}
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <FormField
          label="Cor primária (white-label)"
          name="brand_primary_color"
          type="text"
          pattern="^#[0-9A-Fa-f]{6}$"
          defaultValue={(defaultValues?.brand_primary_color as string) ?? "#3D5AFE"}
        />
        <FormField
          label="Logo URL"
          name="logo_url"
          type="url"
          defaultValue={defaultValues?.logo_url as string}
          placeholder="https://…"
        />
      </div>

      <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-glass-light border border-border-default cursor-pointer hover:bg-glass-medium transition">
        <input
          type="checkbox"
          name="auto_approve_creatives"
          defaultChecked={!!defaultValues?.auto_approve_creatives}
          className="w-4 h-4 accent-brand-500"
        />
        <span className="text-body-sm flex-1">
          Aprovar criativos automaticamente
          <span className="block text-[11px] text-text-tertiary">
            Quando ON, criativos novos vão direto pra Meta sem espera de aprovação do cliente.
          </span>
        </span>
      </label>

      <div className="space-y-1.5">
        <span className="text-label-lg block">Notas internas (não vai pro cliente)</span>
        <textarea
          name="internal_notes"
          rows={3}
          defaultValue={defaultValues?.internal_notes as string}
          className="w-full px-3 py-2.5 rounded-xl bg-glass-light border border-border-default focus:border-brand-500 outline-none text-body-sm transition-all resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
        <GlassButton variant="glass" type="button" disabled={pending}>
          Cancelar
        </GlassButton>
        <GlassButton type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "create" ? "Criar cliente" : "Salvar alterações"}
        </GlassButton>
      </div>
    </form>
  );
}
