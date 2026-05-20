import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatedCounter } from "../components/SharedComponents";
import { downloadReport, fetchCategorySummary, fetchMonthlyReport } from "../services/reports";
import { listTransactions } from "../services/transactions";
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

const QUARTER_OPTIONS = [
  { value: "1", label: "Q1" },
  { value: "2", label: "Q2" },
  { value: "3", label: "Q3" },
  { value: "4", label: "Q4" },
];

const CATEGORY_CHART_COLORS = [
  "#b6d5bf",
  "#e9cc79",
  "#88b4a1",
  "#d8897a",
  "#9ec1d9",
  "#c1a6df",
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
.hero-grid, .summary-grid, .two-col, .control-grid, .visual-grid { display: grid; gap: 16px; }
.hero-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.two-col { grid-template-columns: 1fr 1fr; }
.control-grid { grid-template-columns: repeat(2, minmax(160px, 1fr)); }
.visual-grid { grid-template-columns: 1.2fr 0.8fr; }
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
.chart-shell { margin-top: 16px; height: 280px; }
.chart-meta-row { display: flex; justify-content: space-between; gap: 12px; align-items: end; margin-bottom: 10px; flex-wrap: wrap; }
.chart-note { color: var(--sand-500); font-size: 12px; max-width: 460px; }
.comparison-controls { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
.comparison-control { min-width: 110px; flex: 1 1 130px; }
.legend-inline { display: flex; gap: 14px; flex-wrap: wrap; }
.legend-item { display: inline-flex; align-items: center; gap: 8px; color: var(--sand-300); font-size: 12px; }
.legend-swatch { width: 10px; height: 10px; border-radius: 999px; }
.compare-totals { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.compare-pill {
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  background: rgba(255, 255, 255, 0.03);
}
.compare-pill strong {
  display: block;
  color: var(--sand-100);
  font-size: 12px;
  font-weight: 600;
}
.compare-pill span { color: var(--sand-500); font-size: 11px; }
.chart-tooltip {
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid var(--glass-border);
  background: rgba(18, 16, 12, 0.94);
  box-shadow: var(--card-shadow);
}
.chart-tooltip-title { color: var(--sand-100); font-size: 12px; margin-bottom: 6px; }
.chart-tooltip-row { display: flex; justify-content: space-between; gap: 14px; color: var(--sand-300); font-size: 12px; }
.compare-status { color: var(--sand-500); font-size: 12px; }
.compare-status.error { color: var(--rose); }
@media (max-width: 980px) { .hero-grid, .summary-grid, .two-col, .visual-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 760px) {
  .hero-grid, .summary-grid, .two-col, .control-grid, .visual-grid { grid-template-columns: 1fr; }
  .actions-panel { min-width: 100%; }
}
@media (max-width: 700px) { .hero-grid, .summary-grid, .two-col, .visual-grid { grid-template-columns: 1fr; } }
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

function formatCompactCurrency(value) {
  const numeric = Number(value || 0);
  return `Rs. ${numeric.toLocaleString("en-IN", {
    maximumFractionDigits: 1,
    notation: "compact",
  })}`;
}

function formatDayLabel(dateValue) {
  if (!dateValue) {
    return "";
  }
  const parsed = new Date(`${dateValue}T00:00:00`);
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatPercentage(value) {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
}

function deriveQuarterFromMonth(monthValue) {
  const monthNumber = Number((monthValue || "").slice(5, 7) || 1);
  return Math.floor((monthNumber - 1) / 3) + 1;
}

function deriveYearFromMonth(monthValue) {
  return String((monthValue || "").slice(0, 4) || new Date().getFullYear());
}

function buildQuarterAnchorDate(yearValue, quarterValue) {
  const monthNumber = (Number(quarterValue || 1) - 1) * 3 + 1;
  return `${yearValue}-${String(monthNumber).padStart(2, "0")}-01`;
}

function buildYearAnchorDate(yearValue) {
  return `${yearValue}-01-01`;
}

function isValidHistoricalYear(yearValue, currentYear) {
  return /^\d{4}$/.test(yearValue || "") && Number(yearValue) >= 2000 && Number(yearValue) <= currentYear;
}

function isFutureQuarterSelection(yearValue, quarterValue, currentYear, currentQuarter) {
  const yearNumber = Number(yearValue || 0);
  const quarterNumber = Number(quarterValue || 0);
  return yearNumber > currentYear || (yearNumber === currentYear && quarterNumber > currentQuarter);
}

function formatQuarterSelectionLabel(quarterValue, yearValue) {
  if (!quarterValue || !yearValue) {
    return "the selected quarter";
  }
  return `Q${quarterValue} ${yearValue}`;
}

function buildComparisonPayloadFromTransactions({ transactions = [], anchorDate, range, period }) {
  const anchor = new Date(`${anchorDate}T00:00:00`);
  const startMonthIndex = period === "yearly" ? 0 : Math.floor(anchor.getMonth() / 3) * 3;
  const startMonth = new Date(anchor.getFullYear(), startMonthIndex, 1);
  const monthCount = period === "yearly" ? 12 : 3;
  const series = Array.from({ length: monthCount }, (_, offset) => {
    const bucketDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + offset, 1);
    const month = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, "0")}-01`;
    return {
      month,
      label: bucketDate.toLocaleDateString("en-IN", { month: "short" }),
      income: 0,
      expense: 0,
      balance: 0,
    };
  });

  const buckets = new Map(series.map((item) => [item.month, item]));
  transactions.forEach((transaction) => {
    const monthKey = transaction?.date ? `${transaction.date.slice(0, 7)}-01` : "";
    const bucket = buckets.get(monthKey);
    if (!bucket) {
      return;
    }

    const amount = Number(transaction.amount || 0);
    if (transaction.type === "income") {
      bucket.income += amount;
    } else {
      bucket.expense += amount;
    }
  });

  series.forEach((item) => {
    item.balance = item.income - item.expense;
  });

  return {
    label:
      period === "yearly"
        ? String(startMonth.getFullYear())
        : formatQuarterSelectionLabel(String(Math.floor(startMonth.getMonth() / 3) + 1), String(startMonth.getFullYear())),
    start: range.start,
    end: range.end,
    series,
  };
}

function summarizeComparisonSeries(series = []) {
  return series.reduce(
    (summary, item) => {
      summary.income += Number(item.income || 0);
      summary.expense += Number(item.expense || 0);
      return summary;
    },
    { income: 0, expense: 0, balance: 0 },
  );
}

function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((entry) => (
        <div className="chart-tooltip-row" key={entry.dataKey || entry.name}>
          <span>{entry.name}</span>
          <span>
            {formatCurrency(entry.value)}
            {entry.payload?.percentage ? ` | ${formatPercentage(entry.payload.percentage)}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Insights() {
  const today = todayValue();
  const currentMonth = currentMonthValue();
  const currentYear = Number(currentMonth.slice(0, 4));
  const currentQuarter = deriveQuarterFromMonth(currentMonth);
  const initialRange = buildReportRange("monthly");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue());
  const [selectedQuarter, setSelectedQuarter] = useState(String(deriveQuarterFromMonth(currentMonth)));
  const [selectedQuarterYear, setSelectedQuarterYear] = useState(deriveYearFromMonth(currentMonth));
  const [selectedYear, setSelectedYear] = useState(deriveYearFromMonth(currentMonth));
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [reportFromDate, setReportFromDate] = useState(initialRange.start);
  const [reportToDate, setReportToDate] = useState(initialRange.end);
  const [downloading, setDownloading] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [categorySummary, setCategorySummary] = useState(null);
  const [quarterComparison, setQuarterComparison] = useState(null);
  const [yearComparison, setYearComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quarterLoading, setQuarterLoading] = useState(true);
  const [yearLoading, setYearLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [quarterError, setQuarterError] = useState("");
  const [yearError, setYearError] = useState("");
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

  useEffect(() => {
    const hasValidYear = isValidHistoricalYear(selectedQuarterYear, currentYear);
    const hasFutureQuarter = hasValidYear && isFutureQuarterSelection(selectedQuarterYear, selectedQuarter, currentYear, currentQuarter);

    if (!hasValidYear) {
      setQuarterLoading(false);
      setQuarterComparison(null);
      setQuarterError("Enter a year from 2000 to the current year to compare a quarter.");
      return undefined;
    }

    if (hasFutureQuarter) {
      setQuarterLoading(false);
      setQuarterComparison(null);
      setQuarterError("Future quarters are not available yet.");
      return undefined;
    }

    let mounted = true;
    setQuarterLoading(true);
    setQuarterError("");

    const anchorDate = buildQuarterAnchorDate(selectedQuarterYear, selectedQuarter);
    const range = buildReportRange("quarterly", anchorDate);

    listTransactions({ start_date: range.start, end_date: range.end, ordering: "oldest" })
      .then((transactions) => {
        if (mounted) {
          setQuarterComparison(
            buildComparisonPayloadFromTransactions({
              transactions,
              anchorDate,
              range,
              period: "quarterly",
            }),
          );
        }
      })
      .catch((error) => {
        if (mounted) {
          setQuarterComparison(null);
          setQuarterError(error.message || "Unable to load the quarter comparison.");
        }
      })
      .finally(() => {
        if (mounted) {
          setQuarterLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [currentQuarter, currentYear, selectedQuarter, selectedQuarterYear]);

  useEffect(() => {
    const hasValidYear = isValidHistoricalYear(selectedYear, currentYear);

    if (!hasValidYear) {
      setYearLoading(false);
      setYearComparison(null);
      setYearError("Enter a year from 2000 to the current year to compare a year.");
      return undefined;
    }

    let mounted = true;
    setYearLoading(true);
    setYearError("");

    const anchorDate = buildYearAnchorDate(selectedYear);
    const range = buildReportRange("yearly", anchorDate);

    listTransactions({ start_date: range.start, end_date: range.end, ordering: "oldest" })
      .then((transactions) => {
        if (mounted) {
          setYearComparison(
            buildComparisonPayloadFromTransactions({
              transactions,
              anchorDate,
              range,
              period: "yearly",
            }),
          );
        }
      })
      .catch((error) => {
        if (mounted) {
          setYearComparison(null);
          setYearError(error.message || "Unable to load the yearly comparison.");
        }
      })
      .finally(() => {
        if (mounted) {
          setYearLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [currentYear, selectedYear]);

  const topCategory = useMemo(() => categorySummary?.categories?.[0] || null, [categorySummary]);
  const trendData = useMemo(() => {
    if (!monthlyReport?.transactions?.length) {
      return [];
    }

    const grouped = new Map();
    monthlyReport.transactions.forEach((transaction) => {
      const key = transaction.date;
      if (!grouped.has(key)) {
        grouped.set(key, {
          date: key,
          label: formatDayLabel(key),
          income: 0,
          expense: 0,
        });
      }

      const bucket = grouped.get(key);
      const amount = Number(transaction.amount || 0);
      if (transaction.type === "income") {
        bucket.income += amount;
      } else {
        bucket.expense += amount;
      }
    });

    return Array.from(grouped.values());
  }, [monthlyReport]);
  const categoryChartData = useMemo(() => {
    const categories = categorySummary?.categories || [];
    if (categories.length <= 6) {
      return categories.map((category) => ({
        ...category,
        amount: Number(category.amount || 0),
      }));
    }

    const visible = categories.slice(0, 5).map((category) => ({
      ...category,
      amount: Number(category.amount || 0),
    }));
    const otherAmount = categories.slice(5).reduce((sum, category) => sum + Number(category.amount || 0), 0);
    const otherPercentage = categories.slice(5).reduce((sum, category) => sum + Number(category.percentage || 0), 0);

    return [
      ...visible,
      {
        name: "Other",
        amount: otherAmount,
        percentage: Number(otherPercentage.toFixed(2)),
      },
    ];
  }, [categorySummary]);
  const quarterTotals = useMemo(() => {
    const totals = summarizeComparisonSeries(quarterComparison?.series);
    return { ...totals, balance: totals.income - totals.expense };
  }, [quarterComparison]);
  const yearTotals = useMemo(() => {
    const totals = summarizeComparisonSeries(yearComparison?.series);
    return { ...totals, balance: totals.income - totals.expense };
  }, [yearComparison]);

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

            <div className="visual-grid">
              <div className="card">
                <div className="chart-meta-row">
                  <div>
                    <div className="label">Cash Flow Trend</div>
                    <div className="chart-note">Income and expense movement across the selected month, grouped by transaction day.</div>
                  </div>
                  <div className="legend-inline">
                    <span className="legend-item"><span className="legend-swatch" style={{ background: "#b6d5bf" }} />Income</span>
                    <span className="legend-item"><span className="legend-swatch" style={{ background: "#d8897a" }} />Expense</span>
                  </div>
                </div>
                {trendData.length === 0 ? (
                  <div className="meta">Add transactions in this month to see the flow chart.</div>
                ) : (
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b6d5bf" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#b6d5bf" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d8897a" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#d8897a" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(215, 201, 177, 0.08)" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="label" stroke="rgba(215, 201, 177, 0.55)" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis stroke="rgba(215, 201, 177, 0.55)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatCompactCurrency} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#b6d5bf" strokeWidth={2.4} fill="url(#incomeFill)" />
                        <Area type="monotone" dataKey="expense" name="Expense" stroke="#d8897a" strokeWidth={2.2} fill="url(#expenseFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="chart-meta-row">
                  <div>
                    <div className="label">Expense Mix</div>
                    <div className="chart-note">A quick visual split of where this month&apos;s spending went.</div>
                  </div>
                </div>
                {categoryChartData.length === 0 ? (
                  <div className="meta">No expense categories yet for this month.</div>
                ) : (
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="amount"
                          nameKey="name"
                          innerRadius={56}
                          outerRadius={92}
                          paddingAngle={3}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={entry.name} fill={CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "12px", color: "var(--sand-300)" }}
                          formatter={(value, entry) => `${value} (${formatPercentage(entry.payload?.percentage)})`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="two-col">
              <div className="card">
                <div className="chart-meta-row">
                  <div>
                    <div className="label">Quarterly Comparison</div>
                    <div className="chart-note">Income versus expense across {quarterComparison?.label || formatQuarterSelectionLabel(selectedQuarter, selectedQuarterYear)}.</div>
                    <div className="comparison-controls">
                      <label className="control-stack comparison-control">
                        <span className="control-label">Quarter</span>
                        <select className="input-shell" value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)}>
                          {QUARTER_OPTIONS.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              disabled={Number(selectedQuarterYear) === currentYear && Number(option.value) > currentQuarter}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="control-stack comparison-control">
                        <span className="control-label">Year</span>
                        <input
                          className="input-shell"
                          type="number"
                          min="2000"
                          max={currentYear}
                          value={selectedQuarterYear}
                          onChange={(event) => setSelectedQuarterYear(event.target.value.slice(0, 4))}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="legend-inline">
                    <span className="legend-item"><span className="legend-swatch" style={{ background: "#b6d5bf" }} />Income</span>
                    <span className="legend-item"><span className="legend-swatch" style={{ background: "#d8897a" }} />Expense</span>
                  </div>
                </div>
                <div className="compare-totals">
                  <div className="compare-pill">
                    <strong>{formatCurrency(quarterTotals.income)}</strong>
                    <span>Quarter income</span>
                  </div>
                  <div className="compare-pill">
                    <strong>{formatCurrency(quarterTotals.expense)}</strong>
                    <span>Quarter expense</span>
                  </div>
                  <div className="compare-pill">
                    <strong>{formatCurrency(quarterTotals.balance)}</strong>
                    <span>Net balance</span>
                  </div>
                </div>
                {quarterLoading ? (
                  <div className="compare-status">Loading quarter comparison...</div>
                ) : quarterError ? (
                  <div className="compare-status error">{quarterError}</div>
                ) : quarterComparison?.series?.length ? (
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quarterComparison.series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                        <CartesianGrid stroke="rgba(215, 201, 177, 0.08)" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="label" stroke="rgba(215, 201, 177, 0.55)" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis stroke="rgba(215, 201, 177, 0.55)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatCompactCurrency} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="income" name="Income" fill="#b6d5bf" radius={[10, 10, 0, 0]} maxBarSize={34} />
                        <Bar dataKey="expense" name="Expense" fill="#d8897a" radius={[10, 10, 0, 0]} maxBarSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="meta">Add transactions in this quarter to compare monthly income and expense.</div>
                )}
              </div>

              <div className="card">
                <div className="chart-meta-row">
                  <div>
                    <div className="label">Yearly Comparison</div>
                    <div className="chart-note">A month-by-month view of income versus expense across {yearComparison?.label || selectedYear || "the selected year"}.</div>
                    <div className="comparison-controls">
                      <label className="control-stack comparison-control">
                        <span className="control-label">Year</span>
                        <input
                          className="input-shell"
                          type="number"
                          min="2000"
                          max={currentYear}
                          value={selectedYear}
                          onChange={(event) => setSelectedYear(event.target.value.slice(0, 4))}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="legend-inline">
                    <span className="legend-item"><span className="legend-swatch" style={{ background: "#b6d5bf" }} />Income</span>
                    <span className="legend-item"><span className="legend-swatch" style={{ background: "#d8897a" }} />Expense</span>
                  </div>
                </div>
                <div className="compare-totals">
                  <div className="compare-pill">
                    <strong>{formatCurrency(yearTotals.income)}</strong>
                    <span>Year income</span>
                  </div>
                  <div className="compare-pill">
                    <strong>{formatCurrency(yearTotals.expense)}</strong>
                    <span>Year expense</span>
                  </div>
                  <div className="compare-pill">
                    <strong>{formatCurrency(yearTotals.balance)}</strong>
                    <span>Net balance</span>
                  </div>
                </div>
                {yearLoading ? (
                  <div className="compare-status">Loading yearly comparison...</div>
                ) : yearError ? (
                  <div className="compare-status error">{yearError}</div>
                ) : yearComparison?.series?.length ? (
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearComparison.series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barCategoryGap="24%">
                        <CartesianGrid stroke="rgba(215, 201, 177, 0.08)" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="label" stroke="rgba(215, 201, 177, 0.55)" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis stroke="rgba(215, 201, 177, 0.55)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatCompactCurrency} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="income" name="Income" fill="#b6d5bf" radius={[8, 8, 0, 0]} maxBarSize={22} />
                        <Bar dataKey="expense" name="Expense" fill="#d8897a" radius={[8, 8, 0, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="meta">Add transactions in this year to compare income and expense by month.</div>
                )}
              </div>
            </div>

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
          </>
        )}
      </div>
    </>
  );
}
