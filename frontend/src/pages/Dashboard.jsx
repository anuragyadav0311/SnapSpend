import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedCounter, ProgressRing } from "../components/SharedComponents";
import { useAuth } from "../context/AuthContext";
import { fetchDashboardReport } from "../services/reports";
import { fetchAnomalies } from "../services/transactions";
import { FRONTEND_ONLY_MODE } from "../services/frontendMode";
import { getBudgetBalance } from "../utils/budgetDisplay";

const STYLES = `
.panel-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
.panel-card, .section-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 20px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.section-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px; margin-bottom: 18px; }
.page-head { display: flex; justify-content: space-between; gap: 16px; align-items: end; margin-bottom: 24px; flex-wrap: wrap; }
.page-title { font-family: 'Playfair Display', serif; font-size: 28px; color: var(--sand-50); }
.page-sub { color: var(--sand-500); font-size: 13px; margin-top: 4px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
.btn {
  border-radius: 12px; border: 1px solid var(--surface-strong); background: var(--surface-soft);
  color: var(--sand-200); padding: 10px 14px; font-family: 'Figtree', sans-serif; cursor: pointer;
}
.btn.primary { border: none; background: linear-gradient(135deg, var(--sage-l), var(--amber-l)); color: var(--ink); }
.metric-label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--sand-500); margin-bottom: 8px; }
.metric-value { font-family: 'DM Mono', monospace; font-size: 22px; color: var(--sand-50); }
.metric-note { margin-top: 6px; color: var(--sand-500); font-size: 12px; }
.list-item { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--surface-border); }
.list-item:last-child { border-bottom: none; }
.list-title { color: var(--sand-100); font-size: 13px; font-weight: 500; }
.list-meta { color: var(--sand-500); font-size: 11px; margin-top: 2px; }
.list-amount { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--sand-100); white-space: nowrap; }
.bar-row { padding: 12px 0; border-bottom: 1px solid var(--surface-border); }
.bar-row:last-child { border-bottom: none; }
.bar-top { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; color: var(--sand-300); margin-bottom: 8px; }
.bar-track { height: 8px; border-radius: 999px; background: var(--surface-hover); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--sage-l), var(--amber-l)); }
.trend-row { display: flex; flex-direction: column; gap: 10px; }
.trend-item { display: grid; grid-template-columns: 88px 1fr auto; gap: 12px; align-items: center; }
.trend-track { height: 8px; border-radius: 999px; background: var(--surface-hover); overflow: hidden; position: relative; }
.trend-income, .trend-expense { position: absolute; inset-block: 0; left: 0; border-radius: 999px; }
.trend-income { background: rgba(122, 158, 135, 0.85); }
.trend-expense { background: rgba(184, 112, 112, 0.65); }
.budget-card-shell { display: flex; gap: 16px; align-items: center; }
.budget-copy { display: flex; flex-direction: column; gap: 6px; }
.status-chip { display: inline-flex; width: fit-content; padding: 4px 9px; border-radius: 999px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid var(--surface-strong); }
.status-chip.healthy { color: var(--sage-l); border-color: var(--sage); }
.status-chip.near_limit { color: var(--amber-l); border-color: var(--amber); }
.status-chip.exceeded { color: var(--rose); border-color: var(--rose); }
.error-box { margin-bottom: 16px; padding: 12px 14px; border-radius: 12px; color: var(--rose); border: 1px solid rgba(184,112,112,0.35); background: rgba(184,112,112,0.08); }
.anomaly-section { margin-bottom: 18px; }
.anomaly-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.anomaly-header-icon {
  width: 32px; height: 32px; border-radius: 10px;
  background: rgba(184, 112, 112, 0.12); border: 1px solid rgba(184, 112, 112, 0.3);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.anomaly-header-title { font-size: 13px; color: var(--sand-200); font-weight: 500; }
.anomaly-header-title strong { color: var(--rose); }
.anomaly-item {
  display: flex; justify-content: space-between; gap: 12px;
  padding: 12px 14px; border-radius: 12px; margin-bottom: 6px;
  background: rgba(184, 112, 112, 0.05); border: 1px solid rgba(184, 112, 112, 0.15);
  transition: all 0.2s;
}
.anomaly-item:hover { background: rgba(184, 112, 112, 0.1); }
.anomaly-item-info { flex: 1; min-width: 0; }
.anomaly-item-title { font-size: 13px; color: var(--sand-100); font-weight: 500; }
.anomaly-item-reason { font-size: 11px; color: var(--sand-500); margin-top: 2px; }
.anomaly-item-amount { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--rose); white-space: nowrap; }
.anomaly-item-score {
  display: inline-block; padding: 2px 7px; border-radius: 999px;
  font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  background: rgba(184, 112, 112, 0.15); color: var(--rose); margin-top: 4px;
}
@media (max-width: 980px) { .panel-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .section-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .panel-grid { grid-template-columns: 1fr; } }
`;

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `Rs. ${Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatSignedCurrency(value) {
  const amount = Number(value || 0);
  return `${amount >= 0 ? "+" : "-"}${formatCurrency(amount)}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [anomalies, setAnomalies] = useState([]);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const budgetBalance = payload?.budget ? getBudgetBalance(payload.budget.remaining_amount) : null;

  useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      setLoading(true);
      setPageError("");
      try {
        const response = await fetchDashboardReport();
        if (mounted) {
          setPayload(response);
        }
      } catch (error) {
        if (mounted) {
          setPageError(error.message || "Unable to load the dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  // Load anomalies separately (non-blocking)
  useEffect(() => {
    if (FRONTEND_ONLY_MODE) return;
    let mounted = true;
    async function loadAnomalies() {
      try {
        const data = await fetchAnomalies({ limit: 5 });
        if (mounted) {
          setAnomalies(data.results || []);
          setAnomalyCount(data.count || 0);
        }
      } catch {
        // anomaly fetch is optional
      }
    }
    loadAnomalies();
    return () => { mounted = false; };
  }, []);

  const maxTrend = useMemo(() => {
    const items = payload?.monthly_trend || [];
    return Math.max(1, ...items.map((item) => Math.max(item.income, item.expense)));
  }, [payload]);

  return (
    <>
      <style>{STYLES}</style>

      <div className="page-head">
        <div>
          <div className="page-title">Dashboard for <em>{user?.name?.split(" ")[0] || "you"}</em></div>
          <div className="page-sub">Live summary of balances, spending, budgets, and the latest transaction flow.</div>
        </div>
        <div className="actions">
          <button className="btn primary" type="button" onClick={() => navigate("/transactions?compose=income")}>Add Income</button>
          <button className="btn primary" type="button" onClick={() => navigate("/transactions?compose=expense")}>Add Expense</button>
          <button className="btn" type="button" onClick={() => navigate("/insights")}>Download Report</button>
        </div>
      </div>

      {pageError && <div className="error-box">{pageError}</div>}
      {loading && <div className="section-card">Loading dashboard data...</div>}

      {!loading && payload && (
        <>
          {anomalyCount > 0 && (
            <div className="anomaly-section">
              <div className="section-card">
                <div className="anomaly-header">
                  <div className="anomaly-header-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="anomaly-header-title">
                    ML detected <strong>{anomalyCount} suspicious transaction{anomalyCount !== 1 ? "s" : ""}</strong>
                  </div>
                  <button className="btn" type="button" style={{ fontSize: "11px", padding: "6px 12px" }} onClick={() => navigate("/transactions")}>
                    View All
                  </button>
                </div>
                {anomalies.slice(0, 5).map((item) => (
                  <div className="anomaly-item" key={item.id}>
                    <div className="anomaly-item-info">
                      <div className="anomaly-item-title">{item.title}</div>
                      <div className="anomaly-item-reason">{item.anomaly_reason}</div>
                      <div className="anomaly-item-score">score: {item.anomaly_score?.toFixed(4)}</div>
                    </div>
                    <div className="anomaly-item-amount">
                      {item.type === "expense" ? "-" : "+"}Rs. {Number(item.amount).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel-grid">
            <div className="panel-card">
              <div className="metric-label">Current Balance</div>
              <div className="metric-value"><AnimatedCounter target={payload.totals.balance} prefix="Rs. " /></div>
              <div className="metric-note">All-time income minus expense</div>
            </div>
            <div className="panel-card">
              <div className="metric-label">Total Income</div>
              <div className="metric-value"><AnimatedCounter target={payload.totals.income} prefix="Rs. " /></div>
              <div className="metric-note">Across all recorded income entries</div>
            </div>
            <div className="panel-card">
              <div className="metric-label">Total Expense</div>
              <div className="metric-value"><AnimatedCounter target={payload.totals.expense} prefix="Rs. " /></div>
              <div className="metric-note">Across all recorded expense entries</div>
            </div>
            <div className="panel-card">
              <div className="metric-label">{payload.current_month.month}</div>
              <div className="metric-value"><AnimatedCounter target={payload.current_month.savings_rate} suffix="%" /></div>
              <div className="metric-note">Current-month savings rate</div>
            </div>
          </div>

          <div className="section-grid">
            <div className="section-card">
              <div className="metric-label">Recent Transactions</div>
              {payload.recent_transactions.length === 0 ? (
                <div className="metric-note">No transactions yet.</div>
              ) : (
                payload.recent_transactions.map((transaction) => (
                  <div className="list-item" key={transaction.id}>
                    <div>
                      <div className="list-title">{transaction.title}</div>
                      <div className="list-meta">{transaction.category_name} | {transaction.date}</div>
                    </div>
                    <div className="list-amount">
                      {formatSignedCurrency(transaction.type === "expense" ? -Number(transaction.amount) : Number(transaction.amount))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="section-card">
              <div className="metric-label">Current Month Budget</div>
              {payload.budget ? (
                <div className="budget-card-shell">
                  <ProgressRing progress={Math.min(payload.budget.progress_percent, 100)} size={74} strokeWidth={6} color={payload.budget.status === "exceeded" ? "var(--rose)" : payload.budget.status === "near_limit" ? "var(--amber-l)" : "var(--sage-l)"} />
                  <div className="budget-copy">
                    <span className={`status-chip ${payload.budget.status}`}>{payload.budget.status.replace("_", " ")}</span>
                    <div className="list-title">{formatCurrency(payload.budget.spent_amount)} spent of {formatCurrency(payload.budget.limit_amount)}</div>
                    <div className="list-meta">{formatCurrency(budgetBalance.amount)} {budgetBalance.sentence} for {payload.current_month.month}</div>
                  </div>
                </div>
              ) : (
                <div className="metric-note">No budget set for this month yet. Add one from the Budgets page.</div>
              )}
            </div>
          </div>

          <div className="section-grid">
            <div className="section-card">
              <div className="metric-label">Category Breakdown</div>
              {payload.category_breakdown.length === 0 ? (
                <div className="metric-note">No expense data for {payload.current_month.month} yet.</div>
              ) : (
                payload.category_breakdown.map((category) => (
                  <div className="bar-row" key={category.name}>
                    <div className="bar-top">
                      <span>{category.name}</span>
                      <span>{formatCurrency(category.amount)} | {category.percentage}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.min(category.percentage, 100)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="section-card">
              <div className="metric-label">Monthly Trend</div>
              <div className="trend-row">
                {payload.monthly_trend.map((item) => {
                  const incomeWidth = (item.income / maxTrend) * 100;
                  const expenseWidth = (item.expense / maxTrend) * 100;
                  return (
                    <div className="trend-item" key={item.month}>
                      <span className="list-meta">{item.month}</span>
                      <div className="trend-track">
                        <div className="trend-income" style={{ width: `${incomeWidth}%` }} />
                        <div className="trend-expense" style={{ width: `${expenseWidth}%` }} />
                      </div>
                      <span className="list-meta">{formatCurrency(item.income)} / {formatCurrency(item.expense)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
