import { useEffect, useMemo, useState } from "react";
import { ProgressRing } from "../components/SharedComponents";

const STYLES = `
.budgets-header {
  margin-bottom: 28px;
}

.budgets-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--sand-50);
  letter-spacing: -0.02em;
}

.budgets-title em { font-style: italic; color: var(--amber-l); }

.budgets-sub {
  font-size: 13px;
  color: var(--sand-500);
  font-weight: 300;
  margin-top: 4px;
}

.budget-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid var(--glass-border);
  box-shadow: var(--card-shadow);
  flex-wrap: wrap;
}

.budget-toolbar-copy {
  min-width: 0;
}

.budget-toolbar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sand-100);
}

.budget-toolbar-note {
  font-size: 11.5px;
  color: var(--sand-500);
  margin-top: 4px;
}

.budget-toolbar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.budget-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 12px;
  padding: 11px 16px;
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink);
  background: linear-gradient(135deg, var(--sage-l), var(--amber-l));
  box-shadow: var(--btn-shadow);
  transition: transform 0.18s, box-shadow 0.18s, filter 0.18s;
}

.budget-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--btn-shadow-hover);
  filter: brightness(1.03);
}

.budget-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.budget-btn.secondary {
  background: var(--surface-soft);
  border: 1px solid var(--surface-strong);
  color: var(--sand-300);
  box-shadow: none;
}

.budget-btn.secondary:hover:not(:disabled) {
  color: var(--sand-100);
  background: var(--surface-soft-2);
}

.budget-editor-shell {
  margin-bottom: 24px;
  padding: 22px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02));
  border: 1px solid var(--glass-border);
  box-shadow: var(--card-shadow);
}

.budget-editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.budget-editor-title {
  font-family: 'Playfair Display', serif;
  font-size: 19px;
  color: var(--sand-50);
}

.budget-editor-title em { font-style: italic; color: var(--amber-l); }

.budget-editor-sub {
  font-size: 12px;
  color: var(--sand-500);
  margin-top: 4px;
}

.budget-editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.budget-editor-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.budget-editor-field.full {
  grid-column: 1 / -1;
}

.budget-editor-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sand-500);
}

.budget-editor-input,
.budget-editor-select {
  width: 100%;
  border-radius: 11px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft-2);
  color: var(--sand-100);
  padding: 11px 12px;
  outline: none;
  font-family: 'Figtree', sans-serif;
  font-size: 13px;
}

.budget-editor-select {
  color-scheme: dark;
}

.budget-editor-select option {
  background: #f6efe4;
  color: #231a12;
}

.budget-editor-input:focus,
.budget-editor-select:focus {
  border-color: var(--sage);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.swatch-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
}

.swatch.sel {
  border-color: rgba(255,255,255,0.65);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.swatch:hover {
  transform: scale(1.06);
}

.budget-editor-error {
  margin-top: 12px;
  font-size: 12px;
  color: var(--rose);
}

.budget-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  opacity: 0;
  animation: riseIn 0.6s 0.15s cubic-bezier(0.22,1,0.36,1) forwards;
}

.month-nav-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.month-nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sand-400);
  transition: all 0.2s;
}

.month-nav-btn:hover:not(:disabled) {
  background: var(--surface-soft-2);
  color: var(--sand-200);
}

.month-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.month-label {
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  color: var(--sand-200);
  letter-spacing: -0.01em;
}

.month-range-note {
  font-size: 11px;
  color: var(--sand-500);
}

.budget-overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 26px;
}

.budget-overview-card {
  padding: 16px 18px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid var(--glass-border);
  box-shadow: var(--card-shadow);
}

.budget-overview-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sand-500);
  margin-bottom: 8px;
}

.budget-overview-value {
  font-family: 'DM Mono', monospace;
  font-size: 20px;
  color: var(--sand-50);
}

.budget-overview-note {
  font-size: 11px;
  color: var(--sand-500);
  margin-top: 6px;
}

.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.budget-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--card-shadow);
  position: relative;
  overflow: hidden;
  transition: all 0.25s;
}

.budget-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.budget-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow), 0 8px 20px rgba(0,0,0,0.06);
}

.budget-card.over {
  border-color: var(--rose);
  box-shadow: 0 0 0 1px rgba(184,112,112,0.2), var(--card-shadow);
}

.budget-card.near {
  border-color: var(--amber);
}

.budget-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.budget-card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.budget-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--sand-100);
}

.budget-card-emoji {
  font-size: 20px;
}

.budget-chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.budget-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--surface-soft-2);
  border: 1px solid var(--surface-border);
  font-size: 10px;
  color: var(--sand-400);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.budget-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.budget-card-btn {
  border-radius: 10px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  color: var(--sand-300);
  font-size: 11px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.18s;
}

.budget-card-btn:hover {
  background: var(--surface-soft-2);
  color: var(--sand-100);
}

.budget-card-btn.danger {
  border-color: rgba(184,112,112,0.35);
  color: var(--rose);
}

.budget-card-ring {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.budget-card-stats {
  flex: 1;
}

.budget-card-spent {
  font-family: 'DM Mono', monospace;
  font-size: 18px;
  color: var(--sand-50);
  font-weight: 500;
}

.budget-card-limit {
  font-size: 12px;
  color: var(--sand-500);
  margin-top: 2px;
}

.budget-card-bar {
  width: 100%;
  height: 5px;
  border-radius: 3px;
  background: var(--surface-hover);
  overflow: hidden;
}

.budget-card-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.budget-card-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  gap: 12px;
  font-size: 11px;
  color: var(--sand-500);
}

.budget-card-footer .remaining { color: var(--sage-l); }
.budget-card-footer .over-text { color: var(--rose); }

.empty-shell {
  padding: 34px 28px;
  border-radius: 20px;
  border: 1px dashed var(--surface-stronger);
  background: rgba(255,255,255,0.02);
  text-align: center;
  margin-bottom: 32px;
}

.empty-shell-title {
  font-family: 'Playfair Display', serif;
  font-size: 21px;
  color: var(--sand-50);
}

.empty-shell-copy {
  font-size: 13px;
  color: var(--sand-500);
  max-width: 420px;
  margin: 8px auto 0;
  line-height: 1.55;
}

.empty-shell-actions {
  margin-top: 18px;
  display: flex;
  justify-content: center;
}

.section-block {
  margin-bottom: 32px;
}

.section-block-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--sand-100);
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}

.section-block-shell {
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015));
  box-shadow: var(--card-shadow);
}

.recurring-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.recurring-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 16px 18px;
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.recurring-card:hover {
  transform: translateX(3px);
  border-color: var(--surface-border-3);
}

.recurring-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--surface-soft-3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.recurring-info { flex: 1; }

.recurring-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--sand-200);
}

.recurring-meta {
  font-size: 11px;
  color: var(--sand-500);
  font-weight: 300;
}

.recurring-amount {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: var(--sand-300);
}

.savings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.savings-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 22px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--card-shadow);
  transition: all 0.25s;
}

.savings-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow), 0 6px 18px rgba(0,0,0,0.06);
}

.savings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.savings-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--sand-100);
}

.savings-target {
  font-size: 11px;
  color: var(--sand-500);
  font-family: 'DM Mono', monospace;
}

.savings-bar-wrap {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--surface-hover);
  overflow: hidden;
  margin-bottom: 8px;
}

.savings-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--sage-d), var(--sage-l));
  transition: width 1.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.savings-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 11.5px;
  color: var(--sand-500);
}

.savings-footer .saved { color: var(--sage-l); font-weight: 500; }

@media (max-width: 960px) {
  .budget-overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .budget-editor-grid {
    grid-template-columns: 1fr;
  }

  .month-nav {
    align-items: flex-start;
    flex-direction: column;
  }

  .budget-card-top,
  .budget-card-ring,
  .savings-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .budget-card-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .budget-overview-grid {
    grid-template-columns: 1fr;
  }

  .section-block-shell,
  .budget-editor-shell,
  .budget-toolbar {
    padding: 18px;
  }

  .budget-grid,
  .savings-grid,
  .recurring-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const STORAGE_KEY = "ledger-monthly-budgets";
const MONTHS_BACK = 6;
const MONTHS_FORWARD = 1;

const PALETTE_OPTIONS = [
  "var(--amber)",
  "var(--sage-l)",
  "var(--rose)",
  "#8b7cf6",
  "#60a5fa",
  "#34d399",
];

const EMOJI_OPTIONS = ["🍽️", "🚗", "🎬", "🛍️", "⚡", "🏋️", "💊", "🏠", "✈️", "📚"];

const BUDGET_TEMPLATES = [
  { id: "food-dining", name: "Food & Dining", emoji: "🍽️", spent: 12400, limit: 15000, color: "var(--amber)" },
  { id: "transport", name: "Transport", emoji: "🚗", spent: 4800, limit: 6000, color: "var(--sage-l)" },
  { id: "entertainment", name: "Entertainment", emoji: "🎬", spent: 5200, limit: 4000, color: "var(--rose)" },
  { id: "shopping", name: "Shopping", emoji: "🛍️", spent: 3100, limit: 8000, color: "#8b7cf6" },
  { id: "utilities", name: "Utilities", emoji: "⚡", spent: 2600, limit: 4000, color: "#60a5fa" },
  { id: "health-fitness", name: "Health & Fitness", emoji: "🏋️", spent: 1500, limit: 3000, color: "#34d399" },
];

const RECURRING = [
  { name: "Netflix", amount: 649, cycle: "Monthly · May 12", icon: "🎬" },
  { name: "Spotify", amount: 499, cycle: "Monthly · May 15", icon: "🎵" },
  { name: "iCloud Storage", amount: 75, cycle: "Monthly · May 18", icon: "☁️" },
  { name: "Gym Cult.fit", amount: 1500, cycle: "Monthly · May 1", icon: "🏋️" },
  { name: "Internet - Airtel", amount: 999, cycle: "Monthly · May 5", icon: "📡" },
];

const SAVINGS_GOALS = [
  { name: "Emergency Fund", saved: 180000, target: 300000 },
  { name: "Japan Trip 2027", saved: 45000, target: 200000 },
  { name: "MacBook Pro", saved: 92000, target: 150000 },
];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function monthDiff(fromDate, toDate) {
  return (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth());
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(value) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function createBudgetId() {
  return `budget-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readBudgetStore() {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

function writeBudgetStore(nextStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
}

function seededBudgetsForMonth(date) {
  const currentMonth = startOfMonth(new Date());
  const offset = monthDiff(currentMonth, startOfMonth(date));

  return BUDGET_TEMPLATES.map((template, index) => {
    const limitShift = 1 + offset * 0.03;
    const normalizedLimit = Math.max(1500, Math.round(template.limit * limitShift));
    const baseRatio = template.spent / template.limit;
    const ratioShift = ((index % 3) - 1) * 0.035 + offset * 0.04;
    const normalizedRatio = Math.min(1.12, Math.max(0.28, baseRatio + ratioShift));

    return {
      ...template,
      id: `${template.id}-${monthKey(date)}`,
      limit: normalizedLimit,
      spent: Math.round(normalizedLimit * normalizedRatio),
    };
  });
}

function getBudgetsForMonth(date) {
  const key = monthKey(date);
  const store = readBudgetStore();

  if (store[key]) {
    return store[key];
  }

  const seeded = seededBudgetsForMonth(date);
  writeBudgetStore({ ...store, [key]: seeded });
  return seeded;
}

function saveBudgetsForMonth(date, budgets) {
  const key = monthKey(date);
  const store = readBudgetStore();
  writeBudgetStore({ ...store, [key]: budgets });
}

function createEmptyDraft() {
  return {
    id: "",
    name: "",
    emoji: EMOJI_OPTIONS[0],
    limit: "",
    spent: "",
    color: PALETTE_OPTIONS[0],
  };
}

export default function Budgets() {
  const todayMonth = useMemo(() => startOfMonth(new Date()), []);
  const minMonth = useMemo(() => addMonths(todayMonth, -MONTHS_BACK), [todayMonth]);
  const maxMonth = useMemo(() => addMonths(todayMonth, MONTHS_FORWARD), [todayMonth]);

  const [barsReady, setBarsReady] = useState(false);
  const [activeMonth, setActiveMonth] = useState(todayMonth);
  const [budgets, setBudgets] = useState(() => getBudgetsForMonth(todayMonth));
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(createEmptyDraft);
  const [editorError, setEditorError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setBarsReady(true), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setBudgets(getBudgetsForMonth(activeMonth));
    setEditorOpen(false);
    setEditorError("");
  }, [activeMonth]);

  const monthLabel = activeMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const canGoPrev = activeMonth.getTime() > minMonth.getTime();
  const canGoNext = activeMonth.getTime() < maxMonth.getTime();

  const totalBudget = budgets.reduce((sum, item) => sum + Number(item.limit), 0);
  const totalSpent = budgets.reduce((sum, item) => sum + Number(item.spent), 0);
  const totalLeft = totalBudget - totalSpent;
  const overspentCount = budgets.filter((item) => Number(item.spent) > Number(item.limit)).length;
  const savingsProgress = Math.round(
    (SAVINGS_GOALS.reduce((sum, goal) => sum + goal.saved / goal.target, 0) / SAVINGS_GOALS.length) * 100,
  );

  const shiftMonth = (delta) => {
    setActiveMonth((current) => {
      const next = addMonths(current, delta);
      if (next < minMonth) {
        return minMonth;
      }
      if (next > maxMonth) {
        return maxMonth;
      }
      return next;
    });
  };

  const persistBudgets = (nextBudgets) => {
    setBudgets(nextBudgets);
    saveBudgetsForMonth(activeMonth, nextBudgets);
  };

  const openCreateBudget = () => {
    setDraft(createEmptyDraft());
    setEditorError("");
    setEditorOpen(true);
  };

  const openEditBudget = (budget) => {
    setDraft({
      id: budget.id,
      name: budget.name,
      emoji: budget.emoji,
      limit: String(budget.limit),
      spent: String(budget.spent),
      color: budget.color,
    });
    setEditorError("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditorError("");
    setDraft(createEmptyDraft());
  };

  const saveBudget = () => {
    const normalizedName = draft.name.trim();
    const limit = Number(draft.limit);
    const spent = Number(draft.spent);

    if (!normalizedName) {
      setEditorError("Please give this budget a name.");
      return;
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      setEditorError("Please enter a budget limit greater than zero.");
      return;
    }

    if (!Number.isFinite(spent) || spent < 0) {
      setEditorError("Spent so far must be zero or more.");
      return;
    }

    const nextBudget = {
      id: draft.id || createBudgetId(),
      name: normalizedName,
      emoji: draft.emoji,
      limit: Math.round(limit),
      spent: Math.round(spent),
      color: draft.color,
    };

    const nextBudgets = draft.id
      ? budgets.map((budget) => (budget.id === draft.id ? nextBudget : budget))
      : [...budgets, nextBudget];

    persistBudgets(nextBudgets);
    closeEditor();
  };

  const deleteBudget = (budgetId) => {
    const targetBudget = budgets.find((item) => item.id === budgetId);
    if (!targetBudget) {
      return;
    }

    if (!window.confirm(`Delete the "${targetBudget.name}" budget for ${monthLabel}?`)) {
      return;
    }

    persistBudgets(budgets.filter((item) => item.id !== budgetId));
    if (draft.id === budgetId) {
      closeEditor();
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ opacity: 0, animation: "riseIn 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="budgets-header">
          <h1 className="budgets-title">Monthly <em>budgets.</em></h1>
          <p className="budgets-sub">Plan, edit, and review each month without losing the calm ledger feel.</p>
        </div>
      </div>

      <div className="budget-toolbar" style={{ opacity: 0, animation: "riseIn 0.6s 0.12s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="budget-toolbar-copy">
          <div className="budget-toolbar-title">{monthLabel} budget workspace</div>
          <div className="budget-toolbar-note">
            You can review the last {MONTHS_BACK} months and plan up to {MONTHS_FORWARD} month ahead.
          </div>
        </div>
        <div className="budget-toolbar-actions">
          <button className="budget-btn secondary" type="button" onClick={() => persistBudgets(seededBudgetsForMonth(activeMonth))}>
            Reset month
          </button>
          <button className="budget-btn" type="button" onClick={openCreateBudget}>
            + New budget
          </button>
        </div>
      </div>

      {editorOpen && (
        <div className="budget-editor-shell" style={{ opacity: 0, animation: "riseIn 0.45s cubic-bezier(0.22,1,0.36,1) forwards" }}>
          <div className="budget-editor-head">
            <div>
              <div className="budget-editor-title">
                {draft.id ? <>Refine this <em>budget.</em></> : <>Create a new <em>budget.</em></>}
              </div>
              <div className="budget-editor-sub">Make each category intentional for {monthLabel}.</div>
            </div>
            <button className="budget-btn secondary" type="button" onClick={closeEditor}>Close</button>
          </div>

          <div className="budget-editor-grid">
            <div className="budget-editor-field">
              <label className="budget-editor-label">Budget Name</label>
              <input
                className="budget-editor-input"
                value={draft.name}
                placeholder="Groceries, travel, rent..."
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="budget-editor-field">
              <label className="budget-editor-label">Emoji</label>
              <select
                className="budget-editor-select"
                value={draft.emoji}
                onChange={(event) => setDraft((current) => ({ ...current, emoji: event.target.value }))}
              >
                {EMOJI_OPTIONS.map((emoji) => (
                  <option key={emoji} value={emoji}>{emoji}</option>
                ))}
              </select>
            </div>
            <div className="budget-editor-field">
              <label className="budget-editor-label">Monthly Limit</label>
              <input
                className="budget-editor-input"
                type="number"
                min="0"
                step="1"
                value={draft.limit}
                placeholder="15000"
                onChange={(event) => setDraft((current) => ({ ...current, limit: event.target.value }))}
              />
            </div>
            <div className="budget-editor-field">
              <label className="budget-editor-label">Spent So Far</label>
              <input
                className="budget-editor-input"
                type="number"
                min="0"
                step="1"
                value={draft.spent}
                placeholder="0"
                onChange={(event) => setDraft((current) => ({ ...current, spent: event.target.value }))}
              />
            </div>
            <div className="budget-editor-field full">
              <label className="budget-editor-label">Accent Color</label>
              <div className="swatch-row">
                {PALETTE_OPTIONS.map((color) => (
                  <button
                    key={color}
                    className={`swatch${draft.color === color ? " sel" : ""}`}
                    type="button"
                    aria-label={`Select ${color} accent`}
                    style={{ background: color }}
                    onClick={() => setDraft((current) => ({ ...current, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          {editorError && <div className="budget-editor-error">{editorError}</div>}

          <div className="budget-editor-actions">
            <button className="budget-btn secondary" type="button" onClick={closeEditor}>Cancel</button>
            <button className="budget-btn" type="button" onClick={saveBudget}>
              {draft.id ? "Save changes" : "Create budget"}
            </button>
          </div>
        </div>
      )}

      <div className="month-nav">
        <div className="month-nav-main">
          <button className="month-nav-btn" type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} disabled={!canGoPrev}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="month-label">{monthLabel}</span>
          <button className="month-nav-btn" type="button" aria-label="Next month" onClick={() => shiftMonth(1)} disabled={!canGoNext}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <div className="month-range-note">
          Window: {minMonth.toLocaleDateString("en-IN", { month: "short", year: "numeric" })} to {maxMonth.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
        </div>
      </div>

      <div className="budget-overview-grid" style={{ opacity: 0, animation: "riseIn 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="budget-overview-card">
          <div className="budget-overview-label">Planned Limit</div>
          <div className="budget-overview-value">Rs. {totalBudget.toLocaleString("en-IN")}</div>
          <div className="budget-overview-note">Across {budgets.length || 0} tracked categories</div>
        </div>
        <div className="budget-overview-card">
          <div className="budget-overview-label">Spent So Far</div>
          <div className="budget-overview-value">Rs. {totalSpent.toLocaleString("en-IN")}</div>
          <div className="budget-overview-note">{totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}% of monthly cap used</div>
        </div>
        <div className="budget-overview-card">
          <div className="budget-overview-label">Remaining</div>
          <div className="budget-overview-value">Rs. {Math.abs(totalLeft).toLocaleString("en-IN")}</div>
          <div className="budget-overview-note">{totalLeft >= 0 ? "Still available this month" : "You are currently over plan"}</div>
        </div>
        <div className="budget-overview-card">
          <div className="budget-overview-label">Savings Momentum</div>
          <div className="budget-overview-value">{savingsProgress}%</div>
          <div className="budget-overview-note">{overspentCount === 0 ? "No categories overspent" : `${overspentCount} category${overspentCount > 1 ? "ies are" : " is"} over budget`}</div>
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="empty-shell">
          <div className="empty-shell-title">No budgets for this month yet.</div>
          <div className="empty-shell-copy">
            Start with a custom category and shape this month around what actually matters to you.
          </div>
          <div className="empty-shell-actions">
            <button className="budget-btn" type="button" onClick={openCreateBudget}>Create your first budget</button>
          </div>
        </div>
      ) : (
        <div className="budget-grid" style={{ opacity: 0, animation: "riseIn 0.6s 0.25s cubic-bezier(0.22,1,0.36,1) forwards" }}>
          {budgets.map((budget, index) => {
            const pct = Math.min((Number(budget.spent) / Number(budget.limit)) * 100, 100);
            const over = Number(budget.spent) > Number(budget.limit);
            const near = !over && pct >= 80;
            const remaining = Number(budget.limit) - Number(budget.spent);
            const statusLabel = over ? "Over budget" : near ? "Watch closely" : "Healthy";

            return (
              <div
                className={`budget-card${over ? " over" : near ? " near" : ""}`}
                key={budget.id}
                style={{ opacity: 0, animation: `riseIn 0.5s ${0.3 + index * 0.06}s cubic-bezier(0.22,1,0.36,1) forwards` }}
              >
                <div className="budget-card-top">
                  <div>
                    <div className="budget-card-title-row">
                      <div className="budget-card-emoji">{budget.emoji}</div>
                      <div className="budget-card-title">{budget.name}</div>
                    </div>
                    <div className="budget-chip-row">
                      <span className="budget-chip">{statusLabel}</span>
                      <span className="budget-chip">{Math.round(pct)}% used</span>
                    </div>
                  </div>
                  <div className="budget-card-actions">
                    <button className="budget-card-btn" type="button" onClick={() => openEditBudget(budget)}>Edit</button>
                    <button className="budget-card-btn danger" type="button" onClick={() => deleteBudget(budget.id)}>Delete</button>
                  </div>
                </div>

                <div className="budget-card-ring">
                  <ProgressRing progress={pct} size={54} strokeWidth={5} color={over ? "var(--rose)" : budget.color} />
                  <div className="budget-card-stats">
                    <div className="budget-card-spent">{formatCurrency(Number(budget.spent))}</div>
                    <div className="budget-card-limit">of {formatCurrency(Number(budget.limit))}</div>
                  </div>
                </div>

                <div className="budget-card-bar">
                  <div
                    className="budget-card-fill"
                    style={{
                      width: barsReady ? `${pct}%` : "0%",
                      background: over ? "var(--rose)" : budget.color,
                    }}
                  />
                </div>

                <div className="budget-card-footer">
                  <span>{formatCurrency(Math.round(Number(budget.limit) / 30))} avg / day</span>
                  {over
                    ? <span className="over-text">Over by {formatCurrency(Math.abs(remaining))}</span>
                    : <span className="remaining">{formatCurrency(remaining)} left</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="section-block" style={{ opacity: 0, animation: "riseIn 0.6s 0.6s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="section-block-shell">
          <div className="section-block-title">Recurring Bills & Subscriptions</div>
          <div className="recurring-grid">
            {RECURRING.map((item) => (
              <div className="recurring-card" key={item.name}>
                <div className="recurring-icon">{item.icon}</div>
                <div className="recurring-info">
                  <div className="recurring-name">{item.name}</div>
                  <div className="recurring-meta">{item.cycle}</div>
                </div>
                <div className="recurring-amount">{formatCurrency(item.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-block" style={{ opacity: 0, animation: "riseIn 0.6s 0.75s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="section-block-shell">
          <div className="section-block-title">Savings Goals</div>
          <div className="savings-grid">
            {SAVINGS_GOALS.map((goal) => {
              const pct = (goal.saved / goal.target) * 100;
              return (
                <div className="savings-card" key={goal.name}>
                  <div className="savings-header">
                    <div className="savings-name">{goal.name}</div>
                    <div className="savings-target">{formatCurrency(goal.target)}</div>
                  </div>
                  <div className="savings-bar-wrap">
                    <div className="savings-bar-fill" style={{ width: barsReady ? `${pct}%` : "0%" }} />
                  </div>
                  <div className="savings-footer">
                    <span className="saved">{formatCurrency(goal.saved)} saved</span>
                    <span>{Math.round(pct)}% complete</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
