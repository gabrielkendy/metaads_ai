import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert mx-auto py-20 px-6 max-w-3xl">
      <h1 className="text-h1">Política de Privacidade</h1>
      <p className="text-text-secondary text-body-sm">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <h2>1. Quem somos</h2>
      <p>
        BASE Tráfego Command é um produto da Agência BASE (Brasil). Operamos em conformidade com a
        LGPD (Lei 13.709/2018).
      </p>

      <h2>2. Quais dados coletamos</h2>
      <ul>
        <li>Dados de cadastro: email, nome, foto.</li>
        <li>Dados operacionais: campanhas Meta Ads, métricas de performance, criativos.</li>
        <li>Dados de uso da plataforma: logs de acesso, ações executadas (auditoria).</li>
      </ul>

      <h2>3. Pra quê usamos</h2>
      <ul>
        <li>Operar Meta Ads em sua conta com sua autorização explícita (OAuth).</li>
        <li>Gerar relatórios e dashboards.</li>
        <li>Enviar notificações operacionais.</li>
      </ul>

      <h2>4. Tokens Meta</h2>
      <p>
        Tokens OAuth são armazenados criptografados em repouso (AES-256-GCM). Apenas o servidor
        autorizado consegue decodificá-los pra chamar a Meta API.
      </p>

      <h2>5. Direitos do titular</h2>
      <p>
        Você pode solicitar a qualquer momento: acesso, correção, eliminação, portabilidade.
        Mande email para <a href="mailto:dpo@agenciabase.tech">dpo@agenciabase.tech</a>.
      </p>

      <h2>6. Retenção</h2>
      <p>
        Mantemos audit logs por 24 meses pra compliance. Criativos e métricas: enquanto o contrato
        estiver ativo + 90 dias.
      </p>
    </article>
  );
}
