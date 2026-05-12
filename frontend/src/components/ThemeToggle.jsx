import { useTheme } from "../context/ThemeContext";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.5V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 19V21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.93 4.93L6.7 6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.3 17.3L19.07 19.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2.5 12H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 12H21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.93 19.07L6.7 17.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.3 6.7L19.07 4.93" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a9 9 0 1 0 10.7 10.7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      aria-pressed={isLight}
    >
      <span className="theme-toggle__icon">{isLight ? <SunIcon /> : <MoonIcon />}</span>
      <span className="theme-toggle__copy">
        <span className="theme-toggle__eyebrow">Theme</span>
        <span className="theme-toggle__label">{isLight ? "Light mode" : "Dark mode"}</span>
      </span>
      <span className={`theme-toggle__track${isLight ? " is-light" : ""}`} aria-hidden="true">
        <span className="theme-toggle__thumb" />
      </span>
    </button>
  );
}
