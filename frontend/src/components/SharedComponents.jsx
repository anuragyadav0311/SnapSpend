import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({ target, prefix = "", suffix = "", duration = 1200, decimals = 0 }) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-IN");

  return <span>{prefix}{formatted}{suffix}</span>;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 5,
  color = "var(--sage-l)",
  bgColor = "var(--surface-hover)",
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const offset = circumference - (animatedProgress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
    </svg>
  );
}

export function CategoryPill({ label, color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 14px",
        borderRadius: "20px",
        fontSize: "11.5px",
        fontWeight: 400,
        border: selected ? `1px solid ${color || "var(--sage)"}` : "1px solid var(--surface-strong)",
        background: selected ? "var(--focus-fill)" : "var(--surface-soft-2)",
        color: selected ? (color || "var(--sage-l)") : "var(--sand-400)",
        cursor: "pointer",
        fontFamily: "'Figtree', sans-serif",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export function StaggerWrap({ children, baseDelay = 0.1, stagger = 0.08, className = "" }) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, index) =>
            child ? (
              <div
                key={index}
                style={{
                  opacity: 0,
                  animation: `riseIn 0.6s ${baseDelay + index * stagger}s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                }}
              >
                {child}
              </div>
            ) : null,
          )
        : children}
    </div>
  );
}
