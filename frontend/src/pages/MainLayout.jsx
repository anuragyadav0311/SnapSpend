import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import BrandLockup, { BRAND_NAME, BRAND_USER_NAME } from "../components/BrandLockup";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { LEDGER_THEME_CSS } from "../styles/ledgerTheme";
import { useLedgerCanvas } from "../utils/ledgerScene";

const STYLES = `
${LEDGER_THEME_CSS}

.layout-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

.layout-mesh {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 10% 15%, var(--mesh-1) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 90% 85%, var(--mesh-2) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 50% 50%, var(--mesh-3) 0%, transparent 70%);
  animation: meshDrift 24s ease-in-out infinite alternate;
}

@keyframes meshDrift {
  from { opacity: 0.55; transform: scale(1); }
  to { opacity: 0.85; transform: scale(1.03) translate(8px, -6px); }
}

.layout-noise {
  position: fixed;
  inset: 0;
  z-index: 2;
  opacity: var(--noise-opacity);
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px;
}

.layout-wrap {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 100dvh;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 240px;
  background: var(--glass-bg);
  border-right: 1px solid var(--glass-border);
  backdrop-filter: blur(28px) saturate(140%);
  -webkit-backdrop-filter: blur(28px) saturate(140%);
  display: flex;
  flex-direction: column;
  padding: 28px 16px 20px;
  z-index: 100;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 2px 0 24px rgba(0,0,0,0.08);
  overflow-y: auto;
  scrollbar-width: thin;
}

.sidebar::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, var(--glass-highlight), transparent 50%, var(--glass-highlight));
  opacity: 0.3;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  margin-bottom: 36px;
}

.sidebar-brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--sage-d), var(--amber));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(122,158,135,0.3);
}

.sidebar-brand-name {
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--sand-100);
  letter-spacing: -0.01em;
}

.nav-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sand-500);
  padding: 12px 12px 6px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: 10px;
  font-family: 'Figtree', sans-serif;
  font-size: 13.5px;
  font-weight: 400;
  color: var(--sand-400);
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
}

.nav-link:hover {
  background: var(--surface-soft-2);
  color: var(--sand-200);
}

.nav-link.active {
  background: var(--focus-fill);
  color: var(--sage-l);
  font-weight: 500;
  box-shadow: 0 0 0 1px var(--sage) inset, 0 2px 8px rgba(122,158,135,0.1);
}

.nav-link.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 25%;
  bottom: 25%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--sage-l);
}

.nav-icon {
  width: 18px;
  height: 18px;
  opacity: 0.7;
  flex-shrink: 0;
}

.nav-link.active .nav-icon { opacity: 1; }

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-user {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--surface-border);
}

.sidebar-user-name {
  font-size: 13px;
  color: var(--sand-200);
  font-weight: 500;
}

.sidebar-user-email {
  font-size: 11px;
  color: var(--sand-500);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-theme-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  font-family: 'Figtree', sans-serif;
  font-size: 12.5px;
  color: var(--sand-400);
  transition: all 0.2s;
  width: 100%;
}

.sidebar-theme-toggle:hover {
  background: var(--surface-soft-2);
  color: var(--sand-200);
}

.signout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid var(--surface-strong);
  background: transparent;
  font-family: 'Figtree', sans-serif;
  font-size: 12.5px;
  color: var(--sand-400);
  transition: all 0.2s;
  width: 100%;
}

.signout-btn:hover {
  background: rgba(184,112,112,0.08);
  border-color: var(--rose);
  color: var(--sand-200);
}

.theme-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--sage-l), var(--amber));
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.theme-dot::after {
  content: "";
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--surface-soft);
  transition: transform 0.3s, opacity 0.3s;
}

.theme-dot.light::after { transform: translate(0, 0); opacity: 1; }
.theme-dot.dark::after { transform: translate(8px, -8px); opacity: 0; }

.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 32px 36px 132px;
  min-height: 100dvh;
  overflow-x: hidden;
}

.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--glass-bg);
  border-bottom: 1px solid var(--glass-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 200;
  display: none;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.hamburger {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sand-300);
  transition: all 0.2s;
}

.hamburger:hover { background: var(--surface-soft-2); }

.hamburger:focus-visible,
.mobile-theme-toggle:focus-visible,
.sidebar-theme-toggle:focus-visible {
  outline: 2px solid var(--sage);
  outline-offset: 2px;
}

.mobile-brand {
  justify-self: center;
  min-width: 0;
  max-width: 100%;
  text-align: center;
  font-size: 18px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.96;
}

.mobile-theme-toggle {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 12px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  justify-self: end;
  transition: all 0.2s;
}

.mobile-theme-toggle:hover {
  background: var(--surface-soft-2);
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 90;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.overlay.show { opacity: 1; pointer-events: auto; }

@media (max-width: 860px) {
  .sidebar {
    transform: translateX(-100%);
    width: min(280px, calc(100vw - 28px));
    z-index: 220;
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .main-content {
    margin-left: 0;
    padding: 84px 18px 132px;
  }
  .mobile-header {
    display: grid;
  }
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pageIn {
  from { opacity: 0; transform: translateY(20px) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.page-enter {
  animation: pageIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
`;

const NAV_ITEMS = [
    { to: "/dashboard", label: "Dashboard", icon: "grid" },
    { to: "/transactions", label: "Transactions", icon: "list" },
    { to: "/budgets", label: "Budgets", icon: "pie" },
    { to: "/insights", label: "Reports", icon: "trending" },
    { to: "/profile", label: "Profile", icon: "user" },
];

function NavIcon({ type }) {
    const props = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
    switch (type) {
        case "grid":
            return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
        case "list":
            return <svg {...props}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
        case "pie":
            return <svg {...props}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>;
        case "trending":
            return <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
        case "user":
            return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
        default:
            return null;
    }
}

export default function MainLayout() {
    const canvasRef = useRef(null);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useLedgerCanvas(canvasRef, theme);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 860) setSidebarOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <>
            <style>{STYLES}</style>

            <canvas className="layout-canvas" ref={canvasRef} />
            <div className="layout-mesh" />
            <div className="layout-noise" />

            <div className={`overlay${sidebarOpen ? " show" : ""}`} onClick={() => setSidebarOpen(false)} />

            <div className="layout-wrap">
                <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
                    <BrandLockup
                        containerClassName="sidebar-brand"
                        markClassName="sidebar-brand-mark"
                        nameClassName="sidebar-brand-name"
                        size={15}
                    />

                    <nav className="nav-section">
                        <div className="nav-label">Menu</div>
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <NavIcon type={item.icon} />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="sidebar-footer">
                        <div className="sidebar-user">
                            <div className="sidebar-user-name">{user?.name || BRAND_USER_NAME}</div>
                            <div className="sidebar-user-email">{user?.email || "Signed in"}</div>
                        </div>
                        <button
                            className="sidebar-theme-toggle"
                            type="button"
                            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                            onClick={toggleTheme}
                        >
                            <div className={`theme-dot ${theme}`} />
                            {theme === "dark" ? "Dark Mode" : "Light Mode"}
                        </button>
                        <button className="signout-btn" type="button" onClick={logout}>
                            Sign Out
                        </button>
                    </div>
                </aside>

                <div className="mobile-header">
                    <button
                        className="hamburger"
                        type="button"
                        aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={sidebarOpen}
                        onClick={() => setSidebarOpen((open) => !open)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <span className="sidebar-brand-name mobile-brand">{BRAND_NAME}</span>
                    <button
                        className="mobile-theme-toggle"
                        type="button"
                        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                        onClick={toggleTheme}
                    >
                        <div className={`theme-dot ${theme}`} />
                    </button>
                </div>

                <main className="main-content">
                    <div className="page-enter">
                        <Outlet />
                    </div>
                </main>
            </div>
        </>
    );
}
