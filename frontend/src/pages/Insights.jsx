import { useEffect, useState } from "react";
import { AnimatedCounter } from "../components/SharedComponents";

const STYLES = `
.insights-header {
  margin-bottom: 32px;
}

.insights-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--sand-50);
  letter-spacing: -0.02em;
}

.insights-title em { font-style: italic; color: var(--sage-l); }

.insights-sub {
  font-size: 13px;
  color: var(--sand-500);
  font-weight: 300;
  margin-top: 4px;
}

.insight-hero {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 28px 30px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--card-shadow);
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.insight-hero::before {
  content: "";
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.insight-hero-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 24px;
}

.insight-metric {
  text-align: center;
  padding: 12px 0;
}

.insight-metric-value {
  font-family: 'DM Mono', monospace;
  font-size: 26px;
  font-weight: 500;
  color: var(--sand-50);
  letter-spacing: -0.02em;
}

.insight-metric-value.green { color: var(--sage-l); }
.insight-metric-value.red { color: var(--rose); }
.insight-metric-value.amber { color: var(--amber-l); }

.insight-metric-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sand-500);
  margin-top: 6px;
}

.insights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
}

@media (max-width: 860px) {
  .insights-grid { grid-template-columns: 1fr; }
}

.insight-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--card-shadow);
  position: relative;
  overflow: hidden;
  transition: all 0.25s;
}

.insight-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow), 0 8px 20px rgba(0, 0, 0, 0.06);
}

.insight-card-title {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--sand-100);
  margin-bottom: 16px;
}

.trend-row {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 80px;
  padding-top: 8px;
}

.trend-bar {
  flex: 1;
  border-radius: 3px 3px 0 0;
  transition: height 1s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  cursor: pointer;
}

.trend-bar:hover { opacity: 0.8; }

.trend-bar::after {
  content: attr(data-label);
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: var(--sand-500);
  font-family: 'DM Mono', monospace;
  white-space: nowrap;
}

.top-cat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--surface-border);
}

.top-cat-item:last-child { border-bottom: none; }

.top-cat-rank {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--sand-500);
  width: 20px;
}

.top-cat-name {
  flex: 1;
  font-size: 13px;
  color: var(--sand-200);
  font-weight: 500;
}

.top-cat-amount {
  font-family: 'DM Mono', monospace;
  font-size: 12.5px;
  color: var(--sand-400);
}

.month-snapshot {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.snapshot-card {
  flex: 1;
  background: var(--surface-soft-2);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  transition: all 0.2s;
}

.snapshot-card:hover { background: var(--surface-soft-3); }

.snapshot-label {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sand-500);
  margin-bottom: 4px;
}

.snapshot-value {
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  color: var(--sand-100);
  font-weight: 500;
}

.snapshot-month {
  font-size: 10px;
  color: var(--sand-500);
  margin-top: 2px;
}

.habit-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.habit-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface-soft-2);
  border: 1px solid var(--surface-border);
  border-radius: 11px;
  transition: all 0.2s;
}

.habit-item:hover {
  background: var(--surface-soft-3);
  border-color: var(--sage);
}

.habit-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--focus-fill);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-family: 'DM Mono', monospace;
}

.habit-text {
  font-size: 12.5px;
  color: var(--sand-300);
  line-height: 1.5;
  font-weight: 400;
}

.habit-text strong { color: var(--sage-l); font-weight: 600; }

.report-banner {
  background: linear-gradient(135deg, var(--focus-fill), var(--surface-soft-2));
  border: 1px solid var(--sage);
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.report-banner-text {
  font-size: 14px;
  color: var(--sand-200);
  font-weight: 400;
  line-height: 1.5;
}

.report-banner-text strong {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  display: block;
  color: var(--sand-50);
  margin-bottom: 4px;
}

.report-btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--sage-l), var(--amber-l));
  font-family: 'Figtree', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
  transition: all 0.2s;
}

.report-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(122, 158, 135, 0.3);
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const MONTHLY_SPENDING = [
  { month: "Dec", amount: 38000 },
  { month: "Jan", amount: 42000 },
  { month: "Feb", amount: 35000 },
  { month: "Mar", amount: 48000 },
  { month: "Apr", amount: 39000 },
  { month: "May", amount: 41200 },
];

const TOP_CATEGORIES = [
  { name: "Food & Dining", amount: 12400 },
  { name: "Transport", amount: 4800 },
  { name: "Entertainment", amount: 5200 },
  { name: "Shopping", amount: 3100 },
  { name: "Utilities", amount: 2600 },
];

const HABITS = [
  { icon: "H1", text: "You spend <strong>40% more on food</strong> on weekends. Try meal-prepping on Sundays." },
  { icon: "H2", text: "Your <strong>transport costs dropped</strong> 22% since switching to metro." },
  { icon: "H3", text: "Entertainment spending is <strong>Rs. 1,200 over budget</strong>. Consider pausing one subscription." },
  { icon: "H4", text: "You have maintained a <strong>50%+ savings rate</strong> for 3 consecutive months." },
];

function formatCurrency(value) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

function downloadMonthlyReport() {
  const reportContent = [
    "Ledger Monthly Financial Report",
    "Month: May 2026",
    "",
    "Summary",
    "- Savings rate: 57%",
    "- Monthly burn: Rs. 41,200",
    "- Avg days under budget: 14",
    "- Spending vs last month: -12%",
    "",
    "Top Categories",
    ...TOP_CATEGORIES.map((category, index) => `${index + 1}. ${category.name}: ${formatCurrency(category.amount)}`),
    "",
    "Recent Habit Insights",
    ...HABITS.map((habit, index) => `${index + 1}. ${habit.text.replace(/<[^>]+>/g, "")}`),
  ].join("\n");

  const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ledger-monthly-report-may-2026.txt";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Insights() {
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBarsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const maxSpend = Math.max(...MONTHLY_SPENDING.map((month) => month.amount));

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ opacity: 0, animation: "riseIn 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="insights-header">
          <h1 className="insights-title">Financial <em>insights.</em></h1>
          <p className="insights-sub">Your money story, told through data and patterns.</p>
        </div>
      </div>

      <div className="insight-hero" style={{ opacity: 0, animation: "riseIn 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="insight-hero-content">
          <div className="insight-metric">
            <div className="insight-metric-value green">
              <AnimatedCounter target={57} suffix="%" duration={1200} />
            </div>
            <div className="insight-metric-label">Savings Rate</div>
          </div>
          <div className="insight-metric">
            <div className="insight-metric-value">
              <AnimatedCounter target={41200} prefix="Rs. " duration={1200} />
            </div>
            <div className="insight-metric-label">Monthly Burn</div>
          </div>
          <div className="insight-metric">
            <div className="insight-metric-value amber">
              <AnimatedCounter target={14} suffix=" days" duration={1000} decimals={0} />
            </div>
            <div className="insight-metric-label">Avg Days Under Budget</div>
          </div>
          <div className="insight-metric">
            <div className="insight-metric-value green">
              <AnimatedCounter target={12} suffix="%" duration={1000} decimals={0} />
            </div>
            <div className="insight-metric-label">Spending Down vs Last Month</div>
          </div>
        </div>
      </div>

      <div className="insights-grid" style={{ opacity: 0, animation: "riseIn 0.6s 0.35s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="insight-card">
          <div className="insight-card-title">Spending Trend (6 months)</div>
          <div className="trend-row" style={{ marginBottom: 24 }}>
            {MONTHLY_SPENDING.map((month, index) => (
              <div
                key={month.month}
                className="trend-bar"
                data-label={month.month}
                style={{
                  height: barsReady ? `${(month.amount / maxSpend) * 100}%` : "0%",
                  background: index === MONTHLY_SPENDING.length - 1
                    ? "linear-gradient(180deg, var(--sage-l), var(--sage-d))"
                    : "var(--surface-soft-3)",
                  transitionDelay: `${0.1 * index}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-card-title">Top Categories This Month</div>
          {TOP_CATEGORIES.map((category, index) => (
            <div className="top-cat-item" key={category.name}>
              <div className="top-cat-rank">0{index + 1}</div>
              <div className="top-cat-name">{category.name}</div>
              <div className="top-cat-amount">{formatCurrency(category.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="insights-grid" style={{ opacity: 0, animation: "riseIn 0.6s 0.5s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="insight-card">
          <div className="insight-card-title">Best & Worst Months</div>
          <div className="month-snapshot">
            <div className="snapshot-card">
              <div className="snapshot-label">Best Month</div>
              <div className="snapshot-value" style={{ color: "var(--sage-l)" }}>Rs. 35,000</div>
              <div className="snapshot-month">February 2026</div>
            </div>
            <div className="snapshot-card">
              <div className="snapshot-label">Worst Month</div>
              <div className="snapshot-value" style={{ color: "var(--rose)" }}>Rs. 48,000</div>
              <div className="snapshot-month">March 2026</div>
            </div>
          </div>
          <div className="month-snapshot">
            <div className="snapshot-card">
              <div className="snapshot-label">Avg Monthly</div>
              <div className="snapshot-value">Rs. 40,533</div>
              <div className="snapshot-month">6-month avg</div>
            </div>
            <div className="snapshot-card">
              <div className="snapshot-label">Daily Average</div>
              <div className="snapshot-value">Rs. 1,373</div>
              <div className="snapshot-month">This month</div>
            </div>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-card-title">Habits & Suggestions</div>
          <div className="habit-list">
            {HABITS.map((habit, index) => (
              <div className="habit-item" key={index}>
                <div className="habit-icon">{habit.icon}</div>
                <div className="habit-text" dangerouslySetInnerHTML={{ __html: habit.text }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="report-banner" style={{ opacity: 0, animation: "riseIn 0.6s 0.65s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="report-banner-text">
          <strong>Monthly Financial Report</strong>
          Download a detailed report with charts, breakdowns, and recommendations for May 2026.
        </div>
        <button className="report-btn" type="button" onClick={downloadMonthlyReport}>Generate Report</button>
      </div>
    </>
  );
}
