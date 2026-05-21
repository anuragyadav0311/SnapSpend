import { api, getApiErrorMessage } from "./api";
import { FRONTEND_ONLY_MODE } from "./frontendMode";
import { DEFAULT_TRANSACTIONS, MOCK_TRANSACTIONS_KEY } from "./transactions";

const MOCK_BUDGET_KEY = "ledger-mock-budgets";

function monthToParam(monthValue) {
  if (!monthValue) {
    return "";
  }
  return monthValue.length >= 7 ? monthValue.slice(0, 7) : monthValue;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function filenameFromDisposition(headerValue) {
  const match = headerValue?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || "";
}

function readMockList(key, fallback = []) {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
    return Array.isArray(parsed) && parsed.length === 0 ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function formatMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function monthLabel(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function ddmmyyyy(dateValue) {
  const [year, month, day] = dateValue.split("-");
  return `${day}-${month}-${year}`;
}

function buildBudgetSnapshot(monthValue, monthTransactions) {
  const budgets = readMockList(MOCK_BUDGET_KEY);
  const budget = budgets.find((item) => item.month?.slice(0, 7) === monthValue);
  if (!budget) {
    return null;
  }

  const spent = monthTransactions.reduce(
    (total, transaction) => total + (transaction.type === "expense" ? Number(transaction.amount || 0) : 0),
    0,
  );
  const limit = Number(budget.limit_amount || 0);
  const remaining = limit - spent;
  const progress = limit > 0 ? Math.round((spent / limit) * 10000) / 100 : 0;

  return {
    ...budget,
    spent_amount: spent.toFixed(2),
    remaining_amount: remaining.toFixed(2),
    progress_percent: progress,
    status: spent > limit ? "exceeded" : progress >= 80 ? "near_limit" : "healthy",
  };
}

function buildDemoReportData(monthValue = new Date().toISOString().slice(0, 7)) {
  const transactions = readMockList(MOCK_TRANSACTIONS_KEY, DEFAULT_TRANSACTIONS).slice();
  const monthTransactions = transactions
    .filter((transaction) => transaction.date?.slice(0, 7) === monthValue)
    .sort((left, right) => {
      if (left.date === right.date) {
        return (left.created_at || "").localeCompare(right.created_at || "");
      }
      return left.date.localeCompare(right.date);
    });

  const totals = transactions.reduce(
    (summary, transaction) => {
      const amount = Number(transaction.amount || 0);
      if (transaction.type === "income") {
        summary.income += amount;
      } else {
        summary.expense += amount;
      }
      return summary;
    },
    { income: 0, expense: 0 },
  );

  const currentMonthTotals = monthTransactions.reduce(
    (summary, transaction) => {
      const amount = Number(transaction.amount || 0);
      if (transaction.type === "income") {
        summary.income += amount;
      } else {
        summary.expense += amount;
      }
      return summary;
    },
    { income: 0, expense: 0 },
  );

  const recentTransactions = transactions
    .slice()
    .sort((left, right) => `${right.date}${right.created_at}`.localeCompare(`${left.date}${left.created_at}`))
    .slice(0, 5)
    .map((transaction) => ({
      ...transaction,
      display_date: ddmmyyyy(transaction.date),
    }));

  const categoryTotals = new Map();
  monthTransactions.forEach((transaction) => {
    if (transaction.type !== "expense") {
      return;
    }
    const categoryName = transaction.category_name || "Uncategorized";
    categoryTotals.set(categoryName, (categoryTotals.get(categoryName) || 0) + Number(transaction.amount || 0));
  });
  const categoryGrandTotal = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0);
  const categoryBreakdown = [...categoryTotals.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([name, amount]) => ({
      name,
      amount: formatMoney(amount),
      percentage: categoryGrandTotal ? Math.round((amount / categoryGrandTotal) * 10000) / 100 : 0,
    }));

  const monthlyBuckets = new Map();
  transactions.forEach((transaction) => {
    const key = transaction.date?.slice(0, 7);
    if (!key) {
      return;
    }
    if (!monthlyBuckets.has(key)) {
      monthlyBuckets.set(key, { income: 0, expense: 0 });
    }
    const bucket = monthlyBuckets.get(key);
    const amount = Number(transaction.amount || 0);
    if (transaction.type === "income") {
      bucket.income += amount;
    } else {
      bucket.expense += amount;
    }
  });

  const monthlyTrend = [...monthlyBuckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([month, summary]) => ({
      month: monthLabel(month),
      income: formatMoney(summary.income),
      expense: formatMoney(summary.expense),
    }));

  let runningBalance = 0;
  const reportTransactions = monthTransactions.map((transaction) => {
    const amount = Number(transaction.amount || 0);
    runningBalance += transaction.type === "income" ? amount : -amount;
    return {
      ...transaction,
      display_date: ddmmyyyy(transaction.date),
      available_balance: runningBalance.toFixed(2),
    };
  });

  return {
    month: monthLabel(monthValue),
    totals: {
      income: formatMoney(currentMonthTotals.income),
      expense: formatMoney(currentMonthTotals.expense),
      balance: formatMoney(currentMonthTotals.income - currentMonthTotals.expense),
    },
    dashboard: {
      totals: {
        income: formatMoney(totals.income),
        expense: formatMoney(totals.expense),
        balance: formatMoney(totals.income - totals.expense),
      },
      current_month: {
        month: monthLabel(monthValue),
        income: formatMoney(currentMonthTotals.income),
        expense: formatMoney(currentMonthTotals.expense),
        balance: formatMoney(currentMonthTotals.income - currentMonthTotals.expense),
        savings_rate: currentMonthTotals.income
          ? Math.round(((currentMonthTotals.income - currentMonthTotals.expense) / currentMonthTotals.income) * 100)
          : 0,
      },
      recent_transactions: recentTransactions,
      category_breakdown: categoryBreakdown,
      monthly_trend: monthlyTrend,
      budget: buildBudgetSnapshot(monthValue, monthTransactions),
    },
    categorySummary: {
      month: monthLabel(monthValue),
      total_expense: formatMoney(currentMonthTotals.expense),
      categories: categoryBreakdown,
    },
    transactions: reportTransactions,
    budget: buildBudgetSnapshot(monthValue, monthTransactions),
  };
}

export async function fetchDashboardReport() {
  if (FRONTEND_ONLY_MODE) {
    return buildDemoReportData().dashboard;
  }
  try {
    const response = await api.get("/reports/dashboard/");
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load the dashboard."));
  }
}

export async function fetchMonthlyReport(month) {
  if (FRONTEND_ONLY_MODE) {
    const normalizedMonth = monthToParam(month) || new Date().toISOString().slice(0, 7);
    const data = buildDemoReportData(normalizedMonth);
    return {
      month: data.month,
      totals: data.totals,
      budget: data.budget,
      transactions: data.transactions,
    };
  }
  try {
    const response = await api.get("/reports/monthly/", { params: { month: monthToParam(month) } });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load the monthly report."));
  }
}

export async function fetchCategorySummary(month) {
  if (FRONTEND_ONLY_MODE) {
    const normalizedMonth = monthToParam(month) || new Date().toISOString().slice(0, 7);
    return buildDemoReportData(normalizedMonth).categorySummary;
  }
  try {
    const response = await api.get("/reports/category-summary/", { params: { month: monthToParam(month) } });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load the category summary."));
  }
}

export async function downloadReport(format, params = {}) {
  if (FRONTEND_ONLY_MODE) {
    const blob = new Blob(["Demo export"], { type: "text/plain;charset=utf-8" });
    triggerBlobDownload(blob, `demo-report.${format === "xlsx" ? "txt" : format}`);
    return;
  }

  const endpointMap = {
    csv: "/reports/export/csv/",
    xlsx: "/reports/export/xlsx/",
    pdf: "/reports/export/pdf/",
  };
  const filenameMap = {
    csv: "transactions-report.csv",
    xlsx: "transactions-report.xlsx",
    pdf: "transactions-report.pdf",
  };

  try {
    const response = await api.get(endpointMap[format], {
      params: {
        ...params,
        month: params.month ? monthToParam(params.month) : undefined,
      },
      responseType: "blob",
    });
    triggerBlobDownload(
      response.data,
      filenameFromDisposition(response.headers["content-disposition"]) || filenameMap[format],
    );
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Unable to export the ${format.toUpperCase()} report.`));
  }
}
