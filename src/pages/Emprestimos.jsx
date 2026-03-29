// src/pages/Emprestimos.jsx
import React, { useContext, useState } from "react";
import { AppContext } from "../App";

function Emprestimos() {
  const { loans, openModal, closeModal, addToast, createLoan } =
    useContext(AppContext);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const statusOptions = [
    { value: "", label: "Todos" },
    { value: "active", label: "Ativos" },
    { value: "pending", label: "Pendentes" },
    { value: "overdue", label: "Atrasados" },
    { value: "paid", label: "Pagos" },
    { value: "cancelled", label: "Cancelados" },
  ];

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch = [
      loan.client,
      loan.status,
      String(loan.value),
      String(loan.installments),
      String(loan.paid),
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchesStatus = filterStatus ? loan.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  const LoanForm = () => {
    const [client, setClient] = useState("");
    const [value, setValue] = useState("");
    const [installments, setInstallments] = useState("");
    const [paid, setPaid] = useState("0");
    const [status, setStatus] = useState("active");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
      if (!client.trim() || !value || !installments) {
        addToast("Preencha cliente, valor e parcelas.", "error");
        return;
      }

      setIsSaving(true);
      try {
        await createLoan({
          client: client.trim(),
          value: parseFloat(value.replace(",", ".")) || 0,
          installments: parseInt(installments, 10) || 0,
          paid: parseInt(paid, 10) || 0,
          status,
        });
        closeModal();
      } catch (error) {
        // Erro já tratado em createLoan
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="modal-form">
        <div className="form-row">
          <label>Cliente</label>
          <input
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Nome do cliente"
          />
        </div>
        <div className="form-row">
          <label>Valor</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <div className="form-row">
          <label>Parcelas</label>
          <input
            type="number"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            placeholder="Número de parcelas"
            min="1"
          />
        </div>
        <div className="form-row">
          <label>Pagos</label>
          <input
            type="number"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>
        <div className="form-row">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions
              .filter((option) => option.value !== "")
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
        <button
          className="btn btn-gold btn-sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    );
  };

  const handleAddLoan = () => {
    openModal("Novo Empréstimo", <LoanForm />);
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Empréstimos</h2>
          <p className="page-desc">Gerencie os empréstimos concedidos</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddLoan} className="btn btn-gold btn-sm">
            + Novo Empréstimo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar empréstimo..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            className="select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Parcelas</th>
                <th>Pagos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.client}</td>
                    <td>
                      R${" "}
                      {loan.value.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{loan.installments}</td>
                    <td>{loan.paid}</td>
                    <td>
                      <span className={`status ${"status-" + loan.status}`}>
                        {loan.status === "active"
                          ? "Ativo"
                          : loan.status === "pending"
                            ? "Pendente"
                            : loan.status === "overdue"
                              ? "Atrasado"
                              : loan.status === "paid"
                                ? "Pago"
                                : loan.status === "cancelled"
                                  ? "Cancelado"
                                  : loan.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon">📄</button>
                      <button className="btn-icon">💰</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "var(--text-dim)",
                    }}
                  >
                    Nenhum empréstimo registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Emprestimos;
