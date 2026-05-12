import { useEffect } from "react";

export const LEDGER_TICKER_ITEMS = [
  { label: "Food & Dining", val: "\u20B918,240", dir: "down" },
  { label: "Transport", val: "\u20B96,800", dir: "down" },
  { label: "Housing", val: "\u20B945,000", dir: "up" },
  { label: "Entertainment", val: "\u20B94,200", dir: "down" },
  { label: "Savings Rate", val: "34.2%", dir: "up" },
  { label: "Budget Health", val: "Good", dir: "up" },
  { label: "Subscriptions", val: "\u20B92,100", dir: "down" },
  { label: "Investments", val: "\u20B930,000", dir: "up" },
];

const PARTICLE_SYMBOLS = ["\u20B9", "\u20B9", "\u20B9", "%", "\u2191", "\u2193", "\u2211", "\u20B9", "\u2022", "\u20B9"];

const CANVAS_PALETTES = {
  dark: {
    particleColors: [
      "rgba(179,207,187,0.18)",
      "rgba(232,201,122,0.15)",
      "rgba(184,112,112,0.12)",
      "rgba(168,144,111,0.14)",
      "rgba(255,255,255,0.07)",
    ],
    grid: "rgba(255,255,255,0.028)",
    chartTop: "rgba(122,158,135,0.14)",
    chartMid: "rgba(122,158,135,0.03)",
    chartBottom: "rgba(122,158,135,0)",
    chartLine: "rgba(122,158,135,0.35)",
    chartDot: "rgba(179,207,187,0.8)",
    chartPulse: "rgba(179,207,187,0.2)",
    bar: "rgba(122,158,135,0.06)",
    barActive: "rgba(201,151,58,0.12)",
  },
  light: {
    particleColors: [
      "rgba(79,122,97,0.16)",
      "rgba(203,142,51,0.16)",
      "rgba(185,105,105,0.12)",
      "rgba(138,112,89,0.14)",
      "rgba(59,44,31,0.08)",
    ],
    grid: "rgba(97,74,51,0.08)",
    chartTop: "rgba(110,156,123,0.22)",
    chartMid: "rgba(110,156,123,0.08)",
    chartBottom: "rgba(110,156,123,0)",
    chartLine: "rgba(79,122,97,0.5)",
    chartDot: "rgba(79,122,97,0.8)",
    chartPulse: "rgba(79,122,97,0.24)",
    bar: "rgba(110,156,123,0.14)",
    barActive: "rgba(203,142,51,0.18)",
  },
};

function makeParticle(width, height, particleColors) {
  return {
    x: Math.random() * width,
    y: height + 20,
    vx: (Math.random() - 0.5) * 0.22,
    vy: -(0.18 + Math.random() * 0.28),
    sym: PARTICLE_SYMBOLS[Math.floor(Math.random() * PARTICLE_SYMBOLS.length)],
    color: particleColors[Math.floor(Math.random() * particleColors.length)],
    size: 10 + Math.random() * 12,
    alpha: 0.1 + Math.random() * 0.5,
    life: 0.6 + Math.random() * 0.4,
    decay: 0.0008 + Math.random() * 0.001,
    mono: Math.random() > 0.5,
  };
}

export function useLedgerCanvas(canvasRef, theme = "dark") {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }

    let animationFrameId = null;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const palette = CANVAS_PALETTES[theme] ?? CANVAS_PALETTES.dark;

    canvas.width = width;
    canvas.height = height;

    const particleCount = Math.min(40, Math.floor((width * height) / 22000));
    const particles = Array.from({ length: particleCount }, () => makeParticle(width, height, palette.particleColors));
    const chartPoints = [0.68, 0.55, 0.72, 0.48, 0.62, 0.38, 0.52, 0.31, 0.44, 0.28];

    const drawFrame = (time) => {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const chartWidth = width * 0.6;
      const chartHeight = height * 0.35;
      const chartX = width * 0.2;
      const chartY = height * 0.3;
      const points = chartPoints.map((value, index) => ({
        x: chartX + (index / (chartPoints.length - 1)) * chartWidth,
        y: chartY + chartHeight * (value + Math.sin(time * 0.0006 + index * 0.5) * 0.04),
      }));

      const gradient = ctx.createLinearGradient(0, chartY, 0, chartY + chartHeight);
      gradient.addColorStop(0, palette.chartTop);
      gradient.addColorStop(0.6, palette.chartMid);
      gradient.addColorStop(1, palette.chartBottom);

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        const cx = (points[index - 1].x + points[index].x) / 2;
        ctx.bezierCurveTo(cx, points[index - 1].y, cx, points[index].y, points[index].x, points[index].y);
      }
      ctx.lineTo(points[points.length - 1].x, chartY + chartHeight);
      ctx.lineTo(points[0].x, chartY + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        const cx = (points[index - 1].x + points[index].x) / 2;
        ctx.bezierCurveTo(cx, points[index - 1].y, cx, points[index].y, points[index].x, points[index].y);
      }
      ctx.strokeStyle = palette.chartLine;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const lastPoint = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = palette.chartDot;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 8 + Math.sin(time * 0.003) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = palette.chartPulse;
      ctx.lineWidth = 1;
      ctx.stroke();

      const bars = [0.4, 0.65, 0.3, 0.75, 0.5, 0.85, 0.45];
      bars.forEach((barHeight, index) => {
        const h = height * 0.18 * barHeight;
        const barX = width * 0.1 + index * 48;
        ctx.fillStyle = index === bars.length - 1 ? palette.barActive : palette.bar;
        ctx.beginPath();
        ctx.roundRect(barX, height * 0.75 - h, 18, h, [3, 3, 0, 0]);
        ctx.fill();
      });

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;

        if (particle.life <= 0 || particle.y < -40) {
          particles[index] = makeParticle(width, height, palette.particleColors);
          return;
        }

        const fade = Math.min(particle.life * 3, 1);
        ctx.save();
        ctx.globalAlpha = particle.alpha * fade;
        ctx.font = `${particle.mono ? "300" : "600"} ${particle.size}px ${particle.mono ? "'DM Mono'" : "'Playfair Display'"}, serif`;
        ctx.fillStyle = particle.color;
        ctx.fillText(particle.sym, particle.x, particle.y);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(drawFrame);
    };

    animationFrameId = requestAnimationFrame(drawFrame);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [canvasRef, theme]);
}
