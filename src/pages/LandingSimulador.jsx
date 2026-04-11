import React, { useState, useMemo } from "react";
import LandingLayout from "../components/LandingLayout";
import "../styles/landing.css";

const FAIXAS = [
  { min: 1, max: 10000, taxa: 0.0655, label: "R$ 1 a R$ 10.000", pct: "6,55%" },
  {
    min: 10001,
    max: 13000,
    taxa: 0.063,
    label: "R$ 10.001 a R$ 13.000",
    pct: "6,3%",
  },
  {
    min: 13001,
    max: 17000,
    taxa: 0.06,
    label: "R$ 13.001 a R$ 17.000",
    pct: "6%",
  },
  {
    min: 17001,
    max: 20000,
    taxa: 0.057,
    label: "R$ 17.001 a R$ 20.000",
    pct: "5,7%",
  },
  {
    min: 20001,
    max: 25000,
    taxa: 0.054,
    label: "R$ 20.001 a R$ 25.000",
    pct: "5,4%",
  },
  {
    min: 25001,
    max: 30000,
    taxa: 0.052,
    label: "R$ 25.001 a R$ 30.000",
    pct: "5,2%",
  },
  {
    min: 30001,
    max: 40000,
    taxa: 0.049,
    label: "R$ 30.001 a R$ 40.000",
    pct: "4,9%",
  },
];

function getFaixa(value) {
  return (
    FAIXAS.find((f) => value >= f.min && value <= f.max) ||
    FAIXAS[FAIXAS.length - 1]
  );
}

function calcPMT(pv, i, n) {
  if (i === 0) return pv / n;
  const factor = Math.pow(1 + i, n);
  return (pv * (i * factor)) / (factor - 1);
}

function fmt(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function LandingSimulador() {
  const [valor, setValor] = useState(10000);
  const [prazo, setPrazo] = useState(24);

  const faixa = useMemo(() => getFaixa(valor), [valor]);
  const taxa = faixa.taxa;
  const parcela = useMemo(
    () => calcPMT(valor, taxa, prazo),
    [valor, taxa, prazo],
  );

  const handleWhatsApp = () => {
    const phone = "5592992202300";
    const msg = encodeURIComponent(
      `Olá! Tenho interesse em analisar um crédito PJ.\nValor: ${fmt(valor)}\nPrazo: ${prazo} meses\nParcela estimada: ${fmt(parcela)}`,
    );
    window.open(
      `https://wa.me/${phone}?text=${msg}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <LandingLayout>
      <section className="lp-inner-hero">
        <div className="lp-container lp-inner-hero-content">
          <h1 className="lp-inner-hero-title">
            Simulador de Crédito Empresarial
          </h1>
          <p className="lp-inner-hero-sub">
            Planeje o fluxo de caixa da sua empresa com transparência e
            previsibilidade
          </p>
        </div>
      </section>

      <section className="lp-section lp-white">
        <div className="lp-container">
          <div className="lp-sim-wrapper">
            <div className="lp-sim-panel">
              <h2 className="lp-sim-panel-title">Dados da Operação</h2>
              <p className="lp-sim-panel-sub">
                Preencha os campos abaixo para simular o crédito para seu CNPJ
              </p>

              <div className="lp-sim-field">
                <label className="lp-sim-label">Valor do Empréstimo (R$)</label>
                <input
                  type="number"
                  className="lp-sim-input"
                  value={valor}
                  min={1000}
                  max={40000}
                  step={500}
                  onChange={(e) =>
                    setValor(
                      Math.max(1000, Math.min(40000, Number(e.target.value))),
                    )
                  }
                />
                <div className="lp-sim-range-wrap">
                  <input
                    type="range"
                    className="lp-sim-range"
                    min={1000}
                    max={40000}
                    step={500}
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                  />
                  <div className="lp-sim-range-labels">
                    <span>R$ 1.000</span>
                    <span>R$ 40.000</span>
                  </div>
                </div>
                <span className="lp-sim-hint">
                  Valor entre R$ 1.000 e R$ 40.000
                </span>
              </div>

              <div className="lp-sim-field" style={{ marginTop: "1.2rem" }}>
                <label className="lp-sim-label">Prazo (meses)</label>
                <input
                  type="number"
                  className="lp-sim-input"
                  value={prazo}
                  min={12}
                  max={120}
                  step={1}
                  onChange={(e) =>
                    setPrazo(
                      Math.max(12, Math.min(120, Number(e.target.value))),
                    )
                  }
                />
                <div className="lp-sim-range-wrap">
                  <input
                    type="range"
                    className="lp-sim-range"
                    min={12}
                    max={120}
                    step={6}
                    value={prazo}
                    onChange={(e) => setPrazo(Number(e.target.value))}
                  />
                  <div className="lp-sim-range-labels">
                    <span>12 meses</span>
                    <span>120 meses</span>
                  </div>
                </div>
                <span className="lp-sim-hint">Prazo entre 12 e 120 meses</span>
              </div>
            </div>

            <div className="lp-sim-result">
              <h2 className="lp-sim-result-title">Projeção Financeira</h2>
              <p className="lp-sim-result-sub">
                Valores calculados automaticamente com base na taxa corporativa
              </p>

              <div className="lp-sim-parcela-box">
                <span className="lp-sim-parcela-label">
                  Valor da Parcela Mensal
                </span>
                <span className="lp-sim-parcela-value">{fmt(parcela)}</span>
              </div>

              <div className="lp-sim-details">
                <div className="lp-sim-detail-row">
                  <span>Capital Solicitado:</span>
                  <span className="lp-sim-detail-val">{fmt(valor)}</span>
                </div>
                <div className="lp-sim-detail-row">
                  <span>Prazo da Operação:</span>
                  <span className="lp-sim-detail-val">{prazo} meses</span>
                </div>
              </div>

              <button className="lp-sim-btn" onClick={handleWhatsApp}>
                Solicitar Análise para CNPJ
              </button>
            </div>
          </div>

          <div className="lp-sim-avisos">
            <h3 className="lp-sim-avisos-title">Avisos Importantes</h3>
            <ul className="lp-sim-avisos-list">
              <li>
                Esta é uma simulação referencial. As condições finais dependem
                da análise de crédito e balanço da empresa.
              </li>
              <li>
                As taxas de juros são dinâmicas e variam de acordo com o
                montante solicitado, garantindo as melhores condições para o seu
                negócio.
              </li>
              <li>
                Não cobramos taxas antecipadas para análise ou liberação de
                crédito corporativo.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
