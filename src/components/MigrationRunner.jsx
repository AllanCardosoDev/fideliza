// src/components/MigrationRunner.jsx
import React, { useState } from "react";

function MigrationRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunMigration = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(
        "/api/migrations/run-first-installment-day",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setResult({
          title: "✨ Sucesso!",
          message: data.message,
          statements: data.executedStatements,
        });
      } else {
        setError({
          title: "⚠️ Erro na Migração",
          message: data.message,
          details: data.errors,
        });
      }
    } catch (err) {
      setError({
        title: "❌ Erro de Conexão",
        message: "Não foi possível conectar ao servidor",
        details: [err.message],
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <h3>🗄️ Executar Migração SQL</h3>
      <p style={{ color: "var(--text-dim)", marginBottom: "16px" }}>
        Adicionar coluna <code>first_installment_day</code> à tabela de
        empréstimos
      </p>

      {!result && !error && (
        <div>
          <button
            onClick={handleRunMigration}
            disabled={isRunning}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isRunning ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {isRunning ? "⟳ Executando..." : "▶️ Executar Migração"}
          </button>
        </div>
      )}

      {result && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "4px",
            color: "#155724",
          }}
        >
          <h4>{result.title}</h4>
          <p>{result.message}</p>
          <p style={{ fontSize: "0.9em", marginTop: "8px" }}>
            Statements executados: <strong>{result.statements}</strong>
          </p>
          <button
            onClick={() => setResult(null)}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #155724",
              borderRadius: "4px",
              cursor: "pointer",
              color: "#155724",
              fontSize: "12px",
            }}
          >
            Fechar
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            color: "#721c24",
          }}
        >
          <h4>{error.title}</h4>
          <p>{error.message}</p>
          {error.details && error.details.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px",
                backgroundColor: "#fff3cd",
                borderRadius: "4px",
                fontSize: "0.85em",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              <strong>Detalhes:</strong>
              <ul>
                {error.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => setError(null)}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #721c24",
              borderRadius: "4px",
              cursor: "pointer",
              color: "#721c24",
              fontSize: "12px",
            }}
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}

export default MigrationRunner;
