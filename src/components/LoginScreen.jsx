import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../App";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getEmployees } from "../services/api";

function LoginScreen() {
  const { setAuthToken, setCurrentUser, addToast } = useContext(AppContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const rawFrom = location.state?.from;
  const targetPath = rawFrom
    ? typeof rawFrom === "string"
      ? rawFrom
      : rawFrom.pathname || "/dashboard"
    : "/dashboard";

  const handleSuccess = (user, token = "fake-jwt-token") => {
    setAuthToken(token);
    localStorage.setItem("fc_token", token);
    setCurrentUser(user);
    localStorage.setItem("fc_current_user", JSON.stringify(user));
    if (addToast) addToast("Login realizado com sucesso!", "success");
    navigate(targetPath, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Preencha usuário e senha.");
      if (addToast) addToast("Preencha usuário e senha.", "error");
      return;
    }

    // Credenciais de teste do projeto
    if (
      username === "login" &&
      password === (localStorage.getItem("fc_admin_password") || "361011")
    ) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (addToast) addToast("Login realizado com sucesso!", "success");
        return handleSuccess({
          name: "Financeiro",
          access_level: "admin",
          email: username,
        });
      }, 700);
      return;
    }

    // Hardcoded admin fallback
    if (username === "admin" && password === "admin") {
      return handleSuccess({ name: "Administrador", access_level: "admin" });
    }

    if (username === "offline" && password === "offline") {
      setAuthToken("offline");
      localStorage.setItem("fc_token", "offline");
      const demo = { name: "Demo", access_level: "admin" };
      setCurrentUser(demo);
      localStorage.setItem("fc_current_user", JSON.stringify(demo));
      if (addToast) addToast("Entrando em modo demo", "success");
      navigate(targetPath, { replace: true });
      return;
    }

    // Try DB authentication
    setLoading(true);
    try {
      const res = await getEmployees();
      const employees = res?.data || [];
      const found = employees.find(
        (emp) =>
          (emp.username === username || emp.email === username) &&
          emp.password === password &&
          emp.status === "active",
      );
      if (found) {
        if (addToast) addToast("Login realizado com sucesso!", "success");
        handleSuccess(found);
      } else {
        setError("Usuário ou senha inválidos.");
        if (addToast)
          addToast("Credenciais inválidas. Tente novamente.", "error");
      }
    } catch (err) {
      setError("Erro ao autenticar. Tente novamente.");
      if (addToast) addToast("Erro ao autenticar. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Área do Cliente - FidelizaCred";
  }, []);

  const inputStyle = {
    background: "#ffffff",
    border: "1.5px solid #d1d5db",
    borderRadius: "8px",
    padding: "10px 12px 10px 38px",
    fontSize: "0.95rem",
    color: "#1a1a2e",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <section id="login-screen" className="login-screen">
      <div className="login-bg-effects">
        <div className="login-orb login-orb-1"></div>
        <div className="login-orb login-orb-2"></div>
        <div className="login-orb login-orb-3"></div>
      </div>

      <div className="login-card">
        <div className="mb-6" style={{ textAlign: "left" }}>
          <Link
            to="/"
            className="back-link"
            style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}
          >
            ← Voltar para o início
          </Link>
        </div>

        <div className="login-logo">
          <img
            src="/logo.jpeg"
            alt="FidelizaCred Logo"
            className="login-logo-img"
          />
          <h1>Portal Corporativo</h1>
          <p className="login-subtitle">
            Acesse a área exclusiva para gestão financeira da sua empresa
          </p>
        </div>

        <form id="login-form" className="login-form" onSubmit={handleLogin}>
          {error && (
            <p className="error-message" style={{ marginBottom: 12 }}>
              {error}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="login-user">E-mail Corporativo</label>
            <div className="input-icon-wrap">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21c0-3.3-3.6-6-8-6s-8 2.7-8 6" />
              </svg>
              <input
                id="login-user"
                type="text"
                placeholder="login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-pass">Senha de Acesso</label>
            <div className="input-icon-wrap">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="login-pass"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <a href="#" className="text-link" style={{ fontSize: "0.9rem" }}>
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-gold btn-full"
            disabled={loading}
          >
            {loading ? "Autenticando..." : "Acessar Portal"}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <p className="login-subtitle" style={{ fontSize: "0.85rem" }}>
            Sua empresa ainda não é cliente?{" "}
            <a href="#" className="text-link">
              Solicite uma análise
            </a>
          </p>
        </div>

        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            fontSize: "0.76rem",
            color: "var(--text-dim)",
          }}
        >
          Ao acessar, você concorda com nossos{" "}
          <a href="#" className="text-link">
            Termos de Serviço
          </a>{" "}
          e{" "}
          <a href="#" className="text-link">
            Política de Privacidade
          </a>
        </div>
      </div>
    </section>
  );
}

export default LoginScreen;
