import React from "react";
import { Link } from "react-router-dom";
import LandingLayout from "../components/LandingLayout";
import "../styles/landing.css";

const DIFERENCIAIS = [
  {
    title: "Juros Baixos de Verdade",
    desc: "Trabalhamos com taxas corporativas justas e transparentes, focadas na viabilidade do seu negócio.",
    icon: "\uD83D\uDCB0",
  },
  {
    title: "Foco Exclusivo em Manaus",
    desc: "Conhecemos a realidade do mercado local e oferecemos soluções que fazem sentido para as empresas da nossa região.",
    icon: "\uD83D\uDCCD",
  },
  {
    title: "Agilidade na Aprovação",
    desc: "Processos otimizados para que sua empresa tenha acesso ao capital quando mais precisa, sem burocracia excessiva.",
    icon: "\u26A1",
  },
  {
    title: "Parceria de Longo Prazo",
    desc: "Nosso objetivo é ser o braço financeiro do seu crescimento, construindo uma relação B2B de confiança duradoura.",
    icon: "\uD83E\uDD1D",
  },
];

export default function LandingSobre() {
  return (
    <LandingLayout>
      {/* ══ HERO ══ */}
      <section className="lp-inner-hero">
        <div className="lp-container lp-inner-hero-content">
          <h1 className="lp-inner-hero-title">
            Impulsionando o Empreendedor Manauara com Crédito Justo e Local
          </h1>
          <p className="lp-inner-hero-sub">
            Na FidelizaCred, entendemos que o coração de Manaus bate no ritmo
            das suas empresas. Somos uma instituição financeira nascida e criada
            na região, com o propósito exclusivo de oferecer soluções de crédito
            corporativo que realmente apoiem a expansão e a solidez dos negócios
            locais.
          </p>
        </div>
      </section>

      {/* ══ POR QUE ESCOLHER ══ */}
      <section className="lp-section lp-white">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2-primary">Por que escolher a FidelizaCred?</h2>
          </div>
          <div className="lp-steps-grid">
            {DIFERENCIAIS.map((d, i) => (
              <div key={i} className="lp-step-card">
                <div className="lp-step-icon-box">
                  <span className="lp-step-emoji">{d.icon}</span>
                </div>
                <h3 className="lp-step-title">{d.title}</h3>
                <p className="lp-step-desc">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOLUÇÃO SOB MEDIDA ══ */}
      <section className="lp-section lp-glass-section">
        <div className="lp-container">
          <div className="lp-sobre-box">
            <div className="lp-sobre-badge">
              Soluções Sob Medida para o Seu Negócio
            </div>
            <p className="lp-sobre-text">
              Sabemos que cada empresa tem suas próprias necessidades e
              desafios. Por isso, não oferecemos pacotes prontos. Nossa equipe
              de especialistas analisa o seu perfil corporativo e desenha a
              melhor estratégia de crédito para o seu momento, seja para capital
              de giro, expansão, compra de equipamentos ou renegociação de
              dívidas.
            </p>
            <blockquote className="lp-sobre-quote">
              &ldquo;Sua empresa merece um parceiro financeiro que jogue no seu
              time.&rdquo;
            </blockquote>
            <div className="lp-sobre-ctas">
              <Link to="/simular" className="lp-cta-primary">
                Simular Crédito PJ
              </Link>
              <Link
                to="/servicos"
                className="lp-cta-outline lp-cta-outline-dark"
              >
                Ver Serviços
              </Link>
            </div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
