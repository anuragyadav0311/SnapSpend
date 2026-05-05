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

.bg-canvas { position: fixed; inset: 0; z-index: 0; }

.bg-mesh {
  position: fixed;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(ellipse 60% 50% at 15% 20%, rgba(122,158,135,0.13) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 85% 80%, rgba(201,151,58,0.10) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(184,112,112,0.07) 0%, transparent 70%);
  pointer-events: none;
  animation: meshDrift 20s ease-in-out infinite alternate;
}

@keyframes meshDrift {
  from { opacity: 0.7; transform: scale(1); }
  to { opacity: 1; transform: scale(1.04) translate(12px, -8px); }
}

.bg-noise {
  position: fixed;
  inset: 0;
  z-index: 2;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px;
  pointer-events: none;
}

.shell {
  position: relative;
  z-index: 10;
  width: 100%;
  min-height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(18px, 4vh, 42px) 24px 88px;
  overflow-y: auto;
}

.glass-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 44px 40px 40px;
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
  margin-bottom: 36px;
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
  margin-bottom: 32px;
  opacity: 0;
  animation: riseIn 0.6s 0.58s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.heading {
  font-family: 'Playfair Display', serif;
  font-size: 30px;
  font-weight: 700;
  color: var(--sand-50);
  line-height: 1.15;
  letter-spacing: -0.025em;
  margin-bottom: 6px;
}

.heading em { font-style: italic; color: var(--sage-l); }

.subhead {
  font-size: 13px;
  font-weight: 300;
  color: var(--sand-400);
  line-height: 1.5;
}

.stats-row {
  display: flex;
  gap: 1px;
  margin-bottom: 30px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
  opacity: 0;
  animation: riseIn 0.6s 0.64s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.stat-cell {
  flex: 1;
  background: rgba(255,255,255,0.03);
  padding: 10px 14px;
  transition: background 0.2s;
}

.stat-cell:hover { background: rgba(255,255,255,0.06); }
.stat-cell + .stat-cell { border-left: 1px solid rgba(255,255,255,0.05); }

.stat-val {
  font-family: 'DM Mono', monospace;
  font-size: 13.5px;
  font-weight: 400;
  color: var(--sand-100);
  letter-spacing: -0.01em;
}

.stat-val.up { color: var(--sage-l); }
.stat-val.down { color: var(--rose); }

.stat-lbl {
  font-size: 10px;
  font-weight: 400;
  color: var(--sand-500);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-top: 1px;
}

.sparkline {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
  margin-top: 4px;
}

.spark-bar {
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: var(--sage);
  opacity: 0.4;
  transform-origin: bottom;
  transform: scaleY(0);
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.field {
  margin-bottom: 16px;
  opacity: 0;
  animation: riseIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.field:nth-of-type(1) { animation-delay: 0.7s; }
.field:nth-of-type(2) { animation-delay: 0.77s; }

.field-lbl {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sand-500);
  margin-bottom: 7px;
  transition: color 0.2s;
}

.field.foc .field-lbl { color: var(--sage-l); }
.input-wrap { position: relative; }

.inp {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 11px;
  padding: 12px 15px;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  color: var(--sand-50);
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
  -webkit-appearance: none;
}

.inp::placeholder { color: rgba(168,144,111,0.45); }

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

.err-text {
  font-size: 11.5px;
  color: var(--rose);
  margin-top: 5px;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 4px;
}

.opt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  opacity: 0;
  animation: riseIn 0.6s 0.84s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.remember-btn,
.forgot {
  font: inherit;
  background: none;
  border: none;
  padding: 0;
}

.remember-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--sand-400);
  cursor: pointer;
  user-select: none;
  font-weight: 300;
}

.chk-box {
  width: 15px;
  height: 15px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  background: rgba(255,255,255,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.chk-box.on { background: var(--sage-d); border-color: var(--sage); }

.forgot {
  font-size: 12.5px;
  color: var(--sage-l);
  cursor: pointer;
  font-weight: 400;
  transition: opacity 0.2s;
  opacity: 0.8;
}

.forgot:hover { opacity: 1; }

.btn-wrap {
  opacity: 0;
  animation: riseIn 0.6s 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.btn {
  width: 100%;
  padding: 13.5px;
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
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
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

@keyframes sheen {
  from { background-position: -200% center; }
  to { background-position: 200% center; }
}

.btn-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(0,0,0,0.08);
  border-radius: 11px;
  transition: width 1.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

.card-footer {
  margin-top: 22px;
  text-align: center;
  font-size: 13px;
  color: var(--sand-500);
  font-weight: 300;
  opacity: 0;
  animation: riseIn 0.6s 0.96s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.reg-link {
  color: var(--sage-l);
  font-weight: 500;
  text-decoration: none;
  margin-left: 4px;
  position: relative;
}

.reg-link::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 100%;
  height: 1px;
  background: var(--amber-l);
  transition: right 0.3s;
}

.reg-link:hover::after { right: 0; }

.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%) translateY(80px);
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

@keyframes riseIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
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

@media (max-width: 480px) {
  .glass-card { padding: 36px 28px 32px; }
  .heading { font-size: 26px; }
  .shell { padding: 16px 16px 84px; }
}
`;

const STATS = [
  { val: "₹3,28,400", lbl: "June Spent", cls: "", sparks: [0.4, 0.55, 0.45, 0.72, 0.6, 0.91] },
  { val: "↓ 12%", lbl: "vs Last Month", cls: "up", sparks: [0.8, 0.7, 0.65, 0.5, 0.45, 0.38] },
  { val: "₹61,200", lbl: "Avg / Week", cls: "down", sparks: [0.3, 0.5, 0.4, 0.6, 0.55, 0.65] },
];

function validate(email, password) {
  const nextErrors = {};

  if (!email) {
    nextErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    nextErrors.email = "Enter a valid email";
  }

  if (!password) {
    nextErrors.password = "Password is required";
  } else if (password.length < 8) {
    nextErrors.password = "Minimum 8 characters";
  }

  return nextErrors;
}

export default function LoginPage() {
  const canvasRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  useLedgerCanvas(canvasRef);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [focus, setFocus] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [sparksReady, setSparksReady] = useState(false);

  useEffect(() => {
    const sparkTimer = setTimeout(() => setSparksReady(true), 1000);

    return () => {
      clearTimeout(sparkTimer);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    const nextErrors = validate(email, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    setProgress(0);

    const progressOne = setTimeout(() => setProgress(55), 80);
    const progressTwo = setTimeout(() => setProgress(88), 750);

    await new Promise((resolve) => setTimeout(resolve, 1700));

    setProgress(100);
    await new Promise((resolve) => setTimeout(resolve, 180));

    clearTimeout(progressOne);
    clearTimeout(progressTwo);

    setLoading(false);
    setProgress(0);
    setToastVisible(true);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 3500);
  };

  return (
    <>
      <style>{STYLES}</style>

      <canvas className="bg-canvas" ref={canvasRef} />
      <div className="bg-mesh" />
      <div className="bg-noise" />

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

          <div className="heading-block">
            <h1 className="heading">Every rupee,<br /><em>accounted for.</em></h1>
            <p className="subhead">Sign in to your financial command centre.</p>
          </div>

          <div className="stats-row">
            {STATS.map((stat, statIndex) => (
              <div className="stat-cell" key={stat.label}>
                <div className={`stat-val ${stat.cls}`}>{stat.val}</div>
                <div className="stat-lbl">{stat.lbl}</div>
                <div className="sparkline">
                  {stat.sparks.map((height, barIndex) => (
                    <div
                      key={`${stat.label}-${barIndex}`}
                      className="spark-bar"
                      style={{
                        height: `${height * 100}%`,
                        background:
                          stat.cls === "up"
                            ? "var(--sage)"
                            : stat.cls === "down"
                              ? "var(--rose)"
                              : "var(--amber)",
                        transform: sparksReady ? "scaleY(1)" : "scaleY(0)",
                        transitionDelay: `${1 + statIndex * 0.12 + barIndex * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={`field${focus.email ? " foc" : ""}`}>
            <div className="field-lbl">
              <span>Email</span>
            </div>
            <div className="input-wrap">
              <input
                className={`inp${errors.email ? " err" : ""}`}
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: "" }));
                }}
                onFocus={() => setFocus((current) => ({ ...current, email: true }))}
                onBlur={() => setFocus((current) => ({ ...current, email: false }))}
              />
            </div>
            {errors.email && <div className="err-text">⚬ {errors.email}</div>}
          </div>

          <div className={`field${focus.password ? " foc" : ""}`}>
            <div className="field-lbl">
              <span>Password</span>
            </div>
            <div className="input-wrap">
              <input
                className={`inp${errors.password ? " err" : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                autoComplete="current-password"
                style={{ paddingRight: 42 }}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: "" }));
                }}
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
            {errors.password && <div className="err-text">⚬ {errors.password}</div>}
          </div>

          <div className="opt-row">
            <button className="remember-btn" type="button" onClick={() => setRemember((current) => !current)}>
              <div className={`chk-box${remember ? " on" : ""}`}>
                {remember && (
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <polyline points="2,5 4.2,7.5 8.5,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              Remember me
            </button>
            <button className="forgot" type="button">Forgot password?</button>
          </div>

          <div className="btn-wrap">
            <button className="btn" type="button" onClick={handleSubmit} disabled={loading}>
              {loading && <div className="btn-progress" style={{ width: `${progress}%` }} />}
              <div className="btn-inner">
                {loading && <div className="spin" />}
                {loading ? "Authenticating..." : "Sign In to Ledger"}
              </div>
            </button>
          </div>

          <div className="card-footer">
            No account yet?
            <Link to="/register" className="reg-link">Create one free →</Link>
          </div>
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
        Signed in - loading your dashboard
      </div>
    </>
  );
}
