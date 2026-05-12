import { useEffect, useMemo, useState } from "react";
import { AnimatedCounter } from "../components/SharedComponents";
import { downloadReport, fetchCategorySummary, fetchMonthlyReport } from "../services/reports";

const STYLES = `
.reports-wrap { display: grid; gap: 18px; }
.page-head { display: flex; justify-content: space-between; gap: 16px; align-items: end; margin-bottom: 24px; flex-wrap: wrap; }
.page-title { font-family: 'Playfair Display', serif; font-size: 28px; color: var(--sand-50); }
.page-sub { color: var(--sand-500); font-size: 13px; margin-top: 4px; }
.card, .hero {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 22px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.hero-grid, .summary-grid, .two-col { display: grid; gap: 16px; }
.hero-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.two-col { grid-template-columns: 1fr 1fr; }
.label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sand-500); margin-bottom: 8px; }
.value { font-family: 'DM Mono', monospace; font-size: 22px; color: var(--sand-50); }
.meta { color: var(--sand-500); font-size: 12px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
.btn {
  border-radius: 12px; padding: 10px 14px; border: 1px solid var(--surface-strong); background: var(--surface-soft);
  color: var(--sand-200); cursor: pointer; font-family: 'Figtree', sans-serif;
}
.btn.primary { border: none; background: linear-gradient(135deg, var(--sage-l), var(--amber-l)); color: var(--ink); }
.bar-row { padding: 12px 0; border-bottom: 1px solid var(--surface-border); }
.bar-row:last-child { border-bottom: none; }
.bar-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; color: var(--sand-300); font-size: 12px; }
.bar-track { height: 8px; border-radius: 999px; background: var(--surface-hover); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--sage-l), var(--amber-l)); }
.txn-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--surface-border); }
.txn-row:last-child { border-bottom: none; }
.txn-title { color: var(--sand-100); font-size: 13px; font-weight: 500; }
.txn-meta { color: var(--sand-500); font-size: 11px; margin-top: 2px; }
.txn-amount { font-family: 'DM Mono', monospace; color: var(--sand-100); font-size: 13px; white-space: nowrap; }
.error-box { padding: 12px 14px; border-radius: 12px; color: var(--rose); border: 1px solid rgba(184,112,112,0.35); background: rgba(184,112,112,0.08); }
@media (max-width: 980px) { .hero-grid, .summary-grid, .two-col { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px) { .hero-grid, .summary-grid, .two-col { grid-template-columns: 1fr; } }
`;

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(value) {
  return `Rs. ${Math.abs(Number(value || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function Insights() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue());
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [categorySummary, setCategorySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadReports() {
      setLoading(true);
      setPageError("");
      try {
        const [monthly, categories] = await Promise.all([
          fetchMonthlyReport(selectedMonth),
          fetchCategorySummary(selectedMonth),
        ]);
        if (mounted) {
          setMonthlyReport(monthly);
          setCategorySummary(categories);
        }
      } catch (error) {
        if (mounted) {
          setPageError(error.message || "Unable to load reports.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadReports();
    return () => {
      mounted = false;
    };
  }, [selectedMonth]);

  const topCategory = useMemo(() => categorySummary?.categories?.[0] || null, [categorySummary]);

  return (
    <>
      <style>{STYLES}</style>

      <div className="page-head">
        <div>
          <div className="page-title">Reports & <em>insights.</em></div>
          <div className="page-sub">Monthly summaries, category analysis, and export downloads from the live backend.</div>
        </div>
        <div className="actions">
          <input className="btn" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
          <button className="btn primary" type="button" onClick={() => downloadReport("csv", { month: selectedMonth })}>CSV</button>
          <button className="btn primary" type="button" onClick={() => downloadReport("xlsx", { month: selectedMonth })}>Excel</button>
          <button className="btn primary" type="button" onClick={() => downloadReport("pdf", { month: selectedMonth })}>PDF</button>
        </div>
      </div>

      <div className="reports-wrap">
        {pageError && <div className="error-box">{pageError}</div>}
        {loading && <div className="card">Loading reports...</div>}

        {!loading && monthlyReport && categorySummary && (
          <>
            <div className="hero">
              <div className="hero-grid">
                <div>
                  <div className="label">Report Month</div>
                  <div className="value" style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>{monthlyReport.month}</div>
                  <div className="meta">Live summary for the selected month</div>
                </div>
                <div>
                  <div className="label">Income</div>
                  <div className="value"><AnimatedCounter target={monthlyReport.totals.income} prefix="Rs. " /></div>
                  <div className="meta">Total monthly income</div>
                </div>
                <div>
                  <div className="label">Expense</div>
                  <div className="value"><AnimatedCounter target={monthlyReport.totals.expense} prefix="Rs. " /></div>
                  <div className="meta">Total monthly expense</div>
                </div>
                <div>
                  <div className="label">Balance</div>
                  <div className="value"><AnimatedCounter target={monthlyReport.totals.balance} prefix="Rs. " /></div>
                  <div className="meta">Monthly income minus expense</div>
                </div>
              </div>
            </div>

            <div className="summary-grid">
              <div className="card">
                <div className="label">Top Category</div>
                <div className="value" style={{ fontSize: 18 }}>{topCategory ? topCategory.name : "No expense data"}</div>
                <div className="meta">{topCategory ? `${formatCurrency(topCategory.amount)} | ${topCategory.percentage}% of expense` : "Add expense transactions to see category rankings."}</div>
              </div>
              <div className="card">
                <div className="label">Budget Status</div>
                <div className="value" style={{ fontSize: 18 }}>{monthlyReport.budget ? monthlyReport.budget.status.replace("_", " ") : "No budget"}</div>
                <div className="meta">{monthlyReport.budget ? `${formatCurrency(monthlyReport.budget.remaining_amount)} remaining this month` : "Create a budget from the Budgets page."}</div>
              </div>
              <div className="card">
                <div className="label">Transactions</div>
                <div className="value" style={{ fontSize: 18 }}>{monthlyReport.transactions.length}</div>
                <div className="meta">Recorded entries in this month</div>
              </div>
            </div>

            <div className="two-col">
              <div className="card">
                <div className="label">Category Summary</div>
                {categorySummary.categories.length === 0 ? (
                  <div className="meta">No categories to summarize yet.</div>
                ) : (
                  categorySummary.categories.map((category) => (
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

              <div className="card">
                <div className="label">Monthly Transactions</div>
                {monthlyReport.transactions.length === 0 ? (
                  <div className="meta">No transactions found for this month.</div>
                ) : (
                  monthlyReport.transactions.slice(0, 8).map((transaction) => (
                    <div className="txn-row" key={transaction.id}>
                      <div>
                        <div className="txn-title">{transaction.title}</div>
                        <div className="txn-meta">{transaction.category_name} | {transaction.date}</div>
                      </div>
                      <div className="txn-amount">
                        {transaction.type === "expense" ? "-" : "+"}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
