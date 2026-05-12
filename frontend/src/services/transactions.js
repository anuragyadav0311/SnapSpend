import { api, getApiErrorMessage } from "./api";
import { FRONTEND_ONLY_MODE } from "./frontendMode";

const MOCK_TRANSACTIONS_KEY = "ledger-mock-transactions";
const MOCK_CATEGORIES_KEY = "ledger-mock-categories";

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Food & Dining", type: "expense" },
  { id: 2, name: "Transport", type: "expense" },
  { id: 3, name: "Entertainment", type: "expense" },
  { id: 4, name: "Shopping", type: "expense" },
  { id: 5, name: "Salary", type: "income" },
  { id: 6, name: "Freelance", type: "income" },
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 1,
    type: "expense",
    amount: "489.00",
    category: 1,
    category_name: "Food & Dining",
    title: "Swiggy Order",
    note: "Late dinner",
    date: "2026-05-12",
    created_at: "2026-05-12T20:15:00",
    updated_at: "2026-05-12T20:15:00",
  },
  {
    id: 2,
    type: "income",
    amount: "85000.00",
    category: 5,
    category_name: "Salary",
    title: "Salary Credit",
    note: "May payroll",
    date: "2026-05-12",
    created_at: "2026-05-12T09:30:00",
    updated_at: "2026-05-12T09:30:00",
  },
  {
    id: 3,
    type: "expense",
    amount: "649.00",
    category: 3,
    category_name: "Entertainment",
    title: "Netflix Subscription",
    note: "",
    date: "2026-05-11",
    created_at: "2026-05-11T18:45:00",
    updated_at: "2026-05-11T18:45:00",
  },
];

function readMockList(key, fallbackValue) {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(fallbackValue));
    return fallbackValue;
  }

  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallbackValue));
    return fallbackValue;
  }
}

function writeMockList(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getMockCategories() {
  return readMockList(MOCK_CATEGORIES_KEY, DEFAULT_CATEGORIES);
}

function setMockCategories(categories) {
  writeMockList(MOCK_CATEGORIES_KEY, categories);
}

function getMockTransactions() {
  return readMockList(MOCK_TRANSACTIONS_KEY, DEFAULT_TRANSACTIONS);
}

function setMockTransactions(transactions) {
  writeMockList(MOCK_TRANSACTIONS_KEY, transactions);
}

function getNextId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;
}

export async function listTransactions() {
  if (FRONTEND_ONLY_MODE) {
    return getMockTransactions();
  }

  try {
    const response = await api.get("/transactions/");
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load transactions."));
  }
}

export async function createTransaction(payload) {
  if (FRONTEND_ONLY_MODE) {
    const categories = getMockCategories();
    const transactions = getMockTransactions();
    const category = categories.find((item) => Number(item.id) === Number(payload.category));
    const timestamp = new Date().toISOString();
    const createdTransaction = {
      id: getNextId(transactions),
      type: payload.type,
      amount: Number(payload.amount).toFixed(2),
      category: payload.category ?? null,
      category_name: category?.name || "Uncategorized",
      title: payload.title,
      note: payload.note || "",
      date: payload.date,
      created_at: timestamp,
      updated_at: timestamp,
    };
    setMockTransactions([createdTransaction, ...transactions]);
    return createdTransaction;
  }

  try {
    const response = await api.post("/transactions/", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to create the transaction."));
  }
}

export async function updateTransaction(id, payload) {
  if (FRONTEND_ONLY_MODE) {
    const categories = getMockCategories();
    const transactions = getMockTransactions();
    const existingTransaction = transactions.find((item) => Number(item.id) === Number(id));

    if (!existingTransaction) {
      throw new Error("Transaction not found.");
    }

    const category = categories.find((item) => Number(item.id) === Number(payload.category));
    const updatedTransaction = {
      ...existingTransaction,
      type: payload.type,
      amount: Number(payload.amount).toFixed(2),
      category: payload.category ?? null,
      category_name: category?.name || "Uncategorized",
      title: payload.title,
      note: payload.note || "",
      date: payload.date,
      updated_at: new Date().toISOString(),
    };
    setMockTransactions(
      transactions.map((item) => (Number(item.id) === Number(id) ? updatedTransaction : item)),
    );
    return updatedTransaction;
  }

  try {
    const response = await api.put(`/transactions/${id}/`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update the transaction."));
  }
}

export async function deleteTransaction(id) {
  if (FRONTEND_ONLY_MODE) {
    const transactions = getMockTransactions();
    setMockTransactions(transactions.filter((item) => Number(item.id) !== Number(id)));
    return;
  }

  try {
    await api.delete(`/transactions/${id}/`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to delete the transaction."));
  }
}

export async function listCategories() {
  if (FRONTEND_ONLY_MODE) {
    return getMockCategories();
  }

  try {
    const response = await api.get("/categories/");
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load categories."));
  }
}

export async function createCategory(payload) {
  if (FRONTEND_ONLY_MODE) {
    const categories = getMockCategories();
    const createdCategory = {
      id: getNextId(categories),
      name: payload.name.trim(),
      type: payload.type,
    };
    setMockCategories([...categories, createdCategory]);
    return createdCategory;
  }

  try {
    const response = await api.post("/categories/", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to create the category."));
  }
}
