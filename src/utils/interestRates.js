// src/utils/interestRates.js
// Tabela de taxas de juros por faixa de valor

export const INTEREST_FAIXAS = [
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

/**
 * Obtém a faixa de taxa aplicável ao valor informado
 * @param {number} value - Valor do empréstimo
 * @returns {object} Objeto com min, max, taxa, label, pct
 */
export function getFaixaByValue(value) {
  return (
    INTEREST_FAIXAS.find((f) => value >= f.min && value <= f.max) ||
    INTEREST_FAIXAS[INTEREST_FAIXAS.length - 1]
  );
}

/**
 * Obtém a taxa como valor decimal (0.0655 para 6.55%)
 * @param {number} value - Valor do empréstimo
 * @returns {number} Taxa em decimal (ex: 0.0655)
 */
export function getTaxaByValue(value) {
  return getFaixaByValue(value).taxa;
}

/**
 * Obtém a taxa como porcentagem string (ex: "6,55%")
 * @param {number} value - Valor do empréstimo
 * @returns {string} Taxa em formato percentual
 */
export function getTaxaPctByValue(value) {
  return getFaixaByValue(value).pct;
}
