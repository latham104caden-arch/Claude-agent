"use client";

import { useEffect, useRef } from "react";

/**
 * Full-bleed waving US flag, drawn on a canvas and heavily blurred via CSS
 * (see .coa-flag). The flag is painted once to an offscreen canvas, then each
 * frame is rebuilt from thin vertical slices offset by a travelling sine wave,
 * with a light/dark pass per slice for the folds.
 *
 * Cheap by design: rendered at reduced resolution (the blur hides it), ~30fps,
 * paused whenever the section is off-screen, and a single still frame for
 * visitors who prefer reduced motion.
 */
type FlagColors = { stripe: string; stripeAlt: string; field: string; star: string };

/** Flag colors come from the --flag-* tokens in styles/tokens.css. */
function readColors(el: Element): FlagColors {
  const cs = getComputedStyle(el);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  return { stripe: v("--flag-stripe"), stripeAlt: v("--flag-stripe-alt"), field: v("--flag-field"), star: v("--flag-star") };
}

function paintFlag(w: number, h: number, col: FlagColors): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  const stripe = h / 13;
  for (let i = 0; i < 13; i++) {
    g.fillStyle = i % 2 === 0 ? col.stripe : col.stripeAlt;
    g.fillRect(0, Math.floor(i * stripe), w, Math.ceil(stripe) + 1);
  }
  const cw = w * 0.4, ch = stripe * 7;
  g.fillStyle = col.field;
  g.fillRect(0, 0, cw, ch);
  // 50 stars: 9 rows alternating 6 / 5
  g.fillStyle = col.star;
  const r = Math.max(1.2, ch * 0.028);
  for (let row = 0; row < 9; row++) {
    const cols = row % 2 === 0 ? 6 : 5;
    for (let col = 0; col < cols; col++) {
      const x = cw * ((row % 2 === 0 ? col * 2 + 1 : col * 2 + 2) / 12);
      const y = ch * ((row + 1) / 10);
      g.beginPath();
      for (let k = 0; k < 10; k++) {
        const rad = k % 2 === 0 ? r : r * 0.45;
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      }
      g.closePath();
      g.fill();
    }
  }
  return c;
}

export function WavingFlag({ className = "coa-flag" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const g = canvas.getContext("2d");
    if (!g) return;

    const SCALE = 0.5; // render at half size; the CSS blur hides it
    let W = 0, H = 0, src: HTMLCanvasElement | null = null, amp = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      W = Math.max(2, Math.round(box.width * SCALE));
      H = Math.max(2, Math.round(box.height * SCALE));
      canvas.width = W; canvas.height = H;
      amp = H * 0.025; // gentle ripple, not a flap
      // Flag drawn to cover the canvas plus room for the wave above and below.
      const fh = H + amp * 4;
      const fw = Math.max(W * 1.04, fh * 1.9);
      src = paintFlag(Math.round(fw), Math.round(fh), readColors(canvas));
    };

    const draw = (t: number) => {
      if (!src) return;
      g.clearRect(0, 0, W, H);
      const step = 2;
      const oy = (src.height - H) / 2;
      const ox = (src.width - W) / 2;
      for (let x = 0; x < W; x += step) {
        const u = x / W;
        const phase = u * Math.PI * 2 * 0.9 - t * 0.6;
        const lift = 0.45 + 0.55 * u; // hoist side moves less
        const dy = Math.sin(phase) * amp * lift + Math.sin(phase * 0.5 + 1.3) * amp * 0.35 * lift;
        g.drawImage(src, x + ox, 0, step, src.height, x, dy - oy, step, src.height);
        const s = Math.cos(phase);
        g.fillStyle = s > 0 ? `rgba(255,255,255,${(s * 0.08 * lift).toFixed(3)})` : `rgba(0,0,0,${(-s * 0.14 * lift).toFixed(3)})`;
        g.fillRect(x, 0, step, H);
      }
    };

    resize();
    const ro = new ResizeObserver(() => { resize(); draw(performance.now() / 1000); });
    ro.observe(canvas);

    if (reduce) { draw(0.8); return () => ro.disconnect(); }

    let raf = 0, last = 0, visible = false;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return; // ~30fps
      last = now;
      draw(now / 1000);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    draw(0);

    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
