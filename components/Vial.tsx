import type { CSSProperties } from "react";

/**
 * Product image: a studio photo per product type (public/vial/vial-<tone>.webp,
 * blank name area, transparent background) with the product name and size set
 * as live text on the label. The label always matches the catalog (including
 * the RUO naming guard) because it is rendered from data, never baked into a
 * picture. All photos share one 746×1740 box (scripts/vial/build-vials.mjs);
 * per-photo text positions live in styles/shop.css (.vial-photo--<tone>).
 *
 * Text is sized in container-query units (cqw) so it stays locked to the
 * label at every rendered size, from 18px thumbnails to the PDP stage.
 */
/** Photos available; anything else (e.g. bundles) uses the navy vial (metabolic). */
const TONES = new Set(["repair", "metabolic", "cognitive", "supply", "nasal"]);

/** Approximate width in em of Inter semibold with the label's tight tracking. */
function textEms(s: string): number {
  let w = 0;
  for (const ch of s) w += /[A-Z0-9]/.test(ch) ? 0.6 : /[a-z]/.test(ch) ? 0.49 : 0.32;
  return w;
}

/** Long names go on two balanced lines (never ending a line on "+"). */
function nameLines(name: string): string[] {
  if (name.length <= 16 || !name.includes(" ")) return [name];
  const words = name.split(" ");
  let best: { lines: string[]; cost: number } | null = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const cost = Math.max(a.length, b.length) + (a.endsWith("+") ? 4 : 0);
    if (!best || cost < best.cost) best = { lines: [a, b], cost };
  }
  return best!.lines;
}

export function Vial({
  name,
  option,
  accent,
  className = "vial",
}: {
  name: string;
  option?: string;
  /** Photo: "repair" | "metabolic" | "cognitive" | "supply" | "nasal". Unset = navy vial. */
  accent?: string;
  className?: string;
}) {
  const tone = accent && TONES.has(accent) ? accent : "metabolic";
  const lines = nameLines(name);
  // Fit left of the vertical wordmark: ~56% of a vial's width (scaled by --vp-room for narrower
  // labels), using rough semibold glyph widths, capped at the printed size (--vp-scale).
  const ems = Math.max(...lines.map(textEms), 0.5);
  const fit = +(56 / ems).toFixed(2);
  const fs = `min(calc(${fit}cqw * var(--vp-room, 1)), calc(15cqw * var(--vp-scale, 1)))`;
  // The size pill sits just under the name, however many lines it takes.
  const style = { "--vp-name-h": `calc(${fs} * ${lines.length})` } as CSSProperties;
  return (
    <span className={`vial-photo vial-photo--${tone} ${className}`} style={style} role="img" aria-label={`${name}${option ? " " + option : ""} research vial`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/vial/vial-${tone}.webp`} alt="" width={746} height={1740} decoding="async" draggable={false} />
      <span className="vp-name" style={{ fontSize: fs }}>
        {lines[0]}
        {lines[1] ? <><br />{lines[1]}</> : null}
      </span>
      {option ? <span className="vp-opt">{option.replace(/\s+/g, "")}</span> : null}
    </span>
  );
}
