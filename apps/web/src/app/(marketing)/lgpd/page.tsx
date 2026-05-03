import type { Metadata } from "next";

export const metadata: Metadata = { title: "LGPD" };

export default function LGPDPage() {
  return (
    <article className="prose prose-invert mx-auto py-20 px-6 max-w-3xl">
      <h1 className="text-h1">LGPD — Direitos do titular</h1>
      <p className="text-text-secondary text-body-sm">
        Em conformidade com a Lei 13.709/2018 (LGPD).
      </p>

      <h2>Como exercer seus direitos</h2>
      <p>
        Você pode, a qualquer momento, exercer os seguintes direitos sobre seus dados pessoais:
      </p>
      <ul>
        <li>Confirmação de tratamento</li>
        <li>Acesso aos dados</li>
        <li>Correção de dados incompletos ou desatualizados</li>
        <li>Anonimização ou bloqueio de dados</li>
        <li>Eliminação dos dados (direito ao esquecimento)</li>
        <li>Portabilidade</li>
        <li>Revogação de consentimento</li>
      </ul>

      <h2>Canal oficial</h2>
      <p>
        Encarregado de Dados (DPO):{" "}
        <a href="mailto:dpo@agenciabase.tech">dpo@agenciabase.tech</a>. Resposta em até 15 dias úteis.
      </p>
    </article>
  );
}
