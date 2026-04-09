import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";

/* ── SVG Icons ── */
const IconMenu = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconX = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconMapPin = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconPhone = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12.15a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 1.5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.4a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconMail = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconFacebook = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconInstagram = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const IconLinkedin = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const IconWhatsapp = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const NAV_LINKS = [
  { name: "Início", href: "/", isRoute: true },
  { name: "Sobre Nós", href: "/sobre", isRoute: true },
  { name: "Simulador", href: "/simular", isRoute: true },
  { name: "Serviços Corporativos", href: "/servicos", isRoute: true },
];

export default function LandingLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleWhatsApp = () => {
    const phone = "5592992202300";
    const msg = encodeURIComponent(
      "Olá! Gostaria de saber mais sobre os serviços da FidelizaCred.",
    );
    window.open(
      `https://wa.me/${phone}?text=${msg}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="lp-root">
      {/* ══ NAVBAR ══ */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <Link to="/" className="lp-brand">
            <img
              src="/logo.jpeg"
              alt="FidelizaCred Logo"
              className="lp-brand-logo"
            />
            <div className="lp-brand-name">
              <span className="lp-brand-w">Fideliza</span>
              <span className="lp-brand-gold">Cred</span>
            </div>
          </Link>

          <nav className="lp-nav-desktop">
            {NAV_LINKS.map((l) => (
              <Link key={l.name} to={l.href} className="lp-nav-link">
                {l.name}
              </Link>
            ))}
          </nav>

          <div className="lp-header-actions">
            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn-entrar"
            >
              Entrar
            </a>
            <button
              className="lp-hamburger"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="lp-nav-mobile">
            <div className="lp-nav-mobile-inner">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.name}
                  to={l.href}
                  className="lp-nav-link-mobile"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.name}
                </Link>
              ))}
              <a
                href="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-btn-entrar lp-btn-entrar-mobile"
                onClick={() => setMenuOpen(false)}
              >
                Entrar
              </a>
            </div>
          </nav>
        )}
      </header>

      {/* ══ PAGE CONTENT ══ */}
      {children}

      {/* ══ FOOTER ══ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <div className="lp-footer-brand">
                <span className="lp-footer-brand-w">Fideliza</span>
                <span className="lp-footer-brand-gold">Cred</span>
              </div>
              <p className="lp-footer-tagline">
                O parceiro financeiro estratégico para o crescimento da sua
                empresa em Manaus. Soluções corporativas sob medida.
              </p>
            </div>

            <div>
              <span className="lp-footer-heading">Contato Corporativo</span>
              <div className="lp-footer-contact">
                <div className="lp-footer-contact-row">
                  <span className="lp-footer-icon">
                    <IconMapPin />
                  </span>
                  <span>
                    Rua Ouro Preto, nº 480
                    <br />
                    Bairro Coroado, Manaus
                    <br />
                    Amazonas
                  </span>
                </div>
                <div className="lp-footer-contact-row">
                  <span className="lp-footer-icon">
                    <IconPhone />
                  </span>
                  <span>(92) 99220-2300</span>
                </div>
                <div className="lp-footer-contact-row">
                  <span className="lp-footer-icon">
                    <IconMail />
                  </span>
                  <a
                    href="mailto:financeiro@fidelizacred.com"
                    className="lp-footer-email"
                  >
                    financeiro@fidelizacred.com
                  </a>
                </div>
              </div>
            </div>

            <div>
              <span className="lp-footer-heading">Links Rápidos</span>
              <nav className="lp-footer-links">
                <Link to="/" className="lp-footer-link">
                  Início
                </Link>
                <Link to="/sobre" className="lp-footer-link">
                  Sobre Nós
                </Link>
                <Link to="/simular" className="lp-footer-link">
                  Simulador Empresarial
                </Link>
                <Link to="/servicos" className="lp-footer-link">
                  Serviços Corporativos
                </Link>
              </nav>
            </div>

            <div>
              <span className="lp-footer-heading">Redes Sociais</span>
              <div className="lp-social-row">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-social-btn"
                  aria-label="Facebook"
                >
                  <IconFacebook />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-social-btn"
                  aria-label="Instagram"
                >
                  <IconInstagram />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-social-btn"
                  aria-label="LinkedIn"
                >
                  <IconLinkedin />
                </a>
              </div>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} FidelizaCred. Todos os direitos
              reservados.
            </p>
            <div className="lp-footer-legal">
              <a href="#" className="lp-footer-legal-link">
                Política de Privacidade
              </a>
              <a href="#" className="lp-footer-legal-link">
                Termos de Serviço
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ══ WhatsApp fixo ══ */}
      <button
        className="lp-whatsapp-btn"
        onClick={handleWhatsApp}
        aria-label="Fale conosco no WhatsApp"
      >
        <IconWhatsapp />
        <span className="lp-whatsapp-tooltip">Fale conosco</span>
      </button>
    </div>
  );
}
