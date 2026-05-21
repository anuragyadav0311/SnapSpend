import { api, getApiErrorMessage } from "./api";
import { FRONTEND_ONLY_MODE } from "./frontendMode";
import { currentMonthValue } from "../utils/dateConstraints";
import { DEFAULT_TRANSACTIONS, MOCK_TRANSACTIONS_KEY } from "./transactions";

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

function readMockTransactions() {
  if (typeof window === "undefined") {
    return DEFAULT_TRANSACTIONS;
  }
  try {
    return JSON.parse(window.localStorage.getItem(MOCK_TRANSACTIONS_KEY) || JSON.stringify(DEFAULT_TRANSACTIONS));
  } catch {
    return DEFAULT_TRANSACTIONS;
  }
}

function summarizeMockBudget(month, limitAmount) {
  const limit = Number(limitAmount || 0);
  const transactions = readMockTransactions();
  const spent = transactions.reduce((total, transaction) => {
    if (transaction?.type !== "expense") {
      return total;
    }
    return transaction.date?.slice(0, 7) === month.slice(0, 7)
      ? total + Number(transaction.amount || 0)
      : total;
  }, 0);
  const remaining = limit - spent;
  const progress = limit > 0 ? Math.round((spent / limit) * 10000) / 100 : 0;

  return {
    spent_amount: spent.toFixed(2),
    remaining_amount: remaining.toFixed(2),
    progress_percent: progress,
    status: spent > limit ? "exceeded" : progress >= 80 ? "near_limit" : "healthy",
  };
}

function normalizeMockBudget(item) {
  const month = monthToApiDate(item?.month || currentMonthValue());
  const limitAmount = Number(item?.limit_amount || 0).toFixed(2);
  return {
    id: item?.id ?? Date.now(),
    month,
    limit_amount: limitAmount,
    ...summarizeMockBudget(month, limitAmount),
  };
}

function readMockBudgets() {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(MOCK_BUDGET_KEY);
  const fallback = [normalizeMockBudget({ id: 1, month: `${currentMonthValue()}-01`, limit_amount: "50000.00" })];
  if (!raw) {
    window.localStorage.setItem(MOCK_BUDGET_KEY, JSON.stringify(fallback));
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    const normalized = (Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback).map(normalizeMockBudget);
    window.localStorage.setItem(MOCK_BUDGET_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    window.localStorage.setItem(MOCK_BUDGET_KEY, JSON.stringify(fallback));
    return fallback;
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
    const created = normalizeMockBudget({
      id: Date.now(),
      month: monthToApiDate(month),
      limit_amount: Number(limit_amount).toFixed(2),
    });
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
        ? normalizeMockBudget({ ...item, month: monthToApiDate(month), limit_amount: Number(limit_amount).toFixed(2) })
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
