import { api, getApiErrorMessage } from "./api";
import { FRONTEND_ONLY_MODE } from "./frontendMode";

const MOCK_BUDGET_KEY = "ledger-mock-budgets";

function monthToApiDate(monthValue) {
  if (!monthValue) {
    return "";
  }
  if (monthValue.length === 7) {
    return `${monthValue}-01`;
  }
  return monthValue;
}

function readMockBudgets() {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(MOCK_BUDGET_KEY);
  if (!raw) {
    const fallback = [{ id: 1, month: "2026-05-01", limit_amount: "50000.00" }];
    window.localStorage.setItem(MOCK_BUDGET_KEY, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeMockBudgets(items) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MOCK_BUDGET_KEY, JSON.stringify(items));
  }
}

export async function listBudgets() {
  if (FRONTEND_ONLY_MODE) {
    return readMockBudgets();
  }
  try {
    const response = await api.get("/budgets/");
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load budgets."));
  }
}

export async function createBudget({ month, limit_amount }) {
  if (FRONTEND_ONLY_MODE) {
    const items = readMockBudgets();
    const created = {
      id: Date.now(),
      month: monthToApiDate(month),
      limit_amount: Number(limit_amount).toFixed(2),
      spent_amount: "0.00",
      remaining_amount: Number(limit_amount).toFixed(2),
      progress_percent: 0,
      status: "healthy",
    };
    writeMockBudgets([...items, created]);
    return created;
  }

  try {
    const response = await api.post("/budgets/", {
      month: monthToApiDate(month),
      limit_amount,
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to create the budget."));
  }
}

export async function updateBudget(id, { month, limit_amount }) {
  if (FRONTEND_ONLY_MODE) {
    const items = readMockBudgets();
    const updated = items.map((item) =>
      Number(item.id) === Number(id)
        ? { ...item, month: monthToApiDate(month), limit_amount: Number(limit_amount).toFixed(2) }
        : item,
    );
    writeMockBudgets(updated);
    return updated.find((item) => Number(item.id) === Number(id));
  }

  try {
    const response = await api.put(`/budgets/${id}/`, {
      month: monthToApiDate(month),
      limit_amount,
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update the budget."));
  }
}
