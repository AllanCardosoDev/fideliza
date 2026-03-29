// src/pages/Agenda.jsx
import React, { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App";
import { fmt, calcPMT } from "../utils/helpers";

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eventIcon(type) {
  switch (type) {
    case "installment": return "💳";
    case "client": return "👤";
    case "sale": return "🛒";
    case "transaction": return "💰";
    case "employee": return "👔";
    default: return "📌";
  }
}

function Agenda() {
  const { loans, clients, sales, transactions, employees } = useContext(AppContext);
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // "month" | "week" | "day"

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Generate all events from all data sources
  const allEvents = useMemo(() => {
    const events = [];
    const now = new Date();

    // 1. Loan installments
    loans.forEach((loan) => {
      if (!loan.start_date) return;
      const v = Number(loan.value) || 0;
      const rate = (Number(loan.interest_rate) || 0) / 100;
      const n = Number(loan.installments) || 0;
      const paid = Number(loan.paid) || 0;
      if (!v || !n) return;

      const pmt = calcPMT(v, rate, n);
      const start = new Date(loan.start_date + "T00:00:00");

      for (let i = 1; i <= n; i++) {
        const due = new Date(start);
        due.setMonth(due.getMonth() + i);
        const dueDate = due.toISOString().split("T")[0];

        let status;
        if (i <= paid) status = "paid";
        else if (due < now) status = "overdue";
        else status = "due";

        events.push({
          id: `loan-${loan.id}-${i}`,
          date: dueDate,
          type: "installment",
          status,
          title: `Parcela ${i}/${n} — ${loan.client}`,
          description: `Empréstimo: ${fmt(v)} | PMT: ${fmt(pmt)}`,
          amount: pmt,
          color: status === "paid" ? "green" : status === "overdue" ? "red" : "blue",
          link: "/recebimentos",
        });
      }
    });

    // 2. Client registrations
    clients.forEach((client) => {
      if (!client.created_at) return;
      const date = client.created_at.split("T")[0];
      events.push({
        id: `client-${client.id}`,
        date,
        type: "client",
        status: "info",
        title: `Cliente cadastrado: ${client.name}`,
        description: client.phone || client.email || "",
        color: "blue",
        link: "/clientes",
      });
    });

    // 3. Sales
    sales.forEach((sale) => {
      if (!sale.date) return;
      events.push({
        id: `sale-${sale.id}`,
        date: sale.date,
        type: "sale",
        status: sale.status || "info",
        title: `Venda: ${sale.description || "—"}`,
        description: `Cliente: ${sale.client || "—"}`,
        amount: Number(sale.value) || 0,
        color: "gold",
        link: "/vendas",
      });
    });

    // 4. Transactions
    transactions.forEach((tx) => {
      if (!tx.date) return;
      events.push({
        id: `tx-${tx.id}`,
        date: tx.date,
        type: "transaction",
        status: tx.type === "income" ? "income" : "expense",
        title: `${tx.type === "income" ? "Receita" : "Despesa"}: ${tx.description || "—"}`,
        description: tx.category || "",
        amount: Number(tx.amount) || 0,
        color: tx.type === "income" ? "green" : "red",
        link: "/financeiro",
      });
    });

    // 5. Employee admissions
    employees.forEach((emp) => {
      if (!emp.admission) return;
      events.push({
        id: `emp-${emp.id}`,
        date: emp.admission,
        type: "employee",
        status: "info",
        title: `Admissão: ${emp.name}`,
        description: emp.role || "",
        color: "blue",
        link: "/funcionarios",
      });
    });

    return events;
  }, [loans, clients, sales, transactions, employees]);

  // Group events by date string
  const eventsByDate = useMemo(() => {
    const map = {};
    allEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [allEvents]);

  const eventsForDay = (date) => eventsByDate[toDateKey(date)] || [];

  const dotsForDay = (date) => {
    const evs = eventsForDay(date);
    const colors = [...new Set(evs.map((e) => e.color))];
    return colors;
  };

  // Calendar grid (month view)
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = firstDay; i > 0; i--) {
      days.push({ date: new Date(year, month - 1, prevDays - i + 1), isCurrentMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [currentDate]);

  // Week days for week view
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const goToPrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (date) => {
    setCurrentDate(new Date(date));
    setViewMode("day");
  };

  const getHeaderTitle = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    } else if (viewMode === "week") {
      const s = weekDays[0];
      const e = weekDays[6];
      return `${s.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} — ${e.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
  };

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Agenda</h2>
          <p className="page-desc">Calendário de vencimentos e compromissos</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div className="view-toggle">
          {[
            { key: "month", label: "Mês" },
            { key: "week", label: "Semana" },
            { key: "day", label: "Dia" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`view-toggle-btn${viewMode === key ? " active" : ""}`}
              onClick={() => setViewMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }}>
          <button className="btn-icon" onClick={goToPrev}>‹</button>
          <span style={{ fontWeight: 600, fontSize: "1rem", minWidth: 200, textAlign: "center" }}>{getHeaderTitle()}</span>
          <button className="btn-icon" onClick={goToNext}>›</button>
        </div>
        <button className="btn btn-outline btn-sm" onClick={goToToday}>Hoje</button>
      </div>

      {/* Month view */}
      {viewMode === "month" && (
        <div className="card">
          <div className="calendar-grid">
            {dayNames.map((name) => (
              <div key={name} className="cal-day-header">{name}</div>
            ))}
            {daysInMonth.map((day, index) => {
              const isToday = day.date.toDateString() === today.toDateString();
              const dots = dotsForDay(day.date);
              const evs = eventsForDay(day.date);
              return (
                <div
                  key={index}
                  className={`cal-day${day.isCurrentMonth ? "" : " other-month"}${isToday ? " today" : ""}${evs.length > 0 ? " has-event" : ""}`}
                  onClick={() => day.isCurrentMonth && handleDayClick(day.date)}
                  style={{ cursor: day.isCurrentMonth ? "pointer" : "default", flexDirection: "column", gap: 2 }}
                >
                  <span>{day.date.getDate()}</span>
                  {dots.length > 0 && (
                    <div className="event-dots">
                      {dots.map((color) => (
                        <span key={color} className={`event-dot event-dot-${color}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "12px 16px", borderTop: "1px solid var(--border)", fontSize: "0.8rem", color: "var(--text-dim)" }}>
            <span><span className="event-dot event-dot-green" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> Pago</span>
            <span><span className="event-dot event-dot-red" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> Atrasado</span>
            <span><span className="event-dot event-dot-blue" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> A vencer / Info</span>
            <span><span className="event-dot event-dot-gold" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> Venda</span>
          </div>
        </div>
      )}

      {/* Week view */}
      {viewMode === "week" && (
        <div className="card" style={{ padding: "0 0 16px" }}>
          <div className="week-view">
            {weekDays.map((d, idx) => {
              const isToday = d.toDateString() === today.toDateString();
              const evs = eventsForDay(d);
              return (
                <div
                  key={idx}
                  className={`week-day-column${isToday ? " today" : ""}`}
                  onClick={() => handleDayClick(d)}
                >
                  <div className="week-day-header">
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", textTransform: "uppercase" }}>{dayNames[d.getDay()]}</div>
                    <div style={{ fontWeight: isToday ? 700 : 400, color: isToday ? "var(--gold)" : "var(--text)", fontSize: "1.15rem" }}>{d.getDate()}</div>
                  </div>
                  <div className="week-day-events">
                    {evs.slice(0, 4).map((ev) => (
                      <div
                        key={ev.id}
                        className={`week-event week-event-${ev.color}`}
                        onClick={(e) => { e.stopPropagation(); navigate(ev.link); }}
                        title={ev.title}
                      >
                        {eventIcon(ev.type)} {ev.title.length > 18 ? ev.title.slice(0, 18) + "…" : ev.title}
                      </div>
                    ))}
                    {evs.length > 4 && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", padding: "2px 4px" }}>
                        +{evs.length - 4} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {viewMode === "day" && (
        <div className="card">
          <div style={{ padding: "16px" }}>
            {(() => {
              const evs = eventsForDay(currentDate);
              if (evs.length === 0) {
                return (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📅</div>
                    Nenhuma atividade registrada para este dia.
                  </div>
                );
              }
              return (
                <div className="agenda-event-list">
                  {evs.map((ev) => (
                    <div
                      key={ev.id}
                      className={`agenda-event-item agenda-event-${ev.color}`}
                      onClick={() => navigate(ev.link)}
                      title="Clique para ir à página"
                    >
                      <span className="agenda-event-icon">{eventIcon(ev.type)}</span>
                      <div className="agenda-event-info">
                        <div className="agenda-event-title">{ev.title}</div>
                        {ev.description && (
                          <div className="agenda-event-desc">{ev.description}</div>
                        )}
                      </div>
                      {ev.amount != null && ev.amount > 0 && (
                        <div className={`agenda-event-amount${ev.color === "green" ? " tx-income" : ev.color === "red" ? " tx-expense" : ""}`}>
                          {fmt(ev.amount)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default Agenda;
