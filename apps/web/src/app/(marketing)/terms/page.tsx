import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermsPage() {
  return (
    <article className="prose prose-invert mx-auto py-20 px-6 max-w-3xl">
      <h1 className="text-h1">Termos de Uso</h1>
      <p className="text-text-secondary text-body-sm">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <h2>1. Aceite</h2>
      <p>
        Ao usar o BASE Tráfego Command você concorda com estes termos. Se discorda, não use a
        plataforma.
      </p>

      <h2>2. Conta</h2>
      <p>
        Você é responsável por manter suas credenciais seguras. Toda ação executada pela sua conta
        é considerada autorizada por você.
      </p>

      <h2>3. Meta Ads</h2>
      <p>
        Conectar sua conta Meta Business autoriza Claude a executar ações dentro dos limites
        configurados. Mudanças que ultrapassam o limite exigem sua aprovação manual.
      </p>

      <h2>4. Pagamentos</h2>
      <p>
        Cobrança mensal recorrente conforme plano selecionado. Cancelamento: aviso de 30 dias.
      </p>

      <h2>5. Limites</h2>
      <p>
        A Agência BASE não se responsabiliza por gastos de Meta Ads efetuados via plataforma — o
        controle de orçamento é configurado por você. Use os recursos de aprovação e limites.
      </p>

      <h2>6. Foro</h2>
      <p>Foro de Belo Horizonte/MG.</p>
    </article>
  );
}
