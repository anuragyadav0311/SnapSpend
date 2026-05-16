import { useEffect, useMemo, useState } from "react";
import { AnimatedCounter } from "../components/SharedComponents";
import { downloadReport, fetchCategorySummary, fetchMonthlyReport } from "../services/reports";
import { getBudgetBalance } from "../utils/budgetDisplay";
import { buildReportRange, clampDateToToday, currentMonthValue, normalizeDateRange, todayValue } from "../utils/dateConstraints";

const REPORT_PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const REPORT_FORMAT_OPTIONS = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
  { value: "pdf", label: "PDF" },
];

const STYLES = `
.reports-wrap { display: grid; gap: 18px; }
.page-head { display: flex; justify-content: space-between; gap: 16px; align-items: start; margin-bottom: 24px; flex-wrap: wrap; }
.page-title { font-family: 'Playfair Display', serif; font-size: 28px; color: var(--sand-50); }
.page-sub { color: var(--sand-500); font-size: 13px; margin-top: 4px; max-width: 620px; }
.card, .hero {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 22px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.hero-grid, .summary-grid, .two-col, .control-grid { display: grid; gap: 16px; }
.hero-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.two-col { grid-template-columns: 1fr 1fr; }
.control-grid { grid-template-columns: repeat(2, minmax(160px, 1fr)); }
.control-stack { display: grid; gap: 8px; min-width: 160px; }
.actions-panel { min-width: min(100%, 640px); display: grid; gap: 14px; }
.label, .control-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sand-500); }
.value { font-family: 'DM Mono', monospace; font-size: 22px; color: var(--sand-50); }
.meta { color: var(--sand-500); font-size: 12px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: end; }
.input-shell {
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  color: var(--sand-100);
  font-family: 'Figtree', sans-serif;
  min-height: 42px;
}
select.input-shell {
  color-scheme: dark;
  appearance: none;
  -webkit-appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--sand-300) 50%),
    linear-gradient(135deg, var(--sand-300) 50%, transparent 50%);
  background-position:
    calc(100% - 18px) calc(50% - 2px),
    calc(100% - 12px) calc(50% - 2px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  padding-right: 34px;
}
select.input-shell option {
  background: #f6efe4;
  color: #231a12;
}
.input-shell:focus {
  outline: none;
  border-color: var(--sage);
  box-shadow: 0 0 0 3px var(--focus-ring);
}
.btn {
  border-radius: 12px;
  padding: 10px 14px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  color: var(--sand-200);
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  min-height: 42px;
}
.btn.primary { border: none; background: linear-gradient(135deg, var(--sage-l), var(--amber-l)); color: var(--ink); }
.btn:disabled { opacity: 0.65; cursor: wait; }
.bar-row { padding: 12px 0; border-bottom: 1px solid var(--surface-border); }
.bar-row:last-child { border-bottom: none; }
.bar-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; color: var(--sand-300); font-size: 12px; }
.bar-track { height: 8px; border-radius: 999px; background: var(--surface-hover); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--sage-l), var(--amber-l)); }
.txn-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--surface-border); }
.txn-row:last-child { border-bottom: none; }
.txn-title { color: var(--sand-100); font-size: 13px; font-weight: 500; }
.txn-meta { color: var(--sand-500); font-size: 11px; margin-top: 2px; }
.txn-side { text-align: right; }
.txn-amount { font-family: 'DM Mono', monospace; color: var(--sand-100); font-size: 13px; white-space: nowrap; }
.txn-balance { color: var(--sand-500); font-size: 11px; margin-top: 4px; }
.error-box { padding: 12px 14px; border-radius: 12px; color: var(--rose); border: 1px solid rgba(184,112,112,0.35); background: rgba(184,112,112,0.08); }
@media (max-width: 980px) { .hero-grid, .summary-grid, .two-col { grid-template-columns: 1fr 1fr; } }
@media (max-width: 760px) {
  .hero-grid, .summary-grid, .two-col, .control-grid { grid-template-columns: 1fr; }
  .actions-panel { min-width: 100%; }
}
@media (max-width: 700px) { .hero-grid, .summary-grid, .two-col { grid-template-columns: 1fr; } }
`;

function formatCurrency(value, options = {}) {
  const numeric = Number(value || 0);
  const amount = options.absolute ? Math.abs(numeric) : numeric;
  return `Rs. ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDisplayDate(transaction) {
  if (transaction?.display_date) {
    return transaction.display_date;
  }
  if (!transaction?.date) {
    return "";
  }
  const [year, month, day] = transaction.date.split("-");
  return `${day}-${month}-${year}`;
}

export default function Insights() {
  const today = todayValue();
  const currentMonth = currentMonthValue();
  const initialRange = buildReportRange("monthly");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue());
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [reportFormat, setReportFormat] = useState("xlsx");
  const [reportFromDate, setReportFromDate] = useState(initialRange.start);
  const [reportToDate, setReportToDate] = useState(initialRange.end);
  const [downloading, setDownloading] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [categorySummary, setCategorySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const budgetBalance = monthlyReport?.budget ? getBudgetBalance(monthlyReport.budget.remaining_amount) : null;

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

  async function handleDownloadReport() {
    const snappedRange = buildReportRange(reportPeriod, reportFromDate || reportToDate || today);
    const normalizedRange = normalizeDateRange(snappedRange.start, snappedRange.end);

    if (normalizedRange.startDate !== reportFromDate) {
      setReportFromDate(normalizedRange.startDate);
    }
    if (normalizedRange.endDate !== reportToDate) {
      setReportToDate(normalizedRange.endDate);
    }

    if (normalizedRange.startDate && normalizedRange.endDate && normalizedRange.startDate > normalizedRange.endDate) {
      setPageError("The from date must be earlier than or equal to the to date.");
      return;
    }

    setDownloading(true);
    setPageError("");
    try {
      await downloadReport(reportFormat, {
        period: reportPeriod,
        start_date: normalizedRange.startDate,
        end_date: normalizedRange.endDate,
        reference_date: normalizedRange.startDate,
      });
    } catch (error) {
      setPageError(error.message || "Unable to download the report.");
    } finally {
      setDownloading(false);
    }
  }

  function handlePeriodChange(nextPeriod) {
    setReportPeriod(nextPeriod);
    const nextRange = buildReportRange(nextPeriod, today);
    setReportFromDate(nextRange.start);
    setReportToDate(nextRange.end);
  }

  function handleReportFromDateChange(value) {
    const nextRange = buildReportRange(reportPeriod, clampDateToToday(value) || today);
    setReportFromDate(nextRange.start);
    setReportToDate(nextRange.end);
  }

  function handleReportToDateChange(value) {
    const nextRange = buildReportRange(reportPeriod, clampDateToToday(value) || today);
    setReportFromDate(nextRange.start);
    setReportToDate(nextRange.end);
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="page-head">
        <div>
          <div className="page-title">Reports & <em>insights.</em></div>
          <div className="page-sub">Monthly summaries on the page, plus downloadable daily, weekly, monthly, quarterly, and yearly reports with your own date window.</div>
        </div>

        <div className="card actions-panel">
          <div className="control-stack">
            <div className="control-label">Summary Month</div>
            <input className="input-shell" type="month" value={selectedMonth} max={currentMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
          </div>

          <div className="control-grid">
            <label className="control-stack">
              <span className="control-label">Report Period</span>
              <select className="input-shell" value={reportPeriod} onChange={(event) => handlePeriodChange(event.target.value)}>
                {REPORT_PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="control-stack">
              <span className="control-label">Format</span>
              <select className="input-shell" value={reportFormat} onChange={(event) => setReportFormat(event.target.value)}>
                {REPORT_FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="control-stack">
              <span className="control-label">From Date</span>
              <input className="input-shell" type="date" value={reportFromDate} max={reportToDate || today} onChange={(event) => handleReportFromDateChange(event.target.value)} />
            </label>

            <label className="control-stack">
              <span className="control-label">To Date</span>
              <input className="input-shell" type="date" value={reportToDate} min={reportFromDate || undefined} max={today} onChange={(event) => handleReportToDateChange(event.target.value)} />
            </label>
          </div>

          <div className="actions">
            <button className="btn primary" type="button" onClick={handleDownloadReport} disabled={downloading}>
              {downloading ? "Preparing Report..." : "Download Report"}
            </button>
          </div>
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
                <div className="meta">{monthlyReport.budget ? `${formatCurrency(budgetBalance.amount)} ${budgetBalance.sentence} this month` : "Create a budget from the Budgets page."}</div>
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
                        <div className="txn-meta">{transaction.category_name} | {formatDisplayDate(transaction)}</div>
                      </div>
                      <div className="txn-side">
                        <div className="txn-amount">
                          {transaction.type === "expense" ? "-" : "+"}{formatCurrency(transaction.amount, { absolute: true })}
                        </div>
                        <div className="txn-balance">Balance: {formatCurrency(transaction.available_balance)}</div>
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
