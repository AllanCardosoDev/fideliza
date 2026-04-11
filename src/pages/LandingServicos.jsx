import React from "react";
import { Link } from "react-router-dom";
import LandingLayout from "../components/LandingLayout";
import "../styles/landing.css";

const IconCheck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const LINHAS = [
  {
    icon: "\uD83C\uDFE2",
    title: "Empréstimo para Empresas",
    desc: "Soluções de crédito estruturadas para atender às necessidades gerais da sua operação, com taxas competitivas e prazos flexíveis.",
  },
  {
    icon: "\uD83D\uDCB8",
    title: "Empréstimo para Capital de Giro",
    desc: "Liquidez imediata para equilibrar o fluxo de caixa, pagar fornecedores, folha de pagamento e manter a operação saudável.",
  },
  {
    icon: "\uD83D\uDCC8",
    title: "Empréstimo para Expansão",
    desc: "Recursos destinados à abertura de novas filiais, aquisição de maquinário, tecnologia e aumento da capacidade produtiva.",
  },
  {
    icon: "\uD83C\uDFE0",
    title: "Empréstimo Imobiliário para Negócios",
    desc: "Financiamento para compra, construção ou reforma da sede da sua empresa, galpões logísticos ou salas comerciais.",
  },
];

const VANTAGENS = [
  "Taxas corporativas a partir de 1.5% ao mês",
  "Análise de crédito focada no modelo de negócio",
  "Carência de até 6 meses para começar a pagar",
  "Prazos estendidos de até 120 meses",
  "Atendimento consultivo por especialistas B2B",
  "Processo de aprovação ágil e transparente",
  "Sem exigência de garantias irreais",
  "Estruturação de dívidas e renegociação",
];

const JORNADA = [
  {
    num: "01",
    title: "Diagnóstico",
    desc: "Entendemos o momento da sua empresa e a finalidade do recurso.",
  },
  {
    num: "02",
    title: "Envio de Dados",
    desc: "Coleta de faturamento e documentação societária de forma digital.",
  },
  {
    num: "03",
    title: "Análise de Risco",
    desc: "Avaliação ágil focada na capacidade de geração de caixa.",
  },
  {
    num: "04",
    title: "Estruturação",
    desc: "Desenho da melhor proposta de taxas, prazos e garantias.",
  },
  {
    num: "05",
    title: "Aprovação",
    desc: "Apresentação formal da proposta para a diretoria da empresa.",
  },
  {
    num: "06",
    title: "Liberação",
    desc: "Assinatura dos contratos e transferência do capital para a conta PJ.",
  },
];

const DOCS = [
  "Contrato Social atualizado e CNPJ",
  "Documentos pessoais dos sócios",
  "Comprovante de endereço da empresa",
  "Faturamento fiscal (últimos 12 meses)",
  "Extrato bancário PJ (últimos 6 meses)",
  "Balanço Patrimonial e DRE (se aplicável)",
];

export default function LandingServicos() {
  return (
    <LandingLayout>
      {/* ══ HERO ══ */}
      <section className="lp-inner-hero">
        <div className="lp-container lp-inner-hero-content">
          <h1 className="lp-inner-hero-title">Soluções Corporativas</h1>
          <p className="lp-inner-hero-sub">
            Linhas de crédito exclusivas para impulsionar o crescimento,
            garantir a liquidez e estruturar a expansão da sua empresa.
          </p>
          <Link
            to="/simular"
            className="lp-cta-primary"
            style={{ marginTop: "8px" }}
          >
            Simular Crédito PJ
          </Link>
        </div>
      </section>

      {/* ══ LINHAS DE CRÉDITO ══ */}
      <section className="lp-section lp-white">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2-primary">Nossas Linhas de Crédito</h2>
            <p className="lp-section-sub">
              Escolha a solução ideal para o momento estratégico do seu negócio
            </p>
          </div>
          <div className="lp-steps-grid">
            {LINHAS.map((l, i) => (
              <div key={i} className="lp-step-card">
                <div className="lp-step-icon-box">
                  <span className="lp-step-emoji">{l.icon}</span>
                </div>
                <h3 className="lp-step-title">{l.title}</h3>
                <p className="lp-step-desc">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ VANTAGENS ══ */}
      <section className="lp-section lp-glass-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2-primary">Vantagens para sua Empresa</h2>
            <p className="lp-section-sub">
              Por que as empresas de Manaus escolhem a FidelizaCred
            </p>
          </div>
          <div className="lp-vantagens-grid">
            {VANTAGENS.map((v, i) => (
              <div key={i} className="lp-vantagem-item">
                <span className="lp-check-icon lp-check-gold">
                  <IconCheck />
                </span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ JORNADA DO CRÉDITO ══ */}
      <section className="lp-section lp-white">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2-primary">Jornada do Crédito</h2>
            <p className="lp-section-sub">
              Processo estruturado para garantir agilidade e segurança
            </p>
          </div>
          <div className="lp-jornada-grid">
            {JORNADA.map((j, i) => (
              <div key={i} className="lp-jornada-card">
                <div className="lp-jornada-num">{j.num}</div>
                <h3 className="lp-jornada-title">{j.title}</h3>
                <p className="lp-jornada-desc">{j.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DOCUMENTAÇÃO ══ */}
      <section className="lp-section lp-glass-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2-primary">Documentação PJ Necessária</h2>
            <p className="lp-section-sub">
              Prepare a documentação básica para iniciarmos a análise da sua
              empresa
            </p>
          </div>
          <div className="lp-docs-card">
            <div className="lp-docs-badge">Checklist Empresarial</div>
            <div className="lp-docs-list">
              {DOCS.map((d, i) => (
                <div key={i} className="lp-product-advantage lp-docs-item">
                  <span className="lp-check-icon lp-check-gold">
                    <IconCheck />
                  </span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
