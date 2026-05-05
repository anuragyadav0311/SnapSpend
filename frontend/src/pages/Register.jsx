import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LEDGER_TICKER_ITEMS, useLedgerCanvas } from "../utils/ledgerScene";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Figtree:wght@300;400;500;600&family=DM+Mono:wght@300;400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0f0e0c;
  --sand-50: #faf8f4;
  --sand-100: #f2ebe0;
  --sand-200: #e2d5c3;
  --sand-300: #c9b89e;
  --sand-400: #a8906f;
  --sand-500: #8a7252;
  --sage: #7a9e87;
  --sage-l: #b3cfbb;
  --sage-d: #4f7a61;
  --amber: #c9973a;
  --amber-l: #e8c97a;
  --rose: #b87070;
  --ink: #1a1714;
  --glass-bg: rgba(15,14,12,0.55);
  --glass-border: rgba(255,255,255,0.08);
}

html, body, #root {
  height: 100%;
  font-family: 'Figtree', sans-serif;
  background: var(--bg);
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

canvas.bg { position: fixed; inset: 0; z-index: 0; }

.mesh {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 20% 25%, rgba(122,158,135,0.12) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 80% 75%, rgba(201,151,58,0.09) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(184,112,112,0.06) 0%, transparent 70%);
  animation: meshDrift 22s ease-in-out infinite alternate;
}

@keyframes meshDrift {
  from { opacity: 0.7; transform: scale(1); }
  to { opacity: 1; transform: scale(1.04) translate(10px, -6px); }
}

.noise {
  position: fixed;
  inset: 0;
  z-index: 2;
  opacity: 0.032;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px;
}

.shell {
  position: relative;
  z-index: 10;
  width: 100%;
  min-height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(18px, 4vh, 42px) 20px 88px;
  overflow-y: auto;
}

.glass-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 40px 40px 36px;
  backdrop-filter: blur(28px) saturate(140%);
  -webkit-backdrop-filter: blur(28px) saturate(140%);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.04) inset,
    0 2px 0 rgba(255,255,255,0.06) inset,
    0 40px 80px rgba(0,0,0,0.6),
    0 0 120px rgba(122,158,135,0.06);
  margin: 0 auto;
  opacity: 0;
  transform: translateY(28px) scale(0.97);
  animation: cardIn 0.9s 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.glass-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  border-radius: 50%;
}

@keyframes cardIn {
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  opacity: 0;
  animation: riseIn 0.6s 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--sage-d), var(--amber));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(122,158,135,0.35);
}

.brand-name {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--sand-100);
  letter-spacing: -0.01em;
}

.heading-block {
  margin-bottom: 24px;
  opacity: 0;
  animation: riseIn 0.6s 0.58s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.heading {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--sand-50);
  line-height: 1.15;
  letter-spacing: -0.025em;
  margin-bottom: 5px;
}

.heading em { font-style: italic; color: var(--amber-l); }

.subhead {
  font-size: 13px;
  font-weight: 300;
  color: var(--sand-400);
  line-height: 1.5;
}

.step-bar {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
  opacity: 0;
  animation: riseIn 0.6s 0.64s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: none;
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: var(--sand-500);
}

.step-circle.active {
  background: var(--sage-d);
  border-color: var(--sage-l);
  color: #fff;
  box-shadow: 0 0 16px rgba(122,158,135,0.45);
}

.step-circle.done {
  background: rgba(122,158,135,0.2);
  border-color: rgba(179,207,187,0.5);
  color: var(--sage-l);
}

.step-lbl {
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--sand-500);
  transition: color 0.3s;
  white-space: nowrap;
}

.step-lbl.active { color: var(--sage-l); }

.step-line {
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 0 6px 16px;
  transition: background 0.4s;
}

.step-line.done { background: rgba(122,158,135,0.4); }

.panel {
  display: none;
  flex-direction: column;
  gap: 14px;
}

.panel.active { display: flex; }

@keyframes panelIn {
  from { opacity: 0; transform: translateX(18px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes panelOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-14px); }
}

.panel-enter { animation: panelIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.panel-exit { display: flex; animation: panelOut 0.22s ease forwards; }

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-lbl {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sand-500);
  transition: color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field.foc .field-lbl { color: var(--sage-l); }

.input-wrap { position: relative; }

.inp {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 11px;
  padding: 11px 14px;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  color: var(--sand-50);
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
  -webkit-appearance: none;
  appearance: none;
}

.inp::placeholder { color: rgba(168,144,111,0.4); }

.inp:focus {
  border-color: rgba(122,158,135,0.55);
  background: rgba(122,158,135,0.05);
  box-shadow: 0 0 0 3px rgba(122,158,135,0.1), 0 1px 0 rgba(255,255,255,0.04) inset;
}

.inp.err {
  border-color: rgba(184,112,112,0.55);
  box-shadow: 0 0 0 3px rgba(184,112,112,0.1);
  animation: shake 0.35s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.err-text {
  font-size: 11.5px;
  color: var(--rose);
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 4px;
}

.eye-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--sand-500);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  transition: color 0.2s;
}

.eye-btn:hover { color: var(--sand-200); }

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.strength-wrap {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.s-seg {
  height: 3px;
  flex: 1;
  border-radius: 2px;
  background: rgba(255,255,255,0.07);
  transition: background 0.4s;
}

.avatar-row,
.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.avatar-opt,
.pill {
  font: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.avatar-opt {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  border: 2px solid transparent;
  background: rgba(255,255,255,0.05);
}

.avatar-opt.sel {
  border-color: var(--sage-l);
  box-shadow: 0 0 0 3px rgba(122,158,135,0.2);
}

.pill {
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 400;
  border: 1px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.04);
  color: var(--sand-400);
}

.pill:hover,
.avatar-opt:hover { background: rgba(255,255,255,0.07); }

.pill.sel {
  background: rgba(79,122,97,0.35);
  border-color: rgba(122,158,135,0.6);
  color: var(--sage-l);
}

.btn-wrap { margin-top: 4px; }

.btn {
  width: 100%;
  padding: 13px;
  border-radius: 11px;
  border: none;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink);
  background: linear-gradient(135deg, var(--sage-l) 0%, var(--amber-l) 100%);
  box-shadow: 0 4px 24px rgba(122,158,135,0.3), 0 1px 0 rgba(255,255,255,0.3) inset;
  transition: transform 0.15s, box-shadow 0.2s, filter 0.2s;
}

.btn::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  background-size: 200% auto;
  opacity: 0;
  transition: opacity 0.3s;
}

.btn:hover:not(:disabled)::after {
  opacity: 1;
  animation: sheen 0.6s linear;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(122,158,135,0.4), 0 1px 0 rgba(255,255,255,0.3) inset;
  filter: brightness(1.05);
}

.btn:active:not(:disabled) { transform: translateY(0); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@keyframes sheen {
  from { background-position: -200% center; }
  to { background-position: 200% center; }
}

.spin {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(30,25,20,0.2);
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: rot 0.7s linear infinite;
}

@keyframes rot {
  to { transform: rotate(360deg); }
}

.btn-ghost {
  width: 100%;
  padding: 11px;
  border-radius: 11px;
  border: 1px solid rgba(255,255,255,0.09);
  background: none;
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--sand-400);
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-ghost:hover { background: rgba(255,255,255,0.04); color: var(--sand-200); }

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 2px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.07);
}

.divider-txt {
  font-size: 11px;
  color: var(--sand-500);
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.06em;
}

.social-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.03);
  cursor: pointer;
  font-family: 'Figtree', sans-serif;
  font-size: 12.5px;
  color: var(--sand-300);
  transition: all 0.2s;
}

.social-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }

.card-footer {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: var(--sand-500);
  font-weight: 300;
}

.login-link {
  color: var(--sage-l);
  font-weight: 500;
  text-decoration: none;
  margin-left: 4px;
  position: relative;
}

.login-link::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 100%;
  height: 1px;
  background: var(--amber-l);
  transition: right 0.3s;
}

.login-link:hover::after { right: 0; }

.check-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.chk-box {
  width: 16px;
  height: 16px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  background: rgba(255,255,255,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 1px;
}

.chk-box.on { background: var(--sage-d); border-color: var(--sage); }

.chk-lbl-txt {
  font-size: 12.5px;
  color: var(--sand-400);
  font-weight: 300;
  line-height: 1.5;
}

.inline-link {
  color: var(--sage-l);
  text-decoration: none;
}

.hint {
  font-size: 11.5px;
  color: var(--sand-500);
  font-weight: 300;
}

.ticker-wrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  z-index: 5;
  overflow: hidden;
  display: flex;
  align-items: center;
  border-top: 1px solid rgba(255,255,255,0.04);
  background: rgba(15,14,12,0.6);
  backdrop-filter: blur(8px);
}

.ticker-inner {
  display: flex;
  gap: 0;
  white-space: nowrap;
  animation: tickerScroll 30s linear infinite;
}

@keyframes tickerScroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 28px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 300;
  color: var(--sand-500);
  border-right: 1px solid rgba(255,255,255,0.05);
}

.ticker-item .up { color: var(--sage-l); }
.ticker-item .down { color: var(--rose); }

.toast {
  position: fixed;
  bottom: 52px;
  left: 50%;
  transform: translateX(-50%) translateY(60px);
  background: rgba(15,14,12,0.92);
  border: 1px solid rgba(122,158,135,0.3);
  color: var(--sand-100);
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 500;
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s;
  opacity: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  pointer-events: none;
}

.toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }

.t-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sage-l);
  animation: blink 1.2s ease infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.success-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(79,122,97,0.25);
  border: 2px solid rgba(122,158,135,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.5s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  box-shadow: 0 0 32px rgba(122,158,135,0.25);
}

@keyframes popIn {
  from { transform: scale(0.4); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.success-title {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--sand-50);
  letter-spacing: -0.02em;
  animation: riseIn 0.5s 0.35s both;
}

.success-title em { font-style: italic; color: var(--sage-l); }

.success-sub {
  font-size: 13px;
  color: var(--sand-400);
  font-weight: 300;
  line-height: 1.6;
  max-width: 280px;
  animation: riseIn 0.5s 0.45s both;
}

.success-cta {
  animation: riseIn 0.5s 0.55s both;
  width: 220px;
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 480px) {
  .glass-card { padding: 32px 24px 28px; }
  .heading { font-size: 24px; }
  .row-2 { grid-template-columns: 1fr; }
  .shell { padding: 16px 16px 84px; }
}
`;

const TITLES = [
  "Begin your<br><em>financial story.</em>",
  "Secure your<br><em>account.</em>",
  "Final<br><em>touches.</em>",
];

const SUBHEADS = [
  "Create your account in three quick steps.",
  "Set a strong password and agree to terms.",
  "Personalise your Ledger experience.",
];

const CURRENCY_OPTIONS = [
  { label: "₹ INR", value: "INR" },
  { label: "$ USD", value: "USD" },
  { label: "€ EUR", value: "EUR" },
  { label: "£ GBP", value: "GBP" },
  { label: "د.إ AED", value: "AED" },
];

const GOAL_OPTIONS = [
  { label: "Save More", value: "save" },
  { label: "Pay Off Debt", value: "debt" },
  { label: "Invest", value: "invest" },
  { label: "Track Spending", value: "track" },
  { label: "Retirement", value: "retire" },
];

const AVATARS = ["🌿", "⚡", "🔮", "🌙", "🏔", "🦋"];
const PASSWORD_STRENGTH_COLORS = ["rgba(184,112,112,0.7)", "rgba(201,151,58,0.7)", "rgba(122,158,135,0.7)", "var(--sage-l)"];
const PASSWORD_STRENGTH_LABELS = ["Too short", "Could be stronger", "Getting there...", "Rock solid ✓"];

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
  return score;
}

export default function Register() {
  const canvasRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const enteringTimeoutRef = useRef(null);
  const submitTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  useLedgerCanvas(canvasRef);

  const [step, setStep] = useState(0);
  const [exitingStep, setExitingStep] = useState(null);
  const [enteringStep, setEnteringStep] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [focus, setFocus] = useState({});
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    income: "",
    currency: "INR",
    goal: "save",
    avatar: "0",
    referralSource: "",
  });
  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  });

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (enteringTimeoutRef.current) {
        clearTimeout(enteringTimeoutRef.current);
      }
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: false }));
    }
  };

  const goTo = (nextStep) => {
    if (nextStep === step) {
      return;
    }

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    if (enteringTimeoutRef.current) {
      clearTimeout(enteringTimeoutRef.current);
    }

    setExitingStep(step);
    transitionTimeoutRef.current = setTimeout(() => {
      setExitingStep(null);
      setStep(nextStep);
      setEnteringStep(nextStep);
      enteringTimeoutRef.current = setTimeout(() => setEnteringStep(null), 380);
    }, 220);
  };

  const validateIdentity = () => {
    const nextErrors = {
      firstName: !form.firstName.trim(),
      lastName: !form.lastName.trim(),
      email: !form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()),
    };

    setErrors((current) => ({ ...current, ...nextErrors }));
    return !Object.values(nextErrors).some(Boolean);
  };

  const validateSecurity = () => {
    const nextErrors = {
      password: form.password.length < 8,
      confirmPassword: !form.confirmPassword || form.password !== form.confirmPassword,
      terms: !termsAccepted,
    };

    setErrors((current) => ({ ...current, ...nextErrors }));
    return !Object.values(nextErrors).some(Boolean);
  };

  const triggerToast = () => {
    setToastVisible(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 3500);
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => {
      submitTimeoutRef.current = setTimeout(resolve, 1800);
    });
    setSubmitting(false);
    goTo(3);
  };

  const passwordStrength = getPasswordStrength(form.password);

  const panelClassName = (panelIndex) => {
    if (panelIndex === exitingStep) {
      return "panel panel-exit";
    }
    if (panelIndex === step) {
      return `panel active${enteringStep === panelIndex ? " panel-enter" : ""}`;
    }
    return "panel";
  };

  const renderStepCircle = (index) => {
    if (index < step) {
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <polyline points="2,5 4.2,7.5 8.5,2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return `0${index + 1}`;
  };

  return (
    <>
      <style>{STYLES}</style>

      <canvas className="bg" ref={canvasRef} />
      <div className="mesh" />
      <div className="noise" />

      <div className="shell">
        <div className="glass-card">
          <div className="brand">
            <div className="brand-mark">
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L14 6V12L9 16L4 12V6L9 2Z" fill="white" opacity="0.95" />
                <path d="M9 5.5L11 7.5V10.5L9 12.5L7 10.5V7.5L9 5.5Z" fill="white" opacity="0.35" />
              </svg>
            </div>
            <span className="brand-name">Ledger</span>
          </div>

          {step < 3 && (
            <>
              <div className="heading-block">
                <h1 className="heading" dangerouslySetInnerHTML={{ __html: TITLES[step] }} />
                <p className="subhead">{SUBHEADS[step]}</p>
              </div>

              <div className="step-bar">
                {[0, 1, 2].map((index) => (
                  <div key={index} style={{ display: "contents" }}>
                    <div className="step-node">
                      <div className={`step-circle${step === index ? " active" : step > index ? " done" : ""}`}>
                        {renderStepCircle(index)}
                      </div>
                      <span className={`step-lbl${step === index ? " active" : ""}`}>
                        {index === 0 ? "Identity" : index === 1 ? "Security" : "Preferences"}
                      </span>
                    </div>
                    {index < 2 && <div className={`step-line${step > index ? " done" : ""}`} />}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={panelClassName(0)}>
            <div className="row-2">
              <div className={`field${focus.firstName ? " foc" : ""}`}>
                <div className="field-lbl">First Name</div>
                <input
                  className={`inp${errors.firstName ? " err" : ""}`}
                  type="text"
                  placeholder="Arjun"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(event) => setField("firstName", event.target.value)}
                  onFocus={() => setFocus((current) => ({ ...current, firstName: true }))}
                  onBlur={() => setFocus((current) => ({ ...current, firstName: false }))}
                />
                {errors.firstName && <div className="err-text">⚬ Required</div>}
              </div>

              <div className={`field${focus.lastName ? " foc" : ""}`}>
                <div className="field-lbl">Last Name</div>
                <input
                  className={`inp${errors.lastName ? " err" : ""}`}
                  type="text"
                  placeholder="Sharma"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(event) => setField("lastName", event.target.value)}
                  onFocus={() => setFocus((current) => ({ ...current, lastName: true }))}
                  onBlur={() => setFocus((current) => ({ ...current, lastName: false }))}
                />
                {errors.lastName && <div className="err-text">⚬ Required</div>}
              </div>
            </div>

            <div className={`field${focus.email ? " foc" : ""}`}>
              <div className="field-lbl">Email Address</div>
              <input
                className={`inp${errors.email ? " err" : ""}`}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                onFocus={() => setFocus((current) => ({ ...current, email: true }))}
                onBlur={() => setFocus((current) => ({ ...current, email: false }))}
              />
              {errors.email && <div className="err-text">⚬ Enter a valid email</div>}
            </div>

            <div className={`field${focus.phone ? " foc" : ""}`}>
              <div className="field-lbl">
                Mobile <span className="hint" style={{ fontSize: 10, textTransform: "none", letterSpacing: 0 }}>Optional</span>
              </div>
              <div className="input-wrap">
                <span
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13,
                    color: "var(--sand-500)",
                    fontFamily: "'DM Mono', monospace",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  +91
                </span>
                <input
                  className="inp"
                  type="tel"
                  placeholder="98765 43210"
                  autoComplete="tel"
                  style={{ paddingLeft: 46 }}
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  onFocus={() => setFocus((current) => ({ ...current, phone: true }))}
                  onBlur={() => setFocus((current) => ({ ...current, phone: false }))}
                />
              </div>
            </div>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-txt">or continue with</span>
              <div className="divider-line" />
            </div>

            <div className="social-row">
              <button className="social-btn" type="button">
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>

              <button className="social-btn" type="button">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--sand-300)">
                  <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.75-.303-.41-.564-.83-.79-1.24-.606-1.15-.94-2.45-.94-3.69 0-3.01 1.975-4.6 3.92-4.6 1.473 0 2.7.97 3.59.97.85 0 2.18-1.01 3.87-1.01.62 0 2.83.06 4.24 2.16zm-6.13-7.46c.17-.8.43-1.64 1.04-2.31.7-.77 1.88-1.33 2.84-1.37.07.21.1.42.1.65 0 1.11-.42 2.22-1.14 3.03-.67.77-1.8 1.35-2.84 1.35-.05-.14-.07-.29-.07-.46 0-.3.03-.61.1-.89z" />
                </svg>
                Apple
              </button>
            </div>

            <div className="btn-wrap">
              <button className="btn" type="button" onClick={() => validateIdentity() && goTo(1)}>
                <div className="btn-inner">Continue →</div>
              </button>
            </div>
          </div>

          <div className={panelClassName(1)}>
            <div className={`field${focus.password ? " foc" : ""}`}>
              <div className="field-lbl">Password</div>
              <div className="input-wrap">
                <input
                  className={`inp${errors.password ? " err" : ""}`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  style={{ paddingRight: 42 }}
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  onFocus={() => setFocus((current) => ({ ...current, password: true }))}
                  onBlur={() => setFocus((current) => ({ ...current, password: false }))}
                />
                <button
                  className="eye-btn"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="strength-wrap">
                {[0, 1, 2, 3].map((segment) => (
                  <div
                    key={segment}
                    className="s-seg"
                    style={{
                      background:
                        segment < passwordStrength && passwordStrength > 0
                          ? PASSWORD_STRENGTH_COLORS[passwordStrength - 1]
                          : "rgba(255,255,255,0.07)",
                    }}
                  />
                ))}
              </div>

              <span className="hint" style={{ minHeight: 16, display: "block" }}>
                {form.password.length ? PASSWORD_STRENGTH_LABELS[Math.max(0, passwordStrength - 1)] : ""}
              </span>

              {errors.password && <div className="err-text">⚬ Minimum 8 characters</div>}
            </div>

            <div className={`field${focus.confirmPassword ? " foc" : ""}`}>
              <div className="field-lbl">Confirm Password</div>
              <input
                className={`inp${errors.confirmPassword ? " err" : ""}`}
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => setField("confirmPassword", event.target.value)}
                onFocus={() => setFocus((current) => ({ ...current, confirmPassword: true }))}
                onBlur={() => setFocus((current) => ({ ...current, confirmPassword: false }))}
              />
              {errors.confirmPassword && <div className="err-text">⚬ Passwords don't match</div>}
            </div>

            <div className={`field${focus.income ? " foc" : ""}`}>
              <div className="field-lbl">
                Monthly Income <span className="hint" style={{ fontSize: 10, textTransform: "none", letterSpacing: 0 }}>Optional</span>
              </div>
              <div className="input-wrap">
                <span
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13,
                    color: "var(--sand-500)",
                    fontFamily: "'DM Mono', monospace",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  ₹
                </span>
                <input
                  className="inp"
                  type="text"
                  placeholder="e.g. 80,000"
                  style={{ paddingLeft: 28 }}
                  value={form.income}
                  onChange={(event) => setField("income", event.target.value)}
                  onFocus={() => setFocus((current) => ({ ...current, income: true }))}
                  onBlur={() => setFocus((current) => ({ ...current, income: false }))}
                />
              </div>
            </div>

            <label
              className="check-row"
              onClick={() => {
                setTermsAccepted((current) => !current);
                if (errors.terms) {
                  setErrors((current) => ({ ...current, terms: false }));
                }
              }}
            >
              <div className={`chk-box${termsAccepted ? " on" : ""}`} />
              <span className="chk-lbl-txt">
                I agree to Ledger&apos;s{" "}
                <a className="inline-link" href="#" onClick={(event) => event.preventDefault()}>Terms of Service</a>
                {" "}and{" "}
                <a className="inline-link" href="#" onClick={(event) => event.preventDefault()}>Privacy Policy</a>
              </span>
            </label>

            {errors.terms && <div className="err-text">⚬ You must accept the terms</div>}

            <div className="btn-wrap">
              <button className="btn" type="button" onClick={() => validateSecurity() && goTo(2)}>
                <div className="btn-inner">Continue →</div>
              </button>
              <button className="btn-ghost" type="button" onClick={() => goTo(0)}>← Back</button>
            </div>
          </div>

          <div className={panelClassName(2)}>
            <div className="field">
              <div className="field-lbl">Choose Currency</div>
              <div className="pill-row">
                {CURRENCY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`pill${form.currency === option.value ? " sel" : ""}`}
                    type="button"
                    onClick={() => setField("currency", option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <div className="field-lbl">Primary Financial Goal</div>
              <div className="pill-row">
                {GOAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`pill${form.goal === option.value ? " sel" : ""}`}
                    type="button"
                    onClick={() => setField("goal", option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <div className="field-lbl">Pick an Avatar</div>
              <div className="avatar-row">
                {AVATARS.map((avatar, index) => (
                  <button
                    key={`${avatar}-${index}`}
                    className={`avatar-opt${form.avatar === String(index) ? " sel" : ""}`}
                    type="button"
                    onClick={() => setField("avatar", String(index))}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className={`field${focus.referralSource ? " foc" : ""}`}>
              <div className="field-lbl">How did you find us?</div>
              <div className="input-wrap">
                <select
                  className="inp"
                  style={{ cursor: "pointer", color: "var(--sand-300)", background: "#1a1714" }}
                  value={form.referralSource}
                  onChange={(event) => setField("referralSource", event.target.value)}
                  onFocus={() => setFocus((current) => ({ ...current, referralSource: true }))}
                  onBlur={() => setFocus((current) => ({ ...current, referralSource: false }))}
                >
                  <option value="" style={{ background: "#1a1714" }}>Select an option...</option>
                  <option value="friend" style={{ background: "#1a1714" }}>Friend or colleague</option>
                  <option value="social" style={{ background: "#1a1714" }}>Social media</option>
                  <option value="search" style={{ background: "#1a1714" }}>Search engine</option>
                  <option value="ad" style={{ background: "#1a1714" }}>Advertisement</option>
                  <option value="blog" style={{ background: "#1a1714" }}>Blog / article</option>
                </select>
              </div>
            </div>

            <div className="btn-wrap">
              <button className="btn" type="button" disabled={submitting} onClick={handleSubmit}>
                <div className="btn-inner">
                  {submitting && <div className="spin" />}
                  {submitting ? "Creating account..." : "Create My Account →"}
                </div>
              </button>
              <button className="btn-ghost" type="button" onClick={() => goTo(1)}>← Back</button>
            </div>
          </div>

          <div className={panelClassName(3)}>
            <div className="success-screen">
              <div className="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--sage-l)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="success-title">You&apos;re in,<br /><em>let&apos;s begin.</em></h2>
              <p className="success-sub">Your Ledger account is ready. We&apos;re loading your personalised dashboard now.</p>
              <button className="btn success-cta" type="button" onClick={triggerToast}>
                <div className="btn-inner">Go to Dashboard →</div>
              </button>
            </div>
          </div>

          {step < 3 && (
            <div className="card-footer">
              Already have an account?
              <Link to="/" className="login-link">Sign in →</Link>
            </div>
          )}
        </div>
      </div>

      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...LEDGER_TICKER_ITEMS, ...LEDGER_TICKER_ITEMS].map((item, index) => (
            <span className="ticker-item" key={`${item.label}-${index}`}>
              {item.label}
              <span className={item.dir}>{item.val} {item.dir === "up" ? "▲" : "▼"}</span>
            </span>
          ))}
        </div>
      </div>

      <div className={`toast${toastVisible ? " show" : ""}`}>
        <div className="t-dot" />
        Dashboard loading - welcome aboard!
      </div>
    </>
  );
}
