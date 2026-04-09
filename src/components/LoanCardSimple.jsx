import React from "react";
import { Link } from "react-router-dom";

export default function LoanCardSimple({
  title = "Empréstimo Pessoal",
  amount = "R$ 5.000",
  rate = "1,99% a.m",
  installments = "12x",
  badge = null,
}) {
  return (
    <article className="loan-card glass-card">
      <div className="loan-card-header">
        <div className="loan-title">{title}</div>
        {badge && <div className="loan-badge">{badge}</div>}
      </div>

      <div className="loan-amount">{amount}</div>

      <div className="loan-meta">
        <span>
          <strong>Juros:</strong> {rate}
        </span>
        <span>
          <strong>Parcelas:</strong> {installments}
        </span>
      </div>

      <div className="loan-card-footer">
        <Link to="/simulador" className="btn-outline">
          Simular
        </Link>
      </div>
    </article>
  );
}
