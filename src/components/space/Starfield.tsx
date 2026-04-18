"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient starfield rendered via <canvas> with a tiered-hue palette and a
 * gentle per-star twinkle. Pure requestAnimationFrame — no React state in
 * the loop — throttled to ~30fps to halve CPU. Respects
 * prefers-reduced-motion by early-returning from the loop; the CSS fallback
 * in globals.css swaps in a static multi-radial-gradient for those users.
 */
type Star = {
  x: number;
  y: number;
  r: number;
  hue: string;
  phase: number;
  speed: number;
};

const HUE_TIERS: Array<{ color: string; ratio: number; maxRadius: number }> = [
  { color: "#FFFFFF", ratio: 0.6, maxRadius: 1.2 },
  { color: "#CEB7FF", ratio: 0.3, maxRadius: 1.6 },
  { color: "#8A82A8", ratio: 0.1, maxRadius: 2.0 },
];

function pickHue(): { color: string; maxRadius: number } {
  const roll = Math.random();
  let cursor = 0;
  for (const tier of HUE_TIERS) {
    cursor += tier.ratio;
    if (roll <= cursor) return { color: tier.color, maxRadius: tier.maxRadius };
  }
  return HUE_TIERS[0];
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: Star[] = [];
    let rafId = 0;
    let tick = 0;

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = w < 768 ? 90 : 120;
      stars = Array.from({ length: count }, () => {
        const { color, maxRadius } = pickHue();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * (maxRadius - 0.3) + 0.3,
          hue: color,
          phase: Math.random() * Math.PI * 2,
          speed: 0.002 + Math.random() * 0.004,
        };
      });
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = () => {
      // Throttle to ~30fps by skipping every other frame.
      tick += 1;
      if (tick % 2 === 0) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        ctx.clearRect(0, 0, w, h);
        for (const star of stars) {
          star.phase += star.speed;
          const alpha = 0.2 + (Math.sin(star.phase) + 1) * 0.4; // 0.2..1.0
          ctx.globalAlpha = alpha;
          ctx.fillStyle = star.hue;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      rafId = window.requestAnimationFrame(render);
    };
    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="starfield" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
