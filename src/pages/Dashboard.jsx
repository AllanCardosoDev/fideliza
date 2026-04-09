// src/pages/Dashboard.jsx
import React, { useContext, useMemo } from "react";
import { AppContext, ThemeContext } from "../App";
import { useNavigate } from "react-router-dom";
import { fmt, fmtDate, calcPMT, getClientName } from "../utils/helpers";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { calculateGlobalKPIs } from "../utils/finance";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

// ── Helper: Build monthly cash flow ────────────────────────────────────────
// Entradas = parcelas pagas (mesma base do KPI totalRecebido)
// Saídas   = valores liberados de empréstimos (mesma base do KPI totalEmprestado)
// Saldo    = acumulado partindo do caixaInicial → último ponto = caixaDisponível
const buildMonthlyCashFlow = (loans, transactions, caixaInicial, today) => {
  // Monta os 3 meses do período (ordem crescente)
  const monthKeys = [];
  const months = {};
  for (let i = 2; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().split("T")[0].slice(0, 7);
    months[key] = {
      income: 0,
      expense: 0,
      label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    };
    monthKeys.push(key);
  }
  const firstMonth = monthKeys[0];

  const validLoans = Array.isArray(loans)
    ? loans.filter(
        (l) =>
          l.status === "active" ||
          l.status === "overdue" ||
          l.status === "paid",
      )
    : [];

  // Entradas: parcelas pagas — evento na data de vencimento calculada
  validLoans.forEach((l) => {
    const v = Number(l.value) || 0;
    const rate = (Number(l.interest_rate) || 0) / 100;
    const n = Number(l.installments) || 0;
    const paid = Number(l.paid) || 0;
    if (!v || !n || !l.start_date) return;
    const pmt = calcPMT(v, rate, n);
    const start = new Date(l.start_date + "T00:00:00");
    for (let i = 1; i <= paid; i++) {
      const due = new Date(start);
      due.setMonth(due.getMonth() + (i - 1));
      const mk = due.toISOString().split("T")[0].slice(0, 7);
      // Se caiu antes da janela → agrega no primeiro mês visível
      const target = months[mk] ? mk : mk < firstMonth ? firstMonth : null;
      if (target) months[target].income += pmt;
    }
  });

  // Saídas: desembolso do empréstimo na data de início
  validLoans.forEach((l) => {
    if (!l.start_date) return;
    const mk = l.start_date.slice(0, 7);
    const target = months[mk] ? mk : mk < firstMonth ? firstMonth : null;
    if (target) months[target].expense += Number(l.value) || 0;
  });

  // Transações manuais
  if (Array.isArray(transactions)) {
    transactions.forEach((t) => {
      const mk = new Date(t.date).toISOString().split("T")[0].slice(0, 7);
      const target = months[mk] ? mk : mk < firstMonth ? firstMonth : null;
      if (!target) return;
      const amount = Number(t.amount) || 0;
      if (t.type === "income") months[target].income += amount;
      else months[target].expense += amount;
    });
  }

  // Saldo acumulado partindo do caixaInicial
  let runningSaldo = Number(caixaInicial) || 0;
  return monthKeys.map((key) => {
    runningSaldo = runningSaldo + months[key].income - months[key].expense;
    return {
      month: months[key].label,
      monthKey: key,
      income: months[key].income,
      expense: months[key].expense,
      saldo: runningSaldo,
    };
  });
};

function Dashboard() {
  const { clients, transactions, loans, currentUser, userRole, caixa } =
    useContext(AppContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const getCss = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  // ── Today (fixed reference) ────────────────────────────────────────────────
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Access Control: Employees see only their own clients and loans
  const accessibleClients = useMemo(() => {
    if (userRole === "employee" && currentUser?.id) {
      return clients.filter(
        (c) => c.created_by === currentUser.id || c.owner_id === currentUser.id,
      );
    }
    return clients;
  }, [clients, currentUser, userRole]);

  const accessibleLoans = useMemo(() => {
    if (userRole === "employee" && currentUser?.id && clients) {
      const myClientIds = clients
        .filter(
          (c) =>
            c.created_by === currentUser.id || c.owner_id === currentUser.id,
        )
        .map((c) => c.id);
      return loans.filter((l) => myClientIds.includes(l.client_id));
    }
    return loans;
  }, [loans, clients, currentUser, userRole]);

  // ── KPIs calculated uniformly ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const metrics = calculateGlobalKPIs(
      accessibleLoans,
      transactions,
      Number(caixa) || 0,
      today,
    );

    const activeClients = accessibleClients.filter(
      (c) => c.status === "active" || c.status === "overdue",
    ).length;

    return {
      ...metrics,
      activeClients,
    };
  }, [accessibleLoans, accessibleClients, transactions, caixa, today]);

  // ── Top debtors ───────────────────────────────────────────────────────────
  const topDebtors = useMemo(() => {
    const byClient = {};
    accessibleLoans.forEach((l) => {
      if (l.status === "paid" || l.status === "cancelled") return;
      const key = getClientName(l.client);
      const pmt = calcPMT(
        Number(l.value) || 0,
        (Number(l.interest_rate) || 0) / 100,
        Number(l.installments) || 1,
      );
      const remaining =
        ((Number(l.installments) || 0) - (Number(l.paid) || 0)) * pmt;
      byClient[key] = (byClient[key] || 0) + remaining;
    });
    return Object.entries(byClient)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [accessibleLoans]);

  // ── Upcoming due installments ─────────────────────────────────────────────
  const upcomingDues = useMemo(() => {
    const items = [];
    const today = new Date();
    accessibleLoans.forEach((l) => {
      if (l.status === "paid" || l.status === "cancelled") return;
      if (!l.start_date) return;
      const nextInstallment = (Number(l.paid) || 0) + 1;
      if (nextInstallment > Number(l.installments)) return;
      const due = new Date(l.start_date + "T00:00:00");
      due.setMonth(due.getMonth() + (nextInstallment - 1));
      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      const pmt = calcPMT(
        Number(l.value) || 0,
        (Number(l.interest_rate) || 0) / 100,
        Number(l.installments) || 1,
      );
      items.push({ loan: l, due, diff, pmt, installmentNo: nextInstallment });
    });
    return items.sort((a, b) => a.due - b.due).slice(0, 8);
  }, [accessibleLoans]);

  // ── Monthly Cash Flow (Last 3 months) ──────────────────────────────────────
  const monthlyCashFlow = useMemo(() => {
    return buildMonthlyCashFlow(
      accessibleLoans,
      transactions,
      Number(caixa) || 0,
      today,
    );
  }, [accessibleLoans, transactions, caixa, today]);

  // ── Chart Data for Cash Flow ──────────────────────────────────────────────
  const cashFlowChartData = useMemo(() => {
    return {
      labels: monthlyCashFlow.map((m) => m.month),
      datasets: [
        {
          label: "Entradas",
          data: monthlyCashFlow.map((m) => m.income),
          backgroundColor: "rgba(56, 142, 60, 0.8)",
          borderColor: "rgb(56, 142, 60)",
          borderWidth: 2,
          borderRadius: 4,
          type: "bar",
          yAxisID: "y",
        },
        {
          label: "Saídas",
          data: monthlyCashFlow.map((m) => m.expense),
          backgroundColor: "rgba(211, 47, 47, 0.8)",
          borderColor: "rgb(211, 47, 47)",
          borderWidth: 2,
          borderRadius: 4,
          type: "bar",
          yAxisID: "y",
        },
        {
          label: "Saldo",
          data: monthlyCashFlow.map((m) => m.saldo),
          borderColor: "rgba(33, 150, 243, 1)",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          type: "line",
          yAxisID: "y1",
          pointRadius: 6,
          pointBackgroundColor: monthlyCashFlow.map((m) =>
            m.saldo >= 0 ? "rgb(56, 142, 60)" : "rgb(211, 47, 47)",
          ),
          pointBorderWidth: 2,
          pointBorderColor: "white",
        },
      ],
    };
  }, [monthlyCashFlow]);

  // ── Overdue Installments by Category ──────────────────────────────────────
  const overdueByCategory = useMemo(() => {
    const categories = {
      light: {
        label: "1-7 dias",
        days: [1, 7],
        items: [],
        amount: 0,
        color: "#ff9800",
      }, // Amarelo
      moderate: {
        label: "8-14 dias",
        days: [8, 14],
        items: [],
        amount: 0,
        color: "#ff6f00",
      }, // Laranja
      severe: {
        label: "15-30 dias",
        days: [15, 30],
        items: [],
        amount: 0,
        color: "#e65100",
      }, // Laranja escuro
      critical: {
        label: "30+ dias",
        days: [31, 999999],
        items: [],
        amount: 0,
        color: "#d32f2f",
      }, // Vermelho
    };

    // Get all overdue installments from KPIs
    const allInstallments = kpis.allInstallments || [];
    const overdueInstallments = allInstallments.filter(
      (i) => i.status === "overdue",
    );

    // Categorize each overdue installment by days overdue
    overdueInstallments.forEach((inst) => {
      const daysOverdue = Math.ceil(
        (today - new Date(inst.dueDate)) / (1000 * 60 * 60 * 24),
      );

      let category = null;
      if (daysOverdue >= 1 && daysOverdue <= 7) {
        category = "light";
      } else if (daysOverdue >= 8 && daysOverdue <= 14) {
        category = "moderate";
      } else if (daysOverdue >= 15 && daysOverdue <= 30) {
        category = "severe";
      } else if (daysOverdue > 30) {
        category = "critical";
      }

      if (category) {
        categories[category].items.push({
          client: inst.client,
          amount: inst.amount,
          daysOverdue,
          dueDate: inst.dueDate,
        });
        categories[category].amount += inst.amount;
      }
    });

    return categories;
  }, [kpis, today]);

  const handleExportFinanceiro = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    const dataAtual = new Date();
    const allInstallments = kpis.allInstallments || [];

    // ════ HEADER ════
    doc.setFillColor(22, 163, 74); // Verde
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("RELATÓRIO FINANCEIRO COMPLETO", margin, 18);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Gerado em ${dataAtual.toLocaleDateString("pt-BR")}`, margin, 26);
    yPos = 40;

    // ════ RESUMO EXECUTIVO ════
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(22, 163, 74);
    doc.text("1. RESUMO EXECUTIVO", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(51, 65, 85);

    const resumoRows = [
      ["Caixa Disponível", fmt(kpis.caixaDisponivel)],
      ["Total Emprestado", fmt(kpis.totalEmprestado)],
      ["Total Recebido", fmt(kpis.totalRecebido)],
      ["Total a Receber", fmt(kpis.totalAReceber)],
      ["Em Atraso", fmt(kpis.totalEmAtraso)],
      ["Juros Recebidos", fmt(kpis.totalInterestReceived)],
      ["Lucro Bruto", fmt(kpis.grossProfit)],
      ["Margem de Lucro", (kpis.profitMargin || 0).toFixed(1) + "%"],
      [
        "Score de Saúde",
        kpis.healthScore + "/100 (" + (kpis.healthStatus || "-") + ")",
      ],
      ["Clientes Ativos", kpis.activeClients],
      ["Empréstimos Ativos", kpis.activeLoansCount],
      ["Parcelas Pagas", kpis.paidCount],
      ["Parcelas em Atraso", kpis.overdueCount],
    ];

    autoTable(doc, {
      head: [["Indicador", "Valor"]],
      body: resumoRows,
      startY: yPos,
      margin: margin,
      styles: {
        fontSize: 9,
        cellPadding: 5,
        textColor: 51,
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246],
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right" },
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ════ EMPRÉSTIMOS ════
    if (accessibleLoans.length > 0) {
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("2. EMPRÉSTIMOS", margin, yPos);
      yPos += 10;

      const emprestimosRows = accessibleLoans.map((l) => {
        const pmt = calcPMT(
          Number(l.value) || 0,
          (Number(l.interest_rate) || 0) / 100,
          Number(l.installments) || 1,
        );
        const remaining =
          ((Number(l.installments) || 0) - (Number(l.paid) || 0)) * pmt;
        return [
          getClientName(l.client),
          fmt(Number(l.value)),
          l.status === "active"
            ? "Ativo"
            : l.status === "overdue"
              ? "Atrasado"
              : "Pago",
          Number(l.interest_rate) + "%",
          l.paid + "/" + l.installments,
          fmt(remaining),
        ];
      });

      autoTable(doc, {
        head: [
          ["Cliente", "Valor", "Status", "Taxa", "Pagas", "Saldo Restante"],
        ],
        body: emprestimosRows,
        startY: yPos,
        margin: margin,
        styles: {
          fontSize: 8,
          cellPadding: 4,
          textColor: 51,
        },
        headStyles: {
          fillColor: [22, 163, 74],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246],
        },
        columnStyles: {
          1: { halign: "right" },
          5: { halign: "right" },
        },
      });

      yPos = doc.lastAutoTable.finalY + 15;
    }

    // ════ INADIMPLÊNCIA ════
    const inadimplentes = allInstallments.filter((i) => i.status === "overdue");
    if (inadimplentes.length > 0 && yPos < pageHeight - 40) {
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("3. INADIMPLÊNCIA", margin, yPos);
      yPos += 10;

      const inadimRows = inadimplentes.slice(0, 10).map((i) => {
        const daysOverdue = Math.ceil(
          (today - new Date(i.dueDate)) / (1000 * 60 * 60 * 24),
        );
        return [
          i.client,
          `${i.installmentNo}/${i.totalInstallments}`,
          fmt(i.amount),
          fmtDate(i.dueDate),
          daysOverdue + "d",
        ];
      });

      autoTable(doc, {
        head: [["Cliente", "Parcela", "Valor", "Vencimento", "Dias Atraso"]],
        body: inadimRows,
        startY: yPos,
        margin: margin,
        styles: {
          fontSize: 8,
          cellPadding: 4,
          textColor: 51,
        },
        headStyles: {
          fillColor: [211, 47, 47],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246],
        },
        columnStyles: {
          2: { halign: "right" },
          4: { halign: "right" },
        },
      });

      yPos = doc.lastAutoTable.finalY + 15;
    }

    // ════ MAIORES DEVEDORES ════
    if (topDebtors.length > 0) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("4. MAIORES DEVEDORES", margin, yPos);
      yPos += 10;

      const devedoresRows = topDebtors.map(([name, total], idx) => [
        (idx + 1).toString(),
        name,
        fmt(total),
      ]);

      autoTable(doc, {
        head: [["Pos.", "Cliente", "Saldo Devedor"]],
        body: devedoresRows,
        startY: yPos,
        margin: margin,
        styles: {
          fontSize: 9,
          cellPadding: 5,
          textColor: 51,
        },
        headStyles: {
          fillColor: [22, 163, 74],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246],
        },
        columnStyles: {
          0: { halign: "center" },
          2: { halign: "right" },
        },
      });

      yPos = doc.lastAutoTable.finalY + 15;
    }

    // ════ FLUXO DE CAIXA ════
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(22, 163, 74);
    doc.text("5. FLUXO DE CAIXA (ÚLTIMOS 3 MESES)", margin, yPos);
    yPos += 10;

    const fluxoRows = monthlyCashFlow.map((m) => [
      m.month,
      fmt(m.income),
      fmt(m.expense),
      fmt(m.saldo),
    ]);

    autoTable(doc, {
      head: [["Mês", "Entradas", "Saídas", "Saldo Acumulado"]],
      body: fluxoRows,
      startY: yPos,
      margin: margin,
      styles: {
        fontSize: 9,
        cellPadding: 5,
        textColor: 51,
      },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246],
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    // ════ FOOTER ════
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, {
        align: "center",
      });
    }

    doc.save(
      `Dashboard_Relatorio_${dataAtual.toISOString().split("T")[0]}.pdf`,
    );
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-desc">Visão geral do seu negócio</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-outline btn-sm"
            style={{
              marginRight: 8,
              borderColor: "var(--green)",
              color: "var(--green)",
            }}
            onClick={handleExportFinanceiro}
          >
            Baixar Relatório
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate("/emprestimos")}
          >
            + Novo Empréstimo
          </button>
        </div>
      </div>

      {/* CASH FLOW CHART - 3 Months */}
      {/* Moved to end - after KPI cards */}

      {/* KPI Cards */}
      <div className="kpi-grid">
        {/* SALDO CAIXA - Apenas Admin */}
        {(userRole === "admin" || currentUser?.access_level === "admin") && (
          <div
            className="kpi-card animate-in"
            style={{
              "--delay": 1,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              className="kpi-icon"
              style={{ background: "var(--blue)", color: "white" }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
            <div className="kpi-info">
              <span
                className="kpi-label"
                style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
              >
                Caixa Disponível
              </span>
              <span
                className="kpi-value"
                style={{ color: "#111", fontSize: "1.6rem" }}
              >
                {fmt(kpis.caixaDisponivel)}
              </span>
              <span
                className="kpi-change positive"
                style={{ fontSize: "0.8rem", color: "#888" }}
              >
                Saldo operacional
              </span>
            </div>
          </div>
        )}

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "var(--orange)" }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="kpi-info">
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Contratos Ativos
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {kpis.activeLoansCount}
            </span>
            <span
              className="kpi-change positive"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              Em andamento
            </span>
          </div>
        </div>

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "var(--green)" }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="kpi-info">
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Total Emprestado
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {fmt(kpis.totalEmprestado)}
            </span>
            <span
              className="kpi-change positive"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              Capital liberado
            </span>
          </div>
        </div>

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 4,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "var(--purple)" }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
          </div>
          <div className="kpi-info">
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Total a Receber
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {fmt(kpis.totalAReceber)}
            </span>
            <span
              className="kpi-change neutral"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              Saldo em aberto
            </span>
          </div>
        </div>

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 5,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "#888" }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-info">
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Total Recebido
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {fmt(kpis.totalRecebido)}
            </span>
            <span
              className="kpi-change positive"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              Parcelas quitadas
            </span>
          </div>
        </div>

        <div
          className="kpi-card animate-in"
          style={{
            "--delay": 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div className="kpi-icon" style={{ background: "var(--red)" }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="kpi-info">
            <span
              className="kpi-label"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888" }}
            >
              Em Atraso
            </span>
            <span
              className="kpi-value"
              style={{ color: "#111", fontSize: "1.6rem" }}
            >
              {fmt(kpis.totalEmAtraso)}
            </span>
            <span
              className="kpi-change negative"
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              {kpis.overdueCount} empréstimo{kpis.overdueCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* CASH FLOW CHART - 3 Months */}
      <div
        style={{
          marginBottom: 24,
          padding: "24px",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
        className="animate-in"
      >
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 4 }}>📊 Fluxo de Caixa (3 Meses)</h3>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            Tendência de entradas, saídas e saldo nos últimos 3 meses
          </p>
        </div>

        <div style={{ position: "relative", height: 320 }}>
          <Bar
            data={cashFlowChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: "index",
                intersect: false,
              },
              plugins: {
                legend: {
                  display: true,
                  position: "top",
                  labels: {
                    font: { size: 12, weight: 500 },
                    padding: 16,
                    usePointStyle: true,
                    pointStyle: "circle",
                  },
                },
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  padding: 12,
                  titleFont: { size: 13, weight: "bold" },
                  bodyFont: { size: 12 },
                  callbacks: {
                    label: function (context) {
                      return `${context.dataset.label}: ${fmt(context.parsed.y)}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  type: "linear",
                  display: true,
                  position: "left",
                  title: {
                    display: true,
                    text: "Valor (R$)",
                    font: { size: 11, weight: 500 },
                  },
                  ticks: {
                    callback: function (value) {
                      return "R$ " + (value / 1000).toFixed(0) + "K";
                    },
                  },
                },
                y1: {
                  type: "linear",
                  display: true,
                  position: "right",
                  title: {
                    display: true,
                    text: "Saldo (R$)",
                    font: { size: 11, weight: 500 },
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                  ticks: {
                    callback: function (value) {
                      return "R$ " + (value / 1000).toFixed(0) + "K";
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Maiores Devedores */}
        <div className="card animate-in" style={{ "--delay": 7 }}>
          <div className="card-header">
            <h3>Maiores Devedores</h3>
            <button className="btn-link" onClick={() => navigate("/cobrancas")}>
              Ver Cobranças
            </button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>A Receber</th>
                </tr>
              </thead>
              <tbody>
                {topDebtors.length > 0 ? (
                  topDebtors.map(([name, value], i) => (
                    <tr key={name}>
                      <td>{i + 1}</td>
                      <td>{name}</td>
                      <td style={{ fontWeight: "bold" }}>{fmt(value)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "var(--text-dim)",
                      }}
                    >
                      Nenhum devedor ativo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Próximos Vencimentos */}
        <div className="card animate-in" style={{ "--delay": 8 }}>
          <div className="card-header">
            <h3>Próximos Vencimentos</h3>
            <button
              className="btn-link"
              onClick={() => navigate("/emprestimos")}
            >
              Ver Todos
            </button>
          </div>
          <div className="transactions-list">
            {upcomingDues.length > 0 ? (
              upcomingDues.map(({ loan, due, diff, pmt, installmentNo }) => (
                <div
                  key={`${loan.id}-${installmentNo}`}
                  className="transaction-row"
                >
                  <div
                    className={`tx-icon ${diff < 0 ? "tx-expense" : diff <= 3 ? "tx-warning" : "tx-income"}`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <div className="tx-info">
                    <div className="tx-desc">{getClientName(loan.client)}</div>
                    <div className="tx-category">
                      Parcela {installmentNo}/{loan.installments}
                    </div>
                  </div>
                  <div className="tx-amount" style={{ textAlign: "right" }}>
                    <div>{fmt(pmt)}</div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color:
                          diff < 0
                            ? "var(--red)"
                            : diff <= 3
                              ? "var(--orange)"
                              : "var(--text-dim)",
                      }}
                    >
                      {diff < 0
                        ? `${Math.abs(diff)}d atrasado`
                        : diff === 0
                          ? "Hoje"
                          : `em ${diff}d`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-dim)",
                }}
              >
                Nenhum vencimento próximo
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
