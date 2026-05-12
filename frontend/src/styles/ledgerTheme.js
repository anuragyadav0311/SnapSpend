export const LEDGER_THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Figtree:wght@300;400;500;600&family=DM+Mono:wght@300;400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root,
html[data-theme="dark"] {
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
  --glass-bg: rgba(15, 14, 12, 0.55);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-highlight: rgba(255, 255, 255, 0.18);
  --card-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  --card-glow: 0 0 120px rgba(122, 158, 135, 0.06);
  --mesh-1: rgba(122, 158, 135, 0.13);
  --mesh-2: rgba(201, 151, 58, 0.1);
  --mesh-3: rgba(184, 112, 112, 0.07);
  --noise-opacity: 0.035;
  --surface-soft: rgba(255, 255, 255, 0.03);
  --surface-soft-2: rgba(255, 255, 255, 0.04);
  --surface-soft-3: rgba(255, 255, 255, 0.05);
  --surface-hover: rgba(255, 255, 255, 0.07);
  --surface-strong: rgba(255, 255, 255, 0.09);
  --surface-stronger: rgba(255, 255, 255, 0.12);
  --surface-border: rgba(255, 255, 255, 0.06);
  --surface-border-2: rgba(255, 255, 255, 0.05);
  --surface-border-3: rgba(255, 255, 255, 0.14);
  --input-placeholder: rgba(168, 144, 111, 0.45);
  --focus-fill: rgba(122, 158, 135, 0.05);
  --focus-ring: rgba(122, 158, 135, 0.1);
  --error-ring: rgba(184, 112, 112, 0.1);
  --btn-shadow: 0 4px 24px rgba(122, 158, 135, 0.3), 0 1px 0 rgba(255, 255, 255, 0.3) inset;
  --btn-shadow-hover: 0 8px 32px rgba(122, 158, 135, 0.4), 0 1px 0 rgba(255, 255, 255, 0.3) inset;
  --ticker-bg: rgba(15, 14, 12, 0.6);
  --ticker-border: rgba(255, 255, 255, 0.04);
  --toast-bg: rgba(15, 14, 12, 0.92);
  --toast-border: rgba(122, 158, 135, 0.3);
  --toast-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  --canvas-grid: rgba(255, 255, 255, 0.028);
  --canvas-chart-top: rgba(122, 158, 135, 0.14);
  --canvas-chart-mid: rgba(122, 158, 135, 0.03);
  --canvas-chart-bottom: rgba(122, 158, 135, 0);
  --canvas-chart-line: rgba(122, 158, 135, 0.35);
  --canvas-chart-dot: rgba(179, 207, 187, 0.8);
  --canvas-chart-pulse: rgba(179, 207, 187, 0.2);
  --canvas-bar: rgba(122, 158, 135, 0.06);
  --canvas-bar-active: rgba(201, 151, 58, 0.12);
}

html[data-theme="light"] {
  --bg: #f4eee3;
  --sand-50: #231a12;
  --sand-100: #3a2b1f;
  --sand-200: #54402f;
  --sand-300: #6e5744;
  --sand-400: #8a7059;
  --sand-500: #a08770;
  --sage: #6e9c7b;
  --sage-l: #4f7a61;
  --sage-d: #355642;
  --amber: #cb8e33;
  --amber-l: #efbf68;
  --rose: #b96969;
  --ink: #16100a;
  --glass-bg: rgba(255, 248, 239, 0.7);
  --glass-border: rgba(87, 68, 49, 0.12);
  --glass-highlight: rgba(255, 255, 255, 0.82);
  --card-shadow: 0 28px 72px rgba(88, 67, 46, 0.18);
  --card-glow: 0 0 120px rgba(203, 142, 51, 0.12);
  --mesh-1: rgba(110, 156, 123, 0.18);
  --mesh-2: rgba(239, 191, 104, 0.24);
  --mesh-3: rgba(185, 105, 105, 0.12);
  --noise-opacity: 0.02;
  --surface-soft: rgba(255, 255, 255, 0.34);
  --surface-soft-2: rgba(255, 255, 255, 0.46);
  --surface-soft-3: rgba(255, 255, 255, 0.56);
  --surface-hover: rgba(255, 255, 255, 0.76);
  --surface-strong: rgba(93, 73, 52, 0.12);
  --surface-stronger: rgba(93, 73, 52, 0.18);
  --surface-border: rgba(93, 73, 52, 0.1);
  --surface-border-2: rgba(93, 73, 52, 0.08);
  --surface-border-3: rgba(93, 73, 52, 0.16);
  --input-placeholder: rgba(138, 112, 89, 0.78);
  --focus-fill: rgba(110, 156, 123, 0.09);
  --focus-ring: rgba(110, 156, 123, 0.16);
  --error-ring: rgba(185, 105, 105, 0.12);
  --btn-shadow: 0 8px 24px rgba(110, 156, 123, 0.22), 0 1px 0 rgba(255, 255, 255, 0.42) inset;
  --btn-shadow-hover: 0 14px 30px rgba(110, 156, 123, 0.28), 0 1px 0 rgba(255, 255, 255, 0.52) inset;
  --ticker-bg: rgba(249, 240, 227, 0.78);
  --ticker-border: rgba(93, 73, 52, 0.08);
  --toast-bg: rgba(255, 248, 239, 0.94);
  --toast-border: rgba(110, 156, 123, 0.28);
  --toast-shadow: 0 18px 48px rgba(88, 67, 46, 0.18);
  --canvas-grid: rgba(97, 74, 51, 0.08);
  --canvas-chart-top: rgba(110, 156, 123, 0.22);
  --canvas-chart-mid: rgba(110, 156, 123, 0.08);
  --canvas-chart-bottom: rgba(110, 156, 123, 0);
  --canvas-chart-line: rgba(79, 122, 97, 0.5);
  --canvas-chart-dot: rgba(79, 122, 97, 0.8);
  --canvas-chart-pulse: rgba(79, 122, 97, 0.24);
  --canvas-bar: rgba(110, 156, 123, 0.14);
  --canvas-bar-active: rgba(203, 142, 51, 0.18);
}

html, body, #root {
  height: 100%;
  font-family: 'Figtree', sans-serif;
  background: var(--bg);
  color: var(--sand-50);
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

body {
  transition: background 240ms ease, color 240ms ease;
}
`;
