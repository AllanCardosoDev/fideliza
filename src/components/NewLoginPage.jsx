import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const NewLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (
        email === "login" &&
        password === (localStorage.getItem("fc_admin_password") || "361011")
      ) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            email,
            role: "admin",
            id: "1",
            name: "Administrador",
          }),
        );
        localStorage.setItem("fc_token", "authenticated");

        navigate(from, { replace: true });
        window.location.reload();
      } else {
        setError("Credenciais inválidas. Tente novamente.");
      }
    }, 1000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "linear-gradient(to bottom right, #f3f4f6, #e5e7eb)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "28rem" }}>
        {/* Back Button */}
        <div style={{ marginBottom: "2rem" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              color: "#4b5563",
              textDecoration: "none",
              fontWeight: "500",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#16a34a")}
            onMouseLeave={(e) => (e.target.style.color = "#4b5563")}
          >
            ← Voltar para o início
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: "white",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1.5rem 2rem",
              borderBottom: "1px solid #e5e7eb",
              background: "linear-gradient(to right, #dcfce7, #f0fdf4)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  background: "#16a34a",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1.125rem",
                }}
              >
                FC
              </div>
            </div>
            <h2
              style={{
                fontSize: "1.875rem",
                fontWeight: "bold",
                textAlign: "center",
                color: "#1f2937",
                margin: 0,
              }}
            >
              FidelizaCred
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#4b5563",
                textAlign: "center",
                marginTop: "0.5rem",
                margin: "0.5rem 0 0 0",
              }}
            >
              Acesso ao portal administrativo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "2rem" }}>
            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: "1rem",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "0.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#dc2626",
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Email Field */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                }}
                disabled={isLoading}
                onFocus={(e) => {
                  e.target.style.outline = "none";
                  e.target.style.boxShadow =
                    "inset 0 1px 2px rgba(0,0,0,0.05), 0 0 0 3px rgba(22,163,74,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)";
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginTop: "0.25rem",
                  margin: "0.25rem 0 0 0",
                }}
              >
                Demo: login
              </p>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.5rem",
                }}
              >
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                }}
                disabled={isLoading}
                onFocus={(e) => {
                  e.target.style.outline = "none";
                  e.target.style.boxShadow =
                    "inset 0 1px 2px rgba(0,0,0,0.05), 0 0 0 3px rgba(22,163,74,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.05)";
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  marginTop: "0.25rem",
                  margin: "0.25rem 0 0 0",
                }}
              >
                Demo: 361011
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "0.5rem",
                background: isLoading ? "#9ca3af" : "#16a34a",
                color: "white",
                fontWeight: "500",
                borderRadius: "0.5rem",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.target.style.background = "#15803d";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.target.style.background = "#16a34a";
              }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: "1rem",
                      height: "1rem",
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  ></div>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              padding: "1rem 2rem",
              background: "#f9fafb",
              borderTop: "1px solid #e5e7eb",
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                textAlign: "center",
                margin: 0,
              }}
            >
              Sistema seguro. Seus dados são protegidos.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NewLoginPage;
