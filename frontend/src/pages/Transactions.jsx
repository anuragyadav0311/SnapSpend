import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CategoryPill } from "../components/SharedComponents";
import { FRONTEND_ONLY_MODE } from "../services/frontendMode";
import { clampDateToToday, todayValue } from "../utils/dateConstraints";
import {
  createCategory,
  createTransaction,
  deleteTransaction,
  fetchAnomalies,
  listCategories,
  listTransactions,
  scanBillPhoto,
  updateTransaction,
  verifyExistingTransaction,
  verifyTransaction,
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

.compose-select.placeholder {
  color: var(--sand-500);
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

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(184, 112, 112, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(184, 112, 112, 0); }
}

.anomaly-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: riseIn 0.3s ease forwards;
}

.anomaly-modal {
  width: 100%;
  max-width: 460px;
  background: var(--glass-bg);
  border: 1px solid rgba(184, 112, 112, 0.35);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
  animation: riseIn 0.4s 0.1s ease forwards;
  opacity: 0;
}

.anomaly-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(184, 112, 112, 0.12);
  border: 1px solid rgba(184, 112, 112, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  animation: pulseGlow 2s ease-in-out infinite;
}

.anomaly-title {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--rose);
  margin-bottom: 8px;
}

.anomaly-desc {
  font-size: 13px;
  color: var(--sand-300);
  line-height: 1.55;
  margin-bottom: 16px;
}

.anomaly-reason {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(184, 112, 112, 0.08);
  border: 1px solid rgba(184, 112, 112, 0.2);
  font-size: 12px;
  color: var(--sand-200);
  margin-bottom: 16px;
  line-height: 1.5;
}

.anomaly-reason strong {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--rose);
  margin-bottom: 4px;
}

.anomaly-proposed {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--surface-border);
  margin-bottom: 16px;
}

.anomaly-proposed-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  font-size: 12px;
}

.anomaly-proposed-label {
  color: var(--sand-500);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
}

.anomaly-proposed-value {
  color: var(--sand-100);
  font-family: 'DM Mono', monospace;
  font-size: 12px;
}

.anomaly-upload {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 2px dashed rgba(184, 112, 112, 0.3);
  background: rgba(184, 112, 112, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--sand-200);
  transition: all 0.2s;
  margin-bottom: 12px;
}

.anomaly-upload:hover {
  border-color: var(--rose);
  background: rgba(184, 112, 112, 0.1);
}

.anomaly-upload.has-file {
  border-style: solid;
  border-color: var(--sage);
  background: rgba(122, 158, 135, 0.08);
  color: var(--sage-l);
}

.anomaly-upload input {
  display: none;
}

.anomaly-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
}

.anomaly-status {
  font-size: 12px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
}

.anomaly-status.error {
  color: var(--rose);
  background: rgba(184, 112, 112, 0.08);
  border: 1px solid rgba(184, 112, 112, 0.2);
}

.anomaly-status.success {
  color: var(--sage-l);
  background: rgba(122, 158, 135, 0.08);
  border: 1px solid rgba(122, 158, 135, 0.2);
}

.anomaly-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(184, 112, 112, 0.12);
  border: 1px solid rgba(184, 112, 112, 0.3);
  color: var(--rose);
  animation: pulseGlow 3s ease-in-out infinite;
}

.anomaly-verify-btn {
  border: 1px solid rgba(184, 112, 112, 0.3);
  background: rgba(184, 112, 112, 0.1);
  color: var(--rose);
  border-radius: 12px;
  padding: 2px 8px;
  font-family: 'Figtree', sans-serif;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.2s;
}

.anomaly-verify-btn:hover {
  background: rgba(184, 112, 112, 0.18);
  border-color: var(--rose);
}

.anomaly-banner {
  padding: 14px 18px;
  border-radius: 14px;
  background: rgba(184, 112, 112, 0.08);
  border: 1px solid rgba(184, 112, 112, 0.25);
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.anomaly-banner-copy {
  display: flex;
  align-items: center;
  gap: 10px;
}

.anomaly-banner-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(184, 112, 112, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.anomaly-banner-text {
  font-size: 13px;
  color: var(--sand-200);
}

.anomaly-banner-text strong {
  color: var(--rose);
}

.anomaly-banner-btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(184, 112, 112, 0.3);
  background: rgba(184, 112, 112, 0.1);
  color: var(--rose);
  font-family: 'Figtree', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.anomaly-banner-btn:hover {
  background: rgba(184, 112, 112, 0.18);
  border-color: var(--rose);
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

function FilterDateInput({ value, placeholder, min, max, onChange }) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      className="sort-select"
      type={focused || value ? "date" : "text"}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      aria-label={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={onChange}
    />
  );
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

function createDraft(type) {
  const today = todayValue();

  return {
    title: "",
    amount: "",
    date: today,
    note: "",
    categoryId: "",
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
  const today = todayValue();
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
    date: today,
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

  // ML anomaly detection state
  const [anomalyModal, setAnomalyModal] = useState(null); // { detail, verification }
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(""); // error or success message
  const [verifyStatusType, setVerifyStatusType] = useState(""); // 'error' or 'success'
  const [anomalies, setAnomalies] = useState([]);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const verifyInputRef = useRef(null);

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

        // Load anomaly data in background (non-blocking)
        if (!FRONTEND_ONLY_MODE) {
          try {
            const anomalyData = await fetchAnomalies({ limit: 10 });
            if (mounted) {
              setAnomalies(anomalyData.results || []);
              setAnomalyCount(anomalyData.count || 0);
            }
          } catch {
            // anomaly fetch is optional, don't block the page
          }
        }
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
      setDraft(createDraft(composeType));
    }

    setComposeError("");
    setBillScanStatus("");
  }, [categories, composeType, editingId]);

  const handleStartDateChange = (value) => {
    const nextStartDate = clampDateToToday(value);
    setStartDate(nextStartDate);
    if (endDate && nextStartDate && nextStartDate > endDate) {
      setEndDate(nextStartDate);
    }
  };

  const handleEndDateChange = (value) => {
    const nextEndDate = clampDateToToday(value);
    setEndDate(nextEndDate);
    if (startDate && nextEndDate && nextEndDate < startDate) {
      setStartDate(nextEndDate);
    }
  };

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
    setDraft(createDraft(type));
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
        date: clampDateToToday(result.date) || current.date,
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

    if (draft.date > today) {
      setComposeError("Transaction dates cannot be in the future.");
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

      if (editingId) {
        const savedTransaction = await updateTransaction(editingId, payload);
        const mappedTransaction = mapTransaction(savedTransaction);
        setTransactions((current) =>
          current.map((transaction) => (transaction.id === editingId ? mappedTransaction : transaction))
        );
        setActiveCategory("All");
        setSearch("");
        closeComposer();
      } else {
        const result = await createTransaction(payload);

        // ML anomaly detection: handle flagged transaction
        if (result._anomalyFlag) {
          setAnomalyModal({
            detail: result.detail,
            verification: result.verification,
          });
          closeComposer();
        } else {
          const mappedTransaction = mapTransaction(result);
          setTransactions((current) => [mappedTransaction, ...current]);
          setActiveCategory("All");
          setSearch("");
          closeComposer();
        }
      }
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

  // ML verification handlers
  const closeAnomalyModal = () => {
    setAnomalyModal(null);
    setVerifyFile(null);
    setVerifying(false);
    setVerifyStatus("");
    setVerifyStatusType("");
  };

  const handleVerifyUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setVerifyFile(file);
      setVerifyStatus("");
    }
  };

  const openExistingAnomalyModal = (transaction) => {
    const anomalyReason = anomalyReasonMap[transaction.id] || "Suspicious transaction";
    setAnomalyModal({
      mode: "existing",
      detail: "Upload a bill photo to verify this flagged expense with OCR.",
      transactionId: transaction.id,
      verification: {
        anomaly_reason: anomalyReason,
        proposed: {
          title: transaction.title,
          amount: transaction.amountValue,
          category: transaction.categoryId || null,
          category_name: transaction.category,
          date: transaction.date,
        },
      },
    });
    setVerifyFile(null);
    setVerifyStatus("");
    setVerifyStatusType("");
  };

  const handleVerifySubmit = async () => {
    if (!anomalyModal || !verifyFile) return;

    setVerifying(true);
    setVerifyStatus("");
    setVerifyStatusType("");

    try {
      if (anomalyModal.mode === "existing") {
        await verifyExistingTransaction(
          anomalyModal.transactionId,
          verifyFile,
          anomalyModal.verification.anomaly_reason,
        );
        setAnomalies((current) => current.filter((item) => item.id !== anomalyModal.transactionId));
        setAnomalyCount((current) => Math.max(current - 1, 0));
        setVerifyStatus("Verified! This transaction is now cleared.");
      } else {
        const result = await verifyTransaction(anomalyModal.verification.token, verifyFile);
        const mappedTransaction = mapTransaction(result);
        setTransactions((current) => [mappedTransaction, ...current]);
        setVerifyStatus("Verified! Transaction saved successfully.");
      }
      setVerifyStatusType("success");
      setTimeout(() => closeAnomalyModal(), 1500);
    } catch (error) {
      setVerifyStatus(error.message || "Verification failed. Bill doesn't match the transaction.");
      setVerifyStatusType("error");
    } finally {
      setVerifying(false);
    }
  };

  // Set of anomaly transaction IDs for badge display
  const anomalyIdSet = useMemo(
    () => new Set(anomalies.map((a) => a.id)),
    [anomalies]
  );

  const anomalyReasonMap = useMemo(
    () => Object.fromEntries(anomalies.map((a) => [a.id, a.anomaly_reason])),
    [anomalies]
  );

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

      {!loading && anomalyCount > 0 && (
        <div className="anomaly-banner" style={{ opacity: 0, animation: "riseIn 0.6s 0.14s cubic-bezier(0.22,1,0.36,1) forwards" }}>
          <div className="anomaly-banner-copy">
            <div className="anomaly-banner-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="anomaly-banner-text">
              ML detected <strong>{anomalyCount} suspicious transaction{anomalyCount !== 1 ? "s" : ""}</strong> in your history.
            </div>
          </div>
        </div>
      )}

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
                  max={today}
                  onChange={(event) => setDraft((current) => ({ ...current, date: clampDateToToday(event.target.value) }))}
                />
            </div>

            <div className="compose-field">
              <label className="compose-label">Category</label>
              <select
                className={`compose-select${draft.categoryId ? "" : " placeholder"}`}
                value={draft.categoryId}
                onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
              >
                <option value="">Select category</option>
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
        <FilterDateInput
          value={startDate}
          placeholder="Start date"
          max={endDate || today}
          onChange={(event) => handleStartDateChange(event.target.value)}
        />
        <FilterDateInput
          value={endDate}
          placeholder="End date"
          min={startDate || undefined}
          max={today}
          onChange={(event) => handleEndDateChange(event.target.value)}
        />
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
                        {anomalyIdSet.has(transaction.id) && (
                          <>
                            <span className="anomaly-badge" title={anomalyReasonMap[transaction.id] || "Suspicious transaction"}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              ML Flagged
                            </span>
                            {transaction.kind === "expense" && (
                              <button
                                className="anomaly-verify-btn"
                                type="button"
                                onClick={() => openExistingAnomalyModal(transaction)}
                              >
                                Verify OCR
                              </button>
                            )}
                          </>
                        )}
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

      {/* ML Anomaly Verification Modal */}
      {anomalyModal && (
        <div className="anomaly-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeAnomalyModal(); }}>
          <div className="anomaly-modal">
            <div className="anomaly-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="anomaly-title">
              {anomalyModal.mode === "existing" ? "Verify Flagged Expense" : "Unusual Transaction Detected"}
            </div>
            <div className="anomaly-desc">{anomalyModal.detail}</div>

            <div className="anomaly-reason">
              <strong>ML Detection Reason</strong>
              {anomalyModal.verification.anomaly_reason}
            </div>

            <div className="anomaly-proposed">
              <div className="anomaly-proposed-row">
                <span className="anomaly-proposed-label">Title</span>
                <span className="anomaly-proposed-value">{anomalyModal.verification.proposed.title}</span>
              </div>
              <div className="anomaly-proposed-row">
                <span className="anomaly-proposed-label">Amount</span>
                <span className="anomaly-proposed-value">Rs. {Number(anomalyModal.verification.proposed.amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="anomaly-proposed-row">
                <span className="anomaly-proposed-label">Category</span>
                <span className="anomaly-proposed-value">{anomalyModal.verification.proposed.category_name}</span>
              </div>
              <div className="anomaly-proposed-row">
                <span className="anomaly-proposed-label">Date</span>
                <span className="anomaly-proposed-value">{anomalyModal.verification.proposed.date}</span>
              </div>
            </div>

            <label className={`anomaly-upload ${verifyFile ? "has-file" : ""}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {verifyFile ? verifyFile.name : "Upload bill photo to verify"}
              <input
                ref={verifyInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleVerifyUpload}
              />
            </label>

            {verifyStatus && (
              <div className={`anomaly-status ${verifyStatusType}`}>
                {verifyStatus}
              </div>
            )}

            <div className="anomaly-actions">
              <button className="compose-btn ghost" type="button" onClick={closeAnomalyModal}>
                Dismiss
              </button>
              <button
                className="compose-btn primary"
                type="button"
                disabled={!verifyFile || verifying}
                onClick={handleVerifySubmit}
              >
                {verifying ? "Verifying..." : anomalyModal.mode === "existing" ? "Verify OCR" : "Verify & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
