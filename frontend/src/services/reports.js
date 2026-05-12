import { api, getApiErrorMessage } from "./api";
import { FRONTEND_ONLY_MODE } from "./frontendMode";

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

export async function fetchDashboardReport() {
  if (FRONTEND_ONLY_MODE) {
    return {
      totals: { income: 97000, expense: 41200, balance: 55800 },
      current_month: { month: "May 2026", income: 97000, expense: 41200, balance: 55800, savings_rate: 57 },
      recent_transactions: [],
      category_breakdown: [],
      monthly_trend: [],
      budget: null,
    };
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
    return {
      month: "Demo Month",
      totals: { income: 97000, expense: 41200, balance: 55800 },
      budget: null,
      transactions: [],
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
    return { month: "Demo Month", total_expense: 41200, categories: [] };
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
    triggerBlobDownload(response.data, filenameMap[format]);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Unable to export the ${format.toUpperCase()} report.`));
  }
}
