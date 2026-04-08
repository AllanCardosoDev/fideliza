import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing-page page active" style={{ padding: 40 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
        <img
          src="/logo.jpeg"
          alt="FidelizaCred"
          style={{ width: 120, borderRadius: 8, marginBottom: 12 }}
        />
        <h1 style={{ marginBottom: 6 }}>Fideliza Cred</h1>
        <p style={{ color: "var(--text-dim)", marginBottom: 20 }}>
          Plataforma de gestão financeira. Acesse o painel para ver indicadores,
          clientes e operações.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {/* Pass `from` so Login knows where to redirect after success */}
          <Link
            to="/login"
            state={{ from: "/dashboard" }}
            className="btn btn-gold"
          >
            Ir para Login
          </Link>
          <a href="#" className="btn btn-outline">
            Saiba Mais
          </a>
        </div>

        <p style={{ marginTop: 24, color: "var(--text-dim)" }}>
          Ao entrar, você será redirecionado ao Dashboard.
        </p>
      </div>
    </div>
  );
}
