// src/pages/Contratos.jsx
import React, { useContext, useState, useMemo } from "react";
import { AppContext } from "../App";
import { fmt, fmtDate, calcPMT } from "../utils/helpers";
import {
  generateContractProtocol,
  getNextContractProtocolNumber,
  generateContractPDF,
  generateContractWord,
} from "../utils/contractTemplateHelpers";
import "../styles/ContractPage.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

const STATUS_LABELS = {
  draft: { label: "Rascunho", cls: "draft" },
  active: { label: "Ativo", cls: "active" },
  signed: { label: "Assinado", cls: "signed" },
  cancelled: { label: "Cancelado", cls: "cancelled" },
};

const EMPTY_FORM = {
  mutuaria_name: "",
  mutuaria_cnpj: "",
  mutuaria_address: "",
  valor_contratado: "",
  taxa_juros: "",
  qtde_parcelas: "",
  valor_parcela: "",
  aliquota_iof: "0",
  data_contrato: TODAY,
  start_date: "",
  status: "active",
  client_id: null,
  loan_id: null,
};

// ─── Contract Form Modal ───────────────────────────────────────────────────────

function ContractFormModal({
  mode, // "manual" | "from_loan"
  initial,
  loans,
  clients,
  contracts,
  onSave,
  onCancel,
  isSaving,
}) {
  const [activeTab, setActiveTab] = useState(mode);

  // Auto-generate protocol (used as default for new contracts)
  const autoProtocol = useMemo(() => {
    if (initial?.protocol) return initial.protocol;
    const seq = getNextContractProtocolNumber(contracts);
    return generateContractProtocol(seq);
  }, [contracts, initial]);

  const [protocol, setProtocol] = useState(autoProtocol);
  const [protocolEditing, setProtocolEditing] = useState(false);

  const [form, setForm] = useState(() => {
    if (!initial) return { ...EMPTY_FORM };
    // Extrair apenas campos que existem na tabela (evitar `clients` do join)
    const {
      mutuaria_name,
      mutuaria_cnpj,
      mutuaria_address,
      valor_contratado,
      taxa_juros,
      qtde_parcelas,
      valor_parcela,
      aliquota_iof,
      data_contrato,
      start_date,
      status,
      client_id,
      loan_id,
    } = initial;
    return {
      mutuaria_name: mutuaria_name || "",
      mutuaria_cnpj: mutuaria_cnpj || "",
      mutuaria_address: mutuaria_address || "",
      valor_contratado: String(valor_contratado || ""),
      taxa_juros: String(taxa_juros || ""),
      qtde_parcelas: String(qtde_parcelas || ""),
      valor_parcela: String(valor_parcela || ""),
      aliquota_iof: String(aliquota_iof ?? "0"),
      data_contrato: data_contrato || TODAY,
      start_date: start_date || "",
      status: status || "active",
      client_id: client_id || null,
      loan_id: loan_id || null,
    };
  });
  const [errors, setErrors] = useState({});
  const [loanSearch, setLoanSearch] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);

  const set = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Auto-calculate valor_parcela when fields change
  const calcParcela = (value, taxa, parcelas) => {
    const v = parseFloat(String(value).replace(",", ".")) || 0;
    const r = (parseFloat(taxa) || 0) / 100;
    const n = parseInt(parcelas) || 0;
    if (v > 0 && r > 0 && n > 0) return calcPMT(r, n, v).toFixed(2);
    return "";
  };

  const handleFieldChange = (field, val) => {
    const next = { ...form, [field]: val };
    if (["valor_contratado", "taxa_juros", "qtde_parcelas"].includes(field)) {
      const pmt = calcParcela(
        field === "valor_contratado" ? val : next.valor_contratado,
        field === "taxa_juros" ? val : next.taxa_juros,
        field === "qtde_parcelas" ? val : next.qtde_parcelas,
      );
      if (pmt) next.valor_parcela = pmt;
    }
    setForm(next);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Protocol is now managed as local state (protocol, setProtocol) above

  // Filtered loan list
  const filteredLoans = useMemo(() => {
    const q = loanSearch.toLowerCase();
    return loans
      .filter((l) => l.status === "active" || l.status === "paid")
      .filter(
        (l) =>
          !q ||
          (l.client || "").toLowerCase().includes(q) ||
          (l.protocol || "").toLowerCase().includes(q),
      );
  }, [loans, loanSearch]);

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    // Find matching client for address
    const client = clients.find(
      (c) =>
        c.id === loan.client_id ||
        (c.name || "").toLowerCase() === (loan.client || "").toLowerCase(),
    );
    const address = client
      ? [
          client.street,
          client.number,
          client.neighborhood,
          client.city,
          client.state,
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const pmt =
      loan.interest_type === "compound"
        ? calcPMT(
            (parseFloat(loan.interest_rate) || 0) / 100,
            parseInt(loan.installments) || 1,
            parseFloat(loan.value) || 0,
          ).toFixed(2)
        : (
            ((parseFloat(loan.value) || 0) *
              (1 +
                ((parseFloat(loan.interest_rate) || 0) / 100) *
                  (parseInt(loan.installments) || 1))) /
            (parseInt(loan.installments) || 1)
          ).toFixed(2);

    setForm({
      mutuaria_name: client?.name || loan.client || "",
      mutuaria_cnpj: client?.cpf_cnpj || client?.cnpj || "",
      mutuaria_address: address,
      valor_contratado: String(loan.value || ""),
      taxa_juros: String(loan.interest_rate || ""),
      qtde_parcelas: String(loan.installments || ""),
      valor_parcela: pmt,
      aliquota_iof: "0",
      data_contrato: TODAY,
      start_date: loan.start_date || "",
      status: "active",
      client_id: client?.id || loan.client_id || null,
      loan_id: loan.id,
    });
  };

  const validate = () => {
    const e = {};
    if (!form.mutuaria_name.trim()) e.mutuaria_name = "Nome obrigatório";
    if (!form.valor_contratado) e.valor_contratado = "Valor obrigatório";
    if (!form.taxa_juros) e.taxa_juros = "Taxa obrigatória";
    if (!form.qtde_parcelas) e.qtde_parcelas = "Qtd. parcelas obrigatória";
    if (!form.valor_parcela) e.valor_parcela = "Valor parcela obrigatório";
    if (!form.data_contrato) e.data_contrato = "Data obrigatória";
    if (!form.start_date) e.start_date = "1ª parcela obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    // Use whatever protocol the user has (either auto-generated or manually edited)
    onSave({ ...form, protocol });
  };

  const isFromLoan = activeTab === "from_loan";

  return (
    <div className="contract-modal-overlay">
      <div className="contract-modal">
        {/* Header */}
        <div className="contract-modal-header">
          <h2>
            {isFromLoan
              ? "📋 Contrato a partir de Empréstimo"
              : "📝 Novo Contrato"}
          </h2>
          <button className="contract-modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="contract-modal-body">
          {/* Mode tabs (only when creating, not editing) */}
          {!initial && (
            <div className="contract-mode-tabs">
              <button
                className={`contract-mode-tab ${activeTab === "manual" ? "active" : ""}`}
                onClick={() => setActiveTab("manual")}
              >
                ✏️ Preencher Manualmente
              </button>
              <button
                className={`contract-mode-tab ${activeTab === "from_loan" ? "active" : ""}`}
                onClick={() => setActiveTab("from_loan")}
              >
                🔍 Buscar por Empréstimo
              </button>
            </div>
          )}

          {/* Protocol — editable */}
          <div className="protocol-preview" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔖 Protocolo:</span>
            {protocolEditing ? (
              <input
                type="text"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                onBlur={() => setProtocolEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setProtocolEditing(false)}
                autoFocus
                style={{
                  background: 'var(--card-bg, #fff)',
                  border: '1px solid var(--primary, #4a6cf7)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--primary, #4a6cf7)',
                  width: 200,
                }}
              />
            ) : (
              <>
                <strong>{protocol}</strong>
                <button
                  type="button"
                  onClick={() => setProtocolEditing(true)}
                  title="Editar número do contrato"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    padding: '2px 4px',
                    opacity: 0.7,
                  }}
                >
                  ✏️
                </button>
              </>
            )}
          </div>

          {/* Loan selector (from_loan mode) */}
          {isFromLoan && (
            <div style={{ marginBottom: 16 }}>
              <div className="cf-group" style={{ marginBottom: 8 }}>
                <label>Buscar Empréstimo (cliente ou protocolo)</label>
                <input
                  type="text"
                  value={loanSearch}
                  onChange={(e) => setLoanSearch(e.target.value)}
                  placeholder="Digite nome do cliente ou protocolo..."
                />
              </div>
              <div className="loan-selector-list">
                {filteredLoans.length === 0 ? (
                  <div
                    style={{
                      padding: "14px",
                      color: "#888",
                      fontSize: "0.85rem",
                      textAlign: "center",
                    }}
                  >
                    Nenhum empréstimo ativo/pago encontrado
                  </div>
                ) : (
                  filteredLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className={`loan-selector-item ${selectedLoan?.id === loan.id ? "selected" : ""}`}
                      onClick={() => handleSelectLoan(loan)}
                    >
                      <div>
                        <div className="loan-client">{loan.client || "—"}</div>
                        <div className="loan-detail">
                          {loan.protocol || `#${loan.id}`} &nbsp;|&nbsp;{" "}
                          {fmt(loan.value)} &nbsp;|&nbsp; {loan.installments}x
                        </div>
                      </div>
                      {selectedLoan?.id === loan.id && (
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>
                          ✓
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="contract-form-grid">
            {/* Mutuária */}
            <div className="cf-group full-width">
              <label>Razão Social / Nome do Mutuário *</label>
              <input
                type="text"
                value={form.mutuaria_name}
                onChange={(e) => set("mutuaria_name", e.target.value)}
                className={errors.mutuaria_name ? "has-error" : ""}
                placeholder="Nome completo ou Razão Social"
              />
              {errors.mutuaria_name && (
                <span className="error-msg">{errors.mutuaria_name}</span>
              )}
            </div>

            <div className="cf-group">
              <label>CNPJ / CPF do Mutuário</label>
              <input
                type="text"
                value={form.mutuaria_cnpj}
                onChange={(e) => set("mutuaria_cnpj", e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="cf-group">
              <label>Endereço do Mutuário</label>
              <input
                type="text"
                value={form.mutuaria_address}
                onChange={(e) => set("mutuaria_address", e.target.value)}
                placeholder="Rua, nº, Bairro, Cidade – Estado"
              />
            </div>

            {/* Dados da Operação */}
            <div className="cf-group">
              <label>Valor Total Contratado (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valor_contratado}
                onChange={(e) =>
                  handleFieldChange("valor_contratado", e.target.value)
                }
                className={errors.valor_contratado ? "has-error" : ""}
                placeholder="0,00"
              />
              {errors.valor_contratado && (
                <span className="error-msg">{errors.valor_contratado}</span>
              )}
            </div>

            <div className="cf-group">
              <label>Taxa de Juros (% a.m.) *</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.taxa_juros}
                onChange={(e) =>
                  handleFieldChange("taxa_juros", e.target.value)
                }
                className={errors.taxa_juros ? "has-error" : ""}
                placeholder="2.8"
              />
              {errors.taxa_juros && (
                <span className="error-msg">{errors.taxa_juros}</span>
              )}
            </div>

            <div className="cf-group">
              <label>Quantidade de Parcelas *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.qtde_parcelas}
                onChange={(e) =>
                  handleFieldChange("qtde_parcelas", e.target.value)
                }
                className={errors.qtde_parcelas ? "has-error" : ""}
                placeholder="18"
              />
              {errors.qtde_parcelas && (
                <span className="error-msg">{errors.qtde_parcelas}</span>
              )}
            </div>

            <div className="cf-group">
              <label>Valor da Parcela (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valor_parcela}
                onChange={(e) => set("valor_parcela", e.target.value)}
                className={errors.valor_parcela ? "has-error" : ""}
                placeholder="Calculado automaticamente"
              />
              {errors.valor_parcela && (
                <span className="error-msg">{errors.valor_parcela}</span>
              )}
            </div>

            <div className="cf-group">
              <label>Alíquota IOF (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.aliquota_iof}
                onChange={(e) => set("aliquota_iof", e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="cf-group">
              <label>Data do Contrato *</label>
              <input
                type="date"
                value={form.data_contrato}
                onChange={(e) => set("data_contrato", e.target.value)}
                className={errors.data_contrato ? "has-error" : ""}
              />
              {errors.data_contrato && (
                <span className="error-msg">{errors.data_contrato}</span>
              )}
            </div>

            <div className="cf-group">
              <label>Data da 1ª Parcela *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className={errors.start_date ? "has-error" : ""}
              />
              {errors.start_date && (
                <span className="error-msg">{errors.start_date}</span>
              )}
            </div>

            <div className="cf-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="draft">Rascunho</option>
                <option value="active">Ativo</option>
                <option value="signed">Assinado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="contract-modal-footer">
          <button
            type="button"
            className="btn-confirm-cancel"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-contract-new"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? "Salvando…"
              : initial
                ? "💾 Salvar Alterações"
                : "✅ Salvar Contrato"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Download Modal ────────────────────────────────────────────────────────────

function DownloadModal({ contract, onClose }) {
  const [wordLoading, setWordLoading] = React.useState(false);
  const [wordError, setWordError] = React.useState(null);

  const handlePDF = () => {
    generateContractPDF(contract);
    onClose();
  };
  const handleWord = async () => {
    setWordLoading(true);
    setWordError(null);
    try {
      await generateContractWord(contract);
      onClose();
    } catch (err) {
      setWordError(err.message || "Erro ao gerar Word.");
    } finally {
      setWordLoading(false);
    }
  };

  return (
    <div className="contract-modal-overlay">
      <div className="confirm-modal" style={{ maxWidth: 420 }}>
        <h3>⬇️ Baixar Contrato</h3>
        <p style={{ marginBottom: 16, color: "#555", fontSize: "0.88rem" }}>
          Protocolo: <strong>{contract.protocol}</strong>
          <br />
          Mutuário: <strong>{contract.mutuaria_name}</strong>
        </p>
        <div className="download-picker">
          <div className="download-option" onClick={handlePDF}>
            <span className="dl-icon">📄</span>
            <div>
              <div className="dl-label">PDF</div>
              <div className="dl-sub">Adobe Reader, impressão direta</div>
            </div>
          </div>
          <div
            className="download-option"
            onClick={handleWord}
            style={wordLoading ? { opacity: 0.6, pointerEvents: "none" } : {}}
          >
            <span className="dl-icon">📝</span>
            <div>
              <div className="dl-label">
                {wordLoading ? "Gerando..." : "Word (.docx)"}
              </div>
              <div className="dl-sub">Microsoft Word, editável</div>
            </div>
          </div>
        </div>
        {wordError && (
          <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: 8 }}>
            {wordError}
          </p>
        )}
        <div
          className="confirm-actions"
          style={{ marginTop: 16, justifyContent: "flex-end" }}
        >
          <button className="btn-confirm-cancel" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ contract, onConfirm, onCancel }) {
  return (
    <div className="contract-modal-overlay">
      <div className="confirm-modal">
        <h3>🗑️ Excluir Contrato</h3>
        <p>
          Deseja excluir o contrato <strong>{contract.protocol}</strong> de{" "}
          <strong>{contract.mutuaria_name}</strong>? Esta ação não poderá ser
          desfeita.
        </p>
        <div className="confirm-actions">
          <button className="btn-confirm-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-confirm-delete" onClick={onConfirm}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Contratos() {
  const {
    contracts,
    loans,
    clients,
    createContractRecord,
    editContractRecord,
    removeContractRecord,
    addToast,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("manual"); // "manual" | "from_loan"
  const [editingContract, setEditingContract] = useState(null);
  const [downloadTarget, setDownloadTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // KPIs
  const kpiTotal = contracts.length;
  const kpiActive = contracts.filter((c) => c.status === "active").length;
  const kpiSigned = contracts.filter((c) => c.status === "signed").length;
  const kpiDraft = contracts.filter((c) => c.status === "draft").length;

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contracts.filter((c) => {
      const matchSearch =
        !q ||
        (c.mutuaria_name || "").toLowerCase().includes(q) ||
        (c.protocol || "").toLowerCase().includes(q) ||
        (c.mutuaria_cnpj || "").includes(q);
      const matchStatus = !filterStatus || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [contracts, search, filterStatus]);

  const openNewManual = () => {
    setEditingContract(null);
    setModalMode("manual");
    setShowModal(true);
  };
  const openNewFromLoan = () => {
    setEditingContract(null);
    setModalMode("from_loan");
    setShowModal(true);
  };
  const openEdit = (c) => {
    setEditingContract(c);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      if (editingContract) {
        await editContractRecord(editingContract.id, formData);
        addToast?.("Contrato atualizado com sucesso!", "success");
      } else {
        await createContractRecord(formData);
        addToast?.("Contrato criado com sucesso!", "success");
      }
      setShowModal(false);
      setEditingContract(null);
    } catch (err) {
      addToast?.(`Erro: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeContractRecord(deleteTarget.id);
      addToast?.("Contrato excluído.", "info");
      setDeleteTarget(null);
    } catch (err) {
      addToast?.(`Erro ao excluir: ${err.message}`, "error");
    }
  };

  return (
    <div className="contracts-page">
      {/* Page title */}
      <h1>📋 Contratos</h1>
      <p className="page-subtitle">
        Gere e gerencie contratos de empréstimo no padrão FidelizaCred
      </p>

      {/* KPIs */}
      <div className="contracts-kpis">
        <div className="contract-kpi-card">
          <span className="kpi-label">Total</span>
          <span className="kpi-value">{kpiTotal}</span>
        </div>
        <div className="contract-kpi-card green">
          <span className="kpi-label">Ativos</span>
          <span className="kpi-value">{kpiActive}</span>
        </div>
        <div className="contract-kpi-card blue">
          <span className="kpi-label">Assinados</span>
          <span className="kpi-value">{kpiSigned}</span>
        </div>
        <div className="contract-kpi-card orange">
          <span className="kpi-label">Rascunhos</span>
          <span className="kpi-value">{kpiDraft}</span>
        </div>
      </div>

      {/* Top bar */}
      <div className="contracts-topbar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nome, protocolo ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid var(--border, #ddd)",
            fontSize: "0.9rem",
            background: "var(--card-bg,#fff)",
            color: "var(--text-main,#1e1e1e)",
          }}
        >
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="active">Ativo</option>
          <option value="signed">Assinado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <button className="btn-contract-loan" onClick={openNewFromLoan}>
          🔍 Do Empréstimo
        </button>
        <button className="btn-contract-new" onClick={openNewManual}>
          + Novo Contrato
        </button>
      </div>

      {/* Table */}
      <div className="contracts-table-wrap">
        {filtered.length === 0 ? (
          <div className="contracts-empty">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p>Nenhum contrato encontrado.</p>
            <p style={{ fontSize: "0.82rem" }}>
              Clique em <strong>+ Novo Contrato</strong> ou{" "}
              <strong>🔍 Do Empréstimo</strong> para criar.
            </p>
          </div>
        ) : (
          <table className="contracts-table">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Mutuário</th>
                <th>CNPJ/CPF</th>
                <th>Valor</th>
                <th>Parcelas</th>
                <th>Taxa</th>
                <th>Data Contrato</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const st = STATUS_LABELS[c.status] || STATUS_LABELS.draft;
                return (
                  <tr key={c.id}>
                    <td>
                      <span className="contract-protocol">{c.protocol}</span>
                    </td>
                    <td>{c.mutuaria_name || "—"}</td>
                    <td style={{ fontSize: "0.82rem", color: "#888" }}>
                      {c.mutuaria_cnpj || "—"}
                    </td>
                    <td>
                      {c.valor_contratado ? fmt(c.valor_contratado) : "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>{c.qtde_parcelas}x</td>
                    <td style={{ textAlign: "center" }}>{c.taxa_juros}%</td>
                    <td>{fmtDate(c.data_contrato)}</td>
                    <td>
                      <span className={`contract-status ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <div className="contract-actions">
                        {/* Download (PDF ou Word) */}
                        <button
                          className="btn-action-icon pdf"
                          title="Baixar Contrato (PDF / Word)"
                          onClick={() => setDownloadTarget(c)}
                        >
                          ⬇
                        </button>
                        {/* Editar */}
                        <button
                          className="btn-action-icon edit"
                          title="Editar"
                          onClick={() => openEdit(c)}
                        >
                          ✏
                        </button>
                        {/* Excluir */}
                        <button
                          className="btn-action-icon del"
                          title="Excluir"
                          onClick={() => setDeleteTarget(c)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Contract form modal */}
      {showModal && (
        <ContractFormModal
          mode={modalMode}
          initial={editingContract}
          loans={loans}
          clients={clients}
          contracts={contracts}
          onSave={handleSave}
          onCancel={() => {
            setShowModal(false);
            setEditingContract(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Download picker modal */}
      {downloadTarget && (
        <DownloadModal
          contract={downloadTarget}
          onClose={() => setDownloadTarget(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirm
          contract={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
