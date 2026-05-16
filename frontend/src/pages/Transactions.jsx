import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CategoryPill } from "../components/SharedComponents";
import { FRONTEND_ONLY_MODE } from "../services/frontendMode";
import {
  createCategory,
  createTransaction,
  deleteTransaction,
  listCategories,
  listTransactions,
  scanBillPhoto,
  updateTransaction,
} from "../services/transactions";

const STYLES = `
.txn-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.txn-page-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--sand-50);
  letter-spacing: -0.02em;
}

.txn-page-title em { font-style: italic; color: var(--sage-l); }

.txn-summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(112px, 1fr));
  gap: 14px;
  align-items: stretch;
  min-width: min(100%, 420px);
}

.txn-summary-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid var(--glass-border);
  text-align: left;
  box-shadow: var(--card-shadow);
}

.txn-summary-val {
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  font-weight: 500;
  color: var(--sand-100);
}

.txn-summary-val.pos { color: var(--sage-l); }
.txn-summary-val.neg { color: var(--rose); }

.txn-summary-lbl {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sand-500);
  margin-top: 4px;
}

.compose-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 18px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--card-shadow);
}

.compose-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.compose-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--sand-100);
}

.compose-subtitle {
  font-size: 12px;
  color: var(--sand-500);
  margin-top: 4px;
}

.compose-close {
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  color: var(--sand-400);
  border-radius: 10px;
  padding: 8px 12px;
  font-family: 'Figtree', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.compose-close:hover {
  background: var(--surface-soft-2);
  color: var(--sand-200);
}

.compose-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.compose-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.compose-field.full {
  grid-column: 1 / -1;
}

.compose-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sand-500);
}

.compose-input,
.compose-select,
.compose-textarea {
  width: 100%;
  background: var(--surface-soft-2);
  border: 1px solid var(--surface-strong);
  border-radius: 10px;
  padding: 10px 12px;
  font-family: 'Figtree', sans-serif;
  font-size: 13px;
  color: var(--sand-100);
  outline: none;
}

.compose-select,
.sort-select {
  color-scheme: dark;
}

.compose-select option,
.sort-select option {
  background: #f6efe4;
  color: #231a12;
}

.compose-textarea {
  min-height: 90px;
  resize: vertical;
}

.compose-input:focus,
.compose-select:focus,
.compose-textarea:focus {
  border-color: var(--sage);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.compose-error {
  margin-top: 10px;
  font-size: 12px;
  color: var(--rose);
}

.compose-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.compose-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-family: 'Figtree', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.compose-btn.primary {
  background: linear-gradient(135deg, var(--sage-l), var(--amber-l));
  color: var(--ink);
  box-shadow: var(--btn-shadow);
}

.compose-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--btn-shadow-hover);
}

.compose-btn.ghost {
  background: var(--surface-soft);
  color: var(--sand-300);
  border: 1px solid var(--surface-strong);
}

.compose-btn.ghost:hover {
  background: var(--surface-soft-2);
  color: var(--sand-100);
}

.compose-btn:disabled,
.compose-btn.disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.bill-scan {
  grid-column: 1 / -1;
  border: 1px dashed var(--surface-strong);
  border-radius: 12px;
  padding: 12px;
  background: var(--surface-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.bill-scan-copy {
  min-width: 180px;
}

.bill-scan-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sand-100);
}

.bill-scan-status {
  font-size: 12px;
  color: var(--sand-500);
  margin-top: 3px;
}

.bill-scan-status.ready {
  color: var(--sage-l);
}

.bill-scan-input {
  display: none;
}

.filter-bar {
  position: sticky;
  top: 18px;
  z-index: 50;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  box-shadow: var(--card-shadow);
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 180px;
}

.search-input {
  width: 100%;
  background: var(--surface-soft-2);
  border: 1px solid var(--surface-strong);
  border-radius: 9px;
  padding: 9px 14px 9px 34px;
  font-family: 'Figtree', sans-serif;
  font-size: 13px;
  color: var(--sand-50);
  outline: none;
}

.search-input:focus {
  border-color: var(--sage);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--sand-500);
  pointer-events: none;
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sort-select {
  background: var(--surface-soft-2);
  border: 1px solid var(--surface-strong);
  border-radius: 9px;
  padding: 8px 12px;
  font-family: 'Figtree', sans-serif;
  font-size: 12px;
  color: var(--sand-300);
  cursor: pointer;
  outline: none;
}

.date-group {
  margin-bottom: 20px;
}

.date-group-header {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sand-500);
  margin-bottom: 8px;
  padding-left: 4px;
}

.txn-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 14px 18px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
  transition: all 0.25s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.txn-card:hover {
  transform: translateY(-2px) translateX(2px);
  box-shadow: var(--card-shadow);
  border-color: var(--sage);
}

.txn-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: var(--surface-soft-3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--sand-200);
  flex-shrink: 0;
}

.txn-card-info { flex: 1; min-width: 0; }

.txn-card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.txn-card-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--sand-100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.txn-card-meta {
  font-size: 11.5px;
  color: var(--sand-500);
  font-weight: 300;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.txn-card-pill {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  background: var(--surface-soft-2);
  border: 1px solid var(--surface-border);
  color: var(--sand-400);
}

.txn-card-amount {
  font-family: 'DM Mono', monospace;
  font-size: 14.5px;
  font-weight: 500;
  white-space: nowrap;
  text-align: right;
}

.txn-card-amount.neg { color: var(--rose); }
.txn-card-amount.pos { color: var(--sage-l); }

.txn-card-time {
  font-size: 10.5px;
  color: var(--sand-500);
  text-align: right;
  margin-top: 2px;
}

.txn-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.txn-action {
  padding: 5px 9px;
  border-radius: 8px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  color: var(--sand-300);
  font-size: 11px;
  cursor: pointer;
}

.txn-action:hover {
  background: var(--surface-soft-2);
  color: var(--sand-100);
}

.txn-action.delete {
  border-color: rgba(184,112,112,0.35);
  color: var(--rose);
}

.txn-card-side {
  min-width: 132px;
  text-align: right;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.txn-status {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  font-size: 13px;
  color: var(--sand-200);
}

.txn-status.error {
  border-color: rgba(184,112,112,0.35);
  color: var(--rose);
}

.fab-group {
  position: sticky;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 40;
  align-items: flex-end;
  margin-top: 28px;
  padding-top: 8px;
}

.fab {
  min-width: 152px;
  height: 52px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--sage-l), var(--amber-l));
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px 0 16px;
  box-shadow: 0 6px 24px rgba(122, 158, 135, 0.4);
  transition: all 0.2s;
  color: var(--ink);
}

.fab:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 32px rgba(122, 158, 135, 0.5);
}

.fab.expense {
  background: linear-gradient(135deg, #d8b36b, #c88462);
}

.fab-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.fab-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.fab-sub {
  font-size: 11px;
  opacity: 0.76;
}

.fab-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 14, 12, 0.12);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--sand-500);
  font-size: 14px;
}

@media (max-width: 720px) {
  .txn-summary-strip {
    grid-template-columns: 1fr;
    width: 100%;
  }

  .compose-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    top: 76px;
    padding: 12px 14px;
  }

  .txn-card {
    align-items: flex-start;
  }

  .txn-card-main {
    flex-direction: column;
    gap: 12px;
  }

  .txn-card-side {
    min-width: 0;
    width: 100%;
    text-align: left;
    padding-top: 4px;
    border-top: 1px solid var(--surface-border);
  }

  .txn-card-time {
    text-align: left;
  }

  .fab-group {
    bottom: 18px;
    align-items: stretch;
  }

  .fab {
    width: 100%;
    min-width: 0;
  }
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const COMPOSE_TYPES = ["expense", "income"];
const CUSTOM_CATEGORY_VALUE = "__other__";

function formatCurrency(value) {
  return `Rs. ${Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatSignedCurrency(value) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(value)}`;
}

function formatDateLabel(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function formatTimeLabel(value, fallbackDate) {
  const source = value || fallbackDate;
  if (!source) {
    return "";
  }

  return new Date(source).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapTransaction(transaction) {
  const isExpense = transaction.type === "expense";

  return {
    id: transaction.id,
    kind: transaction.type,
    title: transaction.title,
    note: transaction.note || "",
    category: transaction.category_name || "Uncategorized",
    categoryId: transaction.category ?? "",
    amountSigned: isExpense ? -Number(transaction.amount) : Number(transaction.amount),
    amountValue: Number(transaction.amount),
    date: transaction.date,
    time: formatTimeLabel(transaction.created_at, transaction.date),
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  };
}

function iconLabelFor(type, category) {
  if (type === "income") {
    return "IN";
  }

  const clean = (category || "TX").replace(/[^A-Za-z]/g, "").toUpperCase();
  return (clean.slice(0, 2) || "TX").padEnd(2, "X");
}

function createDraft(type, categories) {
  const fallbackCategory = categories.find((category) => category.type === type)?.id || "";

  return {
    title: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
    categoryId: fallbackCategory,
    customCategory: "",
  };
}

function composerSubtitle(composeType, editingId) {
  if (editingId) {
    return FRONTEND_ONLY_MODE
      ? "Update the transaction in your local demo workspace."
      : "Update the details and save them back to the backend.";
  }

  if (composeType === "income") {
    return FRONTEND_ONLY_MODE
      ? "Add a new income entry to the local demo ledger."
      : "Create an income entry using the live API.";
  }

  return FRONTEND_ONLY_MODE
    ? "Capture a new expense in the local demo ledger."
    : "Capture a new expense using the live API.";
}

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const composeType = COMPOSE_TYPES.includes(searchParams.get("compose")) ? searchParams.get("compose") : "";
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeType, setActiveType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [draft, setDraft] = useState({
    title: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
    categoryId: "",
    customCategory: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [composeError, setComposeError] = useState("");
  const [billScanStatus, setBillScanStatus] = useState("");
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanningBill, setScanningBill] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setPageError("");

      try {
        const [transactionsData, categoriesData] = await Promise.all([
          listTransactions(),
          listCategories(),
        ]);

        if (!mounted) {
          return;
        }

        setTransactions(transactionsData.map(mapTransaction));
        setCategories(categoriesData);
      } catch (error) {
        if (mounted) {
          setPageError(error.message || "Unable to load transactions.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!composeType) {
      return;
    }

    if (!editingId) {
      setDraft(createDraft(composeType, categories));
    }

    setComposeError("");
    setBillScanStatus("");
  }, [categories, composeType, editingId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = transactions.filter((transaction) => {
      const matchesCategory = activeCategory === "All" || transaction.category === activeCategory;
      const matchesType = activeType === "all" || transaction.kind === activeType;
      const matchesStart = !startDate || transaction.date >= startDate;
      const matchesEnd = !endDate || transaction.date <= endDate;
      const matchesSearch =
        !query ||
        transaction.title.toLowerCase().includes(query) ||
        transaction.note.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query);

      return matchesCategory && matchesType && matchesStart && matchesEnd && matchesSearch;
    });

    result.sort((left, right) => {
      if (sortBy === "oldest") {
        return new Date(left.date) - new Date(right.date);
      }

      if (sortBy === "highest") {
        return Math.abs(right.amountSigned) - Math.abs(left.amountSigned);
      }

      if (sortBy === "lowest") {
        return Math.abs(left.amountSigned) - Math.abs(right.amountSigned);
      }

      return new Date(right.date) - new Date(left.date);
    });

    return result;
  }, [activeCategory, activeType, endDate, search, sortBy, startDate, transactions]);

  const grouped = useMemo(() => {
    const groups = {};

    filtered.forEach((transaction) => {
      if (!groups[transaction.date]) {
        groups[transaction.date] = [];
      }
      groups[transaction.date].push(transaction);
    });

    return Object.entries(groups).sort(([left], [right]) => new Date(right) - new Date(left));
  }, [filtered]);

  const totalIncome = transactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((sum, transaction) => sum + transaction.amountValue, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.kind === "expense")
    .reduce((sum, transaction) => sum + transaction.amountValue, 0);

  const netFlow = totalIncome - totalExpenses;
  const filterCategories = useMemo(() => {
    const dynamicCategories = Array.from(new Set(transactions.map((transaction) => transaction.category)));
    return ["All", ...dynamicCategories];
  }, [transactions]);

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.type === composeType),
    [categories, composeType],
  );

  const closeComposer = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("compose");
    setSearchParams(nextParams);
    setComposeError("");
    setEditingId(null);
  };

  const openComposer = (type) => {
    setEditingId(null);
    setDraft(createDraft(type, categories));
    setBillScanStatus("");
    setSearchParams({ compose: type });
  };

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setDraft({
      title: transaction.title,
      amount: String(transaction.amountValue),
      date: transaction.date,
      note: transaction.note,
      categoryId: transaction.categoryId || "",
      customCategory: "",
    });
    setSearchParams({ compose: transaction.kind });
  };

  const resolveCategoryId = async () => {
    if (!draft.categoryId) {
      return null;
    }

    if (draft.categoryId !== CUSTOM_CATEGORY_VALUE) {
      return Number(draft.categoryId);
    }

    const nextCategoryName = draft.customCategory.trim();
    if (!nextCategoryName) {
      throw new Error("Please enter a custom category name.");
    }

    const createdCategory = await createCategory({
      name: nextCategoryName,
      type: composeType,
    });

    setCategories((current) => [...current, createdCategory]);
    return createdCategory.id;
  };

  const handleBillScan = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setScanningBill(true);
    setComposeError("");
    setBillScanStatus("Reading bill photo...");

    try {
      const result = await scanBillPhoto(file);
      setDraft((current) => ({
        ...current,
        title: result.title || current.title,
        amount: result.amount || current.amount,
        date: result.date || current.date,
        categoryId: result.category ? String(result.category) : current.categoryId,
        note: result.note || current.note,
      }));
      setBillScanStatus("Bill scanned. Review the filled details before saving.");
    } catch (error) {
      setBillScanStatus("");
      setComposeError(error.message || "Unable to scan this bill photo.");
    } finally {
      setScanningBill(false);
    }
  };

  const saveCompose = async () => {
    const amount = Number(draft.amount);

    if (!draft.title.trim()) {
      setComposeError("Please add a title for this transaction.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setComposeError("Please enter a valid amount greater than zero.");
      return;
    }

    if (!draft.date) {
      setComposeError("Please choose a transaction date.");
      return;
    }

    setSubmitting(true);
    setComposeError("");

    try {
      const categoryId = await resolveCategoryId();
      const payload = {
        type: composeType,
        amount,
        category: categoryId,
        title: draft.title.trim(),
        note: draft.note.trim(),
        date: draft.date,
      };

      const savedTransaction = editingId
        ? await updateTransaction(editingId, payload)
        : await createTransaction(payload);
      const mappedTransaction = mapTransaction(savedTransaction);

      setTransactions((current) => {
        if (editingId) {
          return current.map((transaction) => (transaction.id === editingId ? mappedTransaction : transaction));
        }

        return [mappedTransaction, ...current];
      });

      setActiveCategory("All");
      setSearch("");
      closeComposer();
    } catch (error) {
      setComposeError(error.message || "Unable to save the transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (transaction) => {
    if (!window.confirm(`Delete "${transaction.title}"?`)) {
      return;
    }

    try {
      await deleteTransaction(transaction.id);
      setTransactions((current) => current.filter((item) => item.id !== transaction.id));
    } catch (error) {
      setPageError(error.message || "Unable to delete the transaction.");
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ opacity: 0, animation: "riseIn 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="txn-page-header">
          <h1 className="txn-page-title">Your <em>transactions.</em></h1>
          <div className="txn-summary-strip">
            <div className="txn-summary-item">
              <div className="txn-summary-val pos">{formatSignedCurrency(totalIncome)}</div>
              <div className="txn-summary-lbl">Income</div>
            </div>
            <div className="txn-summary-item">
              <div className="txn-summary-val neg">-{formatCurrency(totalExpenses)}</div>
              <div className="txn-summary-lbl">Expenses</div>
            </div>
            <div className="txn-summary-item">
              <div className={`txn-summary-val ${netFlow >= 0 ? "pos" : "neg"}`}>{formatSignedCurrency(netFlow)}</div>
              <div className="txn-summary-lbl">Net Flow</div>
            </div>
          </div>
        </div>
      </div>

      {pageError && <div className="txn-status error">{pageError}</div>}
      {loading && <div className="txn-status">Loading your transactions...</div>}

      {composeType && (
        <div className="compose-card" style={{ opacity: 0, animation: "riseIn 0.6s 0.16s cubic-bezier(0.22,1,0.36,1) forwards" }}>
          <div className="compose-header">
            <div>
              <div className="compose-title">{editingId ? "Edit Transaction" : composeType === "income" ? "Add Income" : "Add Expense"}</div>
              <div className="compose-subtitle">{composerSubtitle(composeType, editingId)}</div>
            </div>
            <button className="compose-close" type="button" onClick={closeComposer}>Close</button>
          </div>

          <div className="compose-grid">
            {composeType === "expense" && !editingId && (
              <div className="bill-scan">
                <div className="bill-scan-copy">
                  <div className="bill-scan-title">Bill Photo</div>
                  <div className={`bill-scan-status ${billScanStatus ? "ready" : ""}`}>
                    {billScanStatus || "Use OCR to fill amount, date, category, and title."}
                  </div>
                </div>
                <label className={`compose-btn ghost ${scanningBill ? "disabled" : ""}`}>
                  {scanningBill ? "Scanning..." : "Scan Bill"}
                  <input
                    className="bill-scan-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={scanningBill}
                    onChange={handleBillScan}
                  />
                </label>
              </div>
            )}

            <div className="compose-field full">
              <label className="compose-label">Title</label>
              <input
                className="compose-input"
                placeholder={composeType === "income" ? "Salary Credit" : "Coffee, fuel, groceries..."}
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </div>

            <div className="compose-field">
              <label className="compose-label">Amount</label>
              <input
                className="compose-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={draft.amount}
                onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
              />
            </div>

            <div className="compose-field">
              <label className="compose-label">Date</label>
              <input
                className="compose-input"
                type="date"
                value={draft.date}
                onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
              />
            </div>

            <div className="compose-field">
              <label className="compose-label">Category</label>
              <select
                className="compose-select"
                value={draft.categoryId}
                onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
              >
                <option value="">Uncategorized</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={String(category.id)}>{category.name}</option>
                ))}
                <option value={CUSTOM_CATEGORY_VALUE}>Create new category</option>
              </select>
            </div>

            {draft.categoryId === CUSTOM_CATEGORY_VALUE && (
              <div className="compose-field">
                <label className="compose-label">New Category Name</label>
                <input
                  className="compose-input"
                  placeholder="Write your custom category"
                  value={draft.customCategory}
                  onChange={(event) => setDraft((current) => ({ ...current, customCategory: event.target.value }))}
                />
              </div>
            )}

            <div className="compose-field full">
              <label className="compose-label">Note</label>
              <textarea
                className="compose-textarea"
                placeholder="Optional note"
                value={draft.note}
                onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
              />
            </div>
          </div>

          {composeError && <div className="compose-error">{composeError}</div>}

          <div className="compose-actions">
            <button className="compose-btn ghost" type="button" onClick={closeComposer}>Cancel</button>
            <button className="compose-btn primary" type="button" disabled={submitting} onClick={saveCompose}>
              {submitting ? "Saving..." : editingId ? "Update Transaction" : composeType === "income" ? "Save Income" : "Save Expense"}
            </button>
          </div>
        </div>
      )}

      <div className="filter-bar" style={{ opacity: 0, animation: "riseIn 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="search-wrap">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            placeholder="Search transactions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="filter-pills">
          {filterCategories.map((category) => (
            <CategoryPill
              key={category}
              label={category}
              selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            />
          ))}
        </div>
        <select className="sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="highest">Sort: Highest</option>
          <option value="lowest">Sort: Lowest</option>
        </select>
        <select className="sort-select" value={activeType} onChange={(event) => setActiveType(event.target.value)}>
          <option value="all">Type: All</option>
          <option value="income">Type: Income</option>
          <option value="expense">Type: Expense</option>
        </select>
        <input className="sort-select" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <input className="sort-select" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        <button
          className="sort-select"
          type="button"
          onClick={() => {
            setActiveType("all");
            setStartDate("");
            setEndDate("");
            setSearch("");
            setActiveCategory("All");
            setSortBy("newest");
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ opacity: 0, animation: "riseIn 0.6s 0.35s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        {!loading && grouped.length === 0 ? (
          <div className="empty-state">No transactions match your filters.</div>
        ) : (
          grouped.map(([date, transactionsForDay]) => (
            <div className="date-group" key={date}>
              <div className="date-group-header">{formatDateLabel(date)}</div>
              {transactionsForDay.map((transaction, index) => (
                <div
                  className="txn-card"
                  key={transaction.id}
                  style={{ opacity: 0, animation: `riseIn 0.5s ${0.05 * index}s cubic-bezier(0.22,1,0.36,1) forwards` }}
                >
                  <div className="txn-card-main">
                    <div className="txn-card-icon">{iconLabelFor(transaction.kind, transaction.category)}</div>
                    <div className="txn-card-info">
                      <div className="txn-card-name">{transaction.title}</div>
                      <div className="txn-card-meta">
                        <span className="txn-card-pill">{transaction.category}</span>
                        {transaction.note && <span>{transaction.note}</span>}
                      </div>
                      <div className="txn-card-actions">
                        <button className="txn-action" type="button" onClick={() => startEdit(transaction)}>Edit</button>
                        <button className="txn-action delete" type="button" onClick={() => handleDelete(transaction)}>Delete</button>
                      </div>
                    </div>
                  </div>
                  <div className="txn-card-side">
                    <div className={`txn-card-amount ${transaction.amountSigned < 0 ? "neg" : "pos"}`}>
                      {formatSignedCurrency(transaction.amountSigned)}
                    </div>
                    <div className="txn-card-time">{transaction.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="fab-group">
        <button className="fab" aria-label="Add income" type="button" onClick={() => openComposer("income")}>
          <span className="fab-copy">
            <span className="fab-label">New Income</span>
            <span className="fab-sub">Salary, freelance, refund</span>
          </span>
          <span className="fab-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
        </button>
        <button className="fab expense" aria-label="Add expense" type="button" onClick={() => openComposer("expense")}>
          <span className="fab-copy">
            <span className="fab-label">New Expense</span>
            <span className="fab-sub">Bills, groceries, travel</span>
          </span>
          <span className="fab-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
        </button>
      </div>
    </>
  );
}
