import React, { useState, useMemo } from "react";
import LandingLayout from "../components/LandingLayout";
import "../styles/landing.css";

/* Taxa mensal dinâmica conforme valor solicitado */
function getRate(value) {
  if (value >= 500000) return 0.018;
  if (value >= 200000) return 0.025;
  if (value >= 50000) return 0.035;
  return 0.042;
}

/* Fórmula Price (PMT) */
function calcPMT(pv, i, n) {
  if (i === 0) return pv / n;
  const factor = Math.pow(1 + i, n);
  return (pv * (i * factor)) / (factor - 1);
}

function fmt(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function LandingSimulador() {
  const [valor, setValor] = useState(50000);
  const [prazo, setPrazo] = useState(24);

  const taxa = useMemo(() => getRate(valor), [valor]);
  const parcela = useMemo(
    () => calcPMT(valor, taxa, prazo),
    [valor, taxa, prazo],
  );
  const totalPago = useMemo(() => parcela * prazo, [parcela, prazo]);
  const totalJuros = useMemo(() => totalPago - valor, [totalPago, valor]);

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
      {/* ══ HERO ══ */}
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

      {/* ══ SIMULADOR ══ */}
      <section className="lp-section lp-white">
        <div className="lp-container">
          <div className="lp-sim-wrapper">
            {/* Painel esquerdo: inputs */}
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
                  min={10000}
                  max={1000000}
                  step={1000}
                  onChange={(e) =>
                    setValor(
                      Math.max(
                        10000,
                        Math.min(1000000, Number(e.target.value)),
                      ),
                    )
                  }
                />
                <div className="lp-sim-range-wrap">
                  <input
                    type="range"
                    className="lp-sim-range"
                    min={10000}
                    max={1000000}
                    step={5000}
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                  />
                  <div className="lp-sim-range-labels">
                    <span>R$ 10.000</span>
                    <span>R$ 1.000.000</span>
                  </div>
                </div>
                <span className="lp-sim-hint">
                  Valor entre R$ 10.000 e R$ 1.000.000
                </span>
              </div>

              <div className="lp-sim-field">
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

            {/* Painel direito: resultado */}
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
                <div className="lp-sim-detail-row">
                  <span>Taxa Mensal:</span>
                  <span className="lp-sim-detail-val">
                    {(taxa * 100).toFixed(2).replace(".", ",")}% a.m.
                  </span>
                </div>
                <div className="lp-sim-detail-row">
                  <span>Total a Pagar:</span>
                  <span className="lp-sim-detail-val">{fmt(totalPago)}</span>
                </div>
                <div className="lp-sim-detail-row">
                  <span>Total de Juros:</span>
                  <span className="lp-sim-detail-val">{fmt(totalJuros)}</span>
                </div>
              </div>

              <button className="lp-sim-btn" onClick={handleWhatsApp}>
                Solicitar Análise para CNPJ
              </button>
            </div>
          </div>

          {/* Avisos */}
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
