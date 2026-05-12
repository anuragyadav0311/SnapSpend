import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedCounter, ProgressRing } from "../components/SharedComponents";
import { useAuth } from "../context/AuthContext";

const STYLES = `
.dash-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.dash-greeting {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--sand-50);
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.dash-greeting em { font-style: italic; color: var(--sage-l); }

.dash-date {
  font-size: 13px;
  color: var(--sand-500);
  font-weight: 300;
  margin-top: 4px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.qa-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--surface-strong);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  font-family: 'Figtree', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--sand-300);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.qa-btn:hover {
  background: var(--focus-fill);
  border-color: var(--sage);
  color: var(--sage-l);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(122, 158, 135, 0.15);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.kpi-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 20px 22px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition: all 0.25s;
  box-shadow: var(--card-shadow);
}

.kpi-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--card-shadow), 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--sage);
}

.kpi-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sand-500);
  margin-bottom: 8px;
}

.kpi-value {
  font-family: 'DM Mono', monospace;
  font-size: 22px;
  font-weight: 500;
  color: var(--sand-50);
  letter-spacing: -0.02em;
}

.kpi-value.income { color: var(--sage-l); }
.kpi-value.expense { color: var(--rose); }

.kpi-change {
  font-size: 11px;
  font-weight: 400;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.kpi-change.up { color: var(--sage-l); }
.kpi-change.down { color: var(--rose); }

.dash-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
}

@media (max-width: 960px) {
  .dash-grid { grid-template-columns: 1fr; }
}

.section-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--card-shadow);
  position: relative;
  overflow: hidden;
}

.section-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--sand-100);
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}

.txn-preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--surface-border);
  transition: all 0.2s;
}

.txn-preview-item:last-child { border-bottom: none; }
.txn-preview-item:hover { padding-left: 4px; }

.txn-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--surface-soft-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  color: var(--sand-200);
  flex-shrink: 0;
}

.txn-info { flex: 1; min-width: 0; }

.txn-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--sand-200);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.txn-cat {
  font-size: 11px;
  color: var(--sand-500);
  font-weight: 300;
}

.txn-amount {
  font-family: 'DM Mono', monospace;
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
}

.txn-amount.neg { color: var(--rose); }
.txn-amount.pos { color: var(--sage-l); }

.category-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.cat-color {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.cat-name {
  font-size: 12.5px;
  color: var(--sand-300);
  flex: 1;
}

.cat-bar-wrap {
  width: 80px;
  height: 5px;
  border-radius: 3px;
  background: var(--surface-hover);
  overflow: hidden;
}

.cat-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.cat-pct {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--sand-500);
  width: 32px;
  text-align: right;
}

.budget-progress-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid var(--surface-border);
}

.budget-progress-row:last-child { border-bottom: none; }

.budget-info { flex: 1; }

.budget-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--sand-200);
}

.budget-amounts {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--sand-500);
  margin-top: 2px;
}

.budget-bar-wrap {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--surface-hover);
  margin-top: 6px;
  overflow: hidden;
}

.budget-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.insight-callout {
  background: linear-gradient(135deg, var(--focus-fill), var(--surface-soft-2));
  border: 1px solid var(--sage);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.insight-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--sage-d);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.insight-text {
  font-size: 13px;
  color: var(--sand-200);
  line-height: 1.5;
  font-weight: 400;
}

.insight-text strong {
  color: var(--sage-l);
  font-weight: 600;
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const RECENT_TRANSACTIONS = [
  { id: 1, name: "Swiggy Order", category: "Food & Dining", iconLabel: "FD", amount: -489, date: "Today" },
  { id: 2, name: "Salary Credit", category: "Income", iconLabel: "IN", amount: 85000, date: "Today" },
  { id: 3, name: "Netflix Subscription", category: "Entertainment", iconLabel: "EN", amount: -649, date: "Yesterday" },
  { id: 4, name: "Uber Ride", category: "Transport", iconLabel: "TR", amount: -234, date: "Yesterday" },
  { id: 5, name: "Freelance Payment", category: "Income", iconLabel: "IN", amount: 12000, date: "May 4" },
];

const CATEGORIES = [
  { name: "Food & Dining", pct: 32, color: "var(--amber)" },
  { name: "Transport", pct: 18, color: "var(--sage-l)" },
  { name: "Entertainment", pct: 14, color: "var(--rose)" },
  { name: "Shopping", pct: 12, color: "#8b7cf6" },
  { name: "Utilities", pct: 10, color: "#60a5fa" },
  { name: "Others", pct: 14, color: "var(--sand-500)" },
];

const BUDGETS = [
  { name: "Food & Dining", spent: 12400, limit: 15000, color: "var(--amber)" },
  { name: "Transport", spent: 4800, limit: 6000, color: "var(--sage-l)" },
  { name: "Entertainment", spent: 5200, limit: 4000, color: "var(--rose)" },
  { name: "Shopping", spent: 3100, limit: 8000, color: "#8b7cf6" },
];

function formatCurrency(value) {
  return `Rs. ${Math.abs(value).toLocaleString("en-IN")}`;
}

function formatSignedCurrency(value) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(value)}`;
}

function formatExactExportDate(label) {
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (label === "Today") {
    return normalizedToday.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (label === "Yesterday") {
    const yesterday = new Date(normalizedToday);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (label === "Tomorrow") {
    const tomorrow = new Date(normalizedToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const parsed = new Date(`${label}, ${normalizedToday.getFullYear()}`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return label;
}

function downloadTransactionsCsv() {
  const rows = [
    ["Name", "Category", "Date", "Amount"],
    ...RECENT_TRANSACTIONS.map((transaction) => [
      transaction.name,
      transaction.category,
      formatExactExportDate(transaction.date),
      String(transaction.amount),
    ]),
  ];

  const csvContent = rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ledger-dashboard-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [barsReady, setBarsReady] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setBarsReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ opacity: 0, animation: "riseIn 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">Good evening, <em>{user?.name?.split(" ")[0] || "there"}.</em></h1>
            <p className="dash-date">{dateLabel}</p>
          </div>
          <div className="quick-actions">
            <button className="qa-btn" type="button" onClick={() => navigate("/transactions?compose=expense")}>+ Expense</button>
            <button className="qa-btn" type="button" onClick={() => navigate("/transactions?compose=income")}>+ Income</button>
            <button className="qa-btn" type="button" onClick={() => navigate("/profile")}>Profile</button>
            <button className="qa-btn" type="button" onClick={downloadTransactionsCsv}>Export</button>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        {[
          { label: "Current Balance", value: 247600, prefix: "Rs. ", cls: "", change: "+Rs. 12,400 this week", changeDir: "up" },
          { label: "Monthly Income", value: 97000, prefix: "Rs. ", cls: "income", change: "+8% vs last month", changeDir: "up" },
          { label: "Monthly Expenses", value: 41200, prefix: "Rs. ", cls: "expense", change: "-12% vs last month", changeDir: "up" },
          { label: "Savings Rate", value: 57, prefix: "", suffix: "%", cls: "", change: "On track", changeDir: "up" },
        ].map((kpi, index) => (
          <div className="kpi-card" key={kpi.label} style={{ opacity: 0, animation: `riseIn 0.6s ${0.2 + index * 0.08}s cubic-bezier(0.22,1,0.36,1) forwards` }}>
            <div className="kpi-label">{kpi.label}</div>
            <div className={`kpi-value ${kpi.cls}`}>
              <AnimatedCounter target={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix || ""} duration={1400} />
            </div>
            <div className={`kpi-change ${kpi.changeDir}`}>{kpi.change}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid" style={{ opacity: 0, animation: "riseIn 0.6s 0.5s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="section-card">
          <div className="section-title">Recent Transactions</div>
          {RECENT_TRANSACTIONS.map((transaction) => (
            <div className="txn-preview-item" key={transaction.id}>
              <div className="txn-icon">{transaction.iconLabel}</div>
              <div className="txn-info">
                <div className="txn-name">{transaction.name}</div>
                <div className="txn-cat">{transaction.category} | {transaction.date}</div>
              </div>
              <div className={`txn-amount ${transaction.amount < 0 ? "neg" : "pos"}`}>
                {formatSignedCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>

        <div className="section-card">
          <div className="section-title">Category Breakdown</div>
          {CATEGORIES.map((category) => (
            <div className="category-row" key={category.name}>
              <div className="cat-color" style={{ background: category.color }} />
              <div className="cat-name">{category.name}</div>
              <div className="cat-bar-wrap">
                <div className="cat-bar" style={{ width: barsReady ? `${category.pct}%` : "0%", background: category.color }} />
              </div>
              <div className="cat-pct">{category.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-grid" style={{ opacity: 0, animation: "riseIn 0.6s 0.65s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="section-card">
          <div className="section-title">Budget Health</div>
          {BUDGETS.map((budget) => {
            const progress = Math.min((budget.spent / budget.limit) * 100, 100);
            const overLimit = budget.spent > budget.limit;

            return (
              <div className="budget-progress-row" key={budget.name}>
                <ProgressRing progress={progress} size={42} strokeWidth={4} color={overLimit ? "var(--rose)" : budget.color} />
                <div className="budget-info">
                  <div className="budget-name">{budget.name}</div>
                  <div className="budget-amounts">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    {overLimit && <span style={{ color: "var(--rose)", marginLeft: 6 }}>Over</span>}
                  </div>
                  <div className="budget-bar-wrap">
                    <div className="budget-bar" style={{ width: barsReady ? `${progress}%` : "0%", background: overLimit ? "var(--rose)" : budget.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="section-title">Spending Insight</div>
          <div className="insight-callout">
            <div className="insight-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sage-l)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="insight-text">
              Your <strong>food spending dropped 18%</strong> this week compared to your 4-week average. Keep it up.
            </div>
          </div>
          <div className="insight-callout" style={{ borderColor: "var(--amber)", background: "linear-gradient(135deg, rgba(201,151,58,0.06), var(--surface-soft-2))" }}>
            <div className="insight-icon" style={{ background: "rgba(201,151,58,0.2)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber-l)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="insight-text">
              <strong>Netflix and Spotify</strong> renewals are coming up on May 12. Total: Rs. 1,148.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
