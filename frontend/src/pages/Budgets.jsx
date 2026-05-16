import { useEffect, useMemo, useState } from "react";
import { ProgressRing } from "../components/SharedComponents";
import { createBudget, listBudgets, updateBudget } from "../services/budgets";
import { getBudgetBalance } from "../utils/budgetDisplay";
import { currentMonthValue } from "../utils/dateConstraints";

const STYLES = `
.budget-wrap { display: grid; gap: 18px; }
.budget-card, .budget-form {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 22px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.budget-head { margin-bottom: 24px; }
.budget-title { font-family: 'Playfair Display', serif; font-size: 28px; color: var(--sand-50); }
.budget-sub { color: var(--sand-500); font-size: 13px; margin-top: 4px; }
.budget-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--sand-500); }
.input {
  width: 100%; border-radius: 12px; border: 1px solid var(--surface-strong); background: var(--surface-soft-2);
  color: var(--sand-100); padding: 11px 12px; font-family: 'Figtree', sans-serif;
}
.actions { display: flex; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
.btn {
  border-radius: 12px; padding: 10px 15px; border: 1px solid var(--surface-strong); background: var(--surface-soft);
  color: var(--sand-200); cursor: pointer; font-family: 'Figtree', sans-serif;
}
.btn.primary { border: none; background: linear-gradient(135deg, var(--sage-l), var(--amber-l)); color: var(--ink); }
.stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
.stat-card { border-radius: 16px; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--surface-border); }
.stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sand-500); margin-bottom: 8px; }
.stat-value { font-family: 'DM Mono', monospace; font-size: 20px; color: var(--sand-50); }
.status-chip { display: inline-flex; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--surface-strong); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
.status-chip.healthy { color: var(--sage-l); border-color: var(--sage); }
.status-chip.near_limit { color: var(--amber-l); border-color: var(--amber); }
.status-chip.exceeded { color: var(--rose); border-color: var(--rose); }
.error-box { padding: 12px 14px; border-radius: 12px; color: var(--rose); border: 1px solid rgba(184,112,112,0.35); background: rgba(184,112,112,0.08); }
.budget-progress { display: flex; gap: 18px; align-items: center; }
.progress-copy { display: flex; flex-direction: column; gap: 6px; }
@media (max-width: 860px) { .budget-grid, .form-grid, .stat-grid { grid-template-columns: 1fr; } }
`;

function formatCurrency(value) {
  return `Rs. ${Math.abs(Number(value || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function Budgets() {
  const currentMonth = currentMonthValue();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [allBudgets, setAllBudgets] = useState([]);
  const [draftLimit, setDraftLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadBudgets() {
      setLoading(true);
      setError("");
      try {
        const response = await listBudgets();
        if (mounted) {
          setAllBudgets(response);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || "Unable to load budgets.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadBudgets();
    return () => {
      mounted = false;
    };
  }, []);

  const activeBudget = useMemo(
    () => allBudgets.find((budget) => budget.month.slice(0, 7) === selectedMonth) || null,
    [allBudgets, selectedMonth],
  );

  useEffect(() => {
    setDraftLimit(activeBudget?.limit_amount ? String(activeBudget.limit_amount) : "");
    setMessage("");
    setError("");
  }, [activeBudget, selectedMonth]);

  const progress = activeBudget ? Math.min(Number(activeBudget.progress_percent || 0), 100) : 0;
  const budgetBalance = activeBudget ? getBudgetBalance(activeBudget.remaining_amount) : null;

  const handleSave = async () => {
    if (!draftLimit || Number(draftLimit) <= 0) {
      setError("Please enter a monthly budget above zero.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = { month: selectedMonth, limit_amount: draftLimit };
      const saved = activeBudget
        ? await updateBudget(activeBudget.id, payload)
        : await createBudget(payload);

      setAllBudgets((current) => {
        const next = current.filter((item) => item.month.slice(0, 7) !== selectedMonth);
        return [saved, ...next];
      });
      setMessage(activeBudget ? "Budget updated successfully." : "Budget created successfully.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save this budget.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="budget-head">
        <div className="budget-title">Monthly <em>budget.</em></div>
        <div className="budget-sub">Track one total monthly budget, compare it with actual spending, and catch overages early.</div>
      </div>

      <div className="budget-wrap">
        {error && <div className="error-box">{error}</div>}
        {message && <div className="budget-card">{message}</div>}
        {loading && <div className="budget-card">Loading budgets...</div>}

        {!loading && (
          <div className="budget-grid">
            <div className="budget-card">
              <div className="label" style={{ marginBottom: 12 }}>Selected Month</div>
              <div className="field full">
                <input className="input" type="month" value={selectedMonth} min={currentMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
              </div>

              {activeBudget ? (
                <>
                  <div className="budget-progress" style={{ marginTop: 20 }}>
                    <ProgressRing
                      progress={progress}
                      size={88}
                      strokeWidth={7}
                      color={activeBudget.status === "exceeded" ? "var(--rose)" : activeBudget.status === "near_limit" ? "var(--amber-l)" : "var(--sage-l)"}
                    />
                    <div className="progress-copy">
                      <span className={`status-chip ${activeBudget.status}`}>{activeBudget.status.replace("_", " ")}</span>
                      <div className="stat-value">{progress}% used</div>
                      <div className="budget-sub">Budget month: {activeBudget.month}</div>
                    </div>
                  </div>

                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-label">Budget Limit</div>
                      <div className="stat-value">{formatCurrency(activeBudget.limit_amount)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Spent</div>
                      <div className="stat-value">{formatCurrency(activeBudget.spent_amount)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">{budgetBalance.label}</div>
                      <div className="stat-value">{formatCurrency(budgetBalance.amount)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="budget-sub" style={{ marginTop: 18 }}>No budget exists for this month yet.</div>
              )}
            </div>

            <div className="budget-form">
              <div className="label" style={{ marginBottom: 12 }}>{activeBudget ? "Update Budget" : "Create Budget"}</div>
              <div className="form-grid">
                <div className="field full">
                  <label className="label">Month</label>
                  <input className="input" type="month" value={selectedMonth} min={currentMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
                </div>
                <div className="field full">
                  <label className="label">Monthly Limit</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="50000"
                    value={draftLimit}
                    onChange={(event) => setDraftLimit(event.target.value)}
                  />
                </div>
              </div>
              <div className="actions">
                <button className="btn primary" type="button" disabled={saving} onClick={handleSave}>
                  {saving ? "Saving..." : activeBudget ? "Update Budget" : "Create Budget"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
