import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { BRAND_NAME } from "../components/BrandLockup";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { LEDGER_THEME_CSS } from "../styles/ledgerTheme";
import { useLedgerCanvas } from "../utils/ledgerScene";

const STYLES = `
${LEDGER_THEME_CSS}

canvas.bg { position: fixed; inset: 0; z-index: 0; }

.mesh {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 20% 25%, var(--mesh-1) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 80% 75%, var(--mesh-2) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 50% 50%, var(--mesh-3) 0%, transparent 70%);
}

.noise {
  position: fixed;
  inset: 0;
  z-index: 2;
  opacity: var(--noise-opacity);
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px;
}

.shell {
  position: relative;
  z-index: 10;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  border-radius: 24px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--card-shadow), var(--card-glow);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  text-align: center;
}

.title {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  color: var(--sand-50);
  margin-bottom: 10px;
}

.copy {
  font-size: 13px;
  color: var(--sand-400);
  line-height: 1.6;
}

.spinner {
  width: 42px;
  height: 42px;
  margin: 0 auto 18px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.12);
  border-top-color: var(--sage-l);
  animation: spin 0.8s linear infinite;
}

.error-box {
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 12px;
  color: var(--rose);
  border: 1px solid rgba(184,112,112,0.35);
  background: rgba(184,112,112,0.08);
  font-size: 12.5px;
}

.link-row {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-link {
  color: var(--sage-l);
  text-decoration: none;
  font-size: 13px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuth } = useAuth();
  const { theme } = useTheme();
  const [error, setError] = useState(searchParams.get("error") || "");
  const [status, setStatus] = useState(searchParams.get("error") ? "error" : "loading");
  const canvasRef = useRef(null);
  const handledRef = useRef(false);

  useLedgerCanvas(canvasRef, theme);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token || error) {
      setStatus("error");
      if (!error) {
        setError("The sign-in response was incomplete. Please try again.");
      }
      return;
    }

    if (handledRef.current) {
      return;
    }
    handledRef.current = true;

    let active = true;

    async function finishSignIn() {
      try {
        await completeOAuth({ token, remember: true });
        if (!active) {
          return;
        }
        setStatus("success");
        navigate("/dashboard", { replace: true });
      } catch (completeError) {
        if (!active) {
          return;
        }
        setError(completeError.message || "Unable to complete sign-in right now.");
        setStatus("error");
      }
    }

    finishSignIn();

    return () => {
      active = false;
    };
  }, [completeOAuth, error, navigate, searchParams]);

  return (
    <>
      <style>{STYLES}</style>
      <canvas className="bg" ref={canvasRef} />
      <div className="mesh" />
      <div className="noise" />

      <div className="shell">
        <div className="card">
          {status === "loading" && <div className="spinner" aria-hidden="true" />}
          <div className="title">{status === "loading" ? "Finishing sign-in." : "Sign-in paused."}</div>
          <div className="copy">
            {status === "loading"
              ? `We are validating your account and opening your ${BRAND_NAME} workspace.`
              : "The provider returned, but we could not finish the account handoff cleanly."}
          </div>

          {error && <div className="error-box">{error}</div>}

          {status === "error" && (
            <div className="link-row">
              <Link className="btn-link" to="/register">Back to Register</Link>
              <Link className="btn-link" to="/login">Go to Login</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
