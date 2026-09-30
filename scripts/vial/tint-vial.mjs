// Builds glossy, category-tinted copies of public/vial/vial.webp:
//   public/vial/vial-repair.webp, vial-metabolic.webp, vial-cognitive.webp,
//   and vial-slate.webp (original color, gloss only)
//
//   node scripts/vial/tint-vial.mjs
//
// Only the slate label is recolored: each label pixel's brightness is mapped
// onto the category gradient used by the printed labels (scripts/labels), so
// the photo's shading is kept. Near-white print (REVISED, purity line) is
// left white, and glass/cap outside the label band are untouched.
// Gloss: a sharp specular streak with a soft halo on the left, a faint
// secondary reflection on the right and darkened edges, so the label reads
// as a laminated wrap on a cylinder.
// Needs playwright-core + Chromium (CHROME_PATH to override); set REPO_ROOT
// when running a copy of this script from elsewhere.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.env.REPO_ROOT ?? new URL("../../", import.meta.url).pathname;
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

// Label band measured in vial.webp (746×1695).
const BAND = { x0: 36, x1: 712, y0: 660, y1: 1456 };
// The label itself (measured edge to edge), used for the gloss profile.
const LABEL = { x0: 42, x1: 705, y0: 669, y1: 1447 };

// Same palettes as scripts/labels/build-labels.mjs: dark end, body, sheen.
const TONES = {
  repair: ["#264A4D", "#3C7F7F", "#6FB8B6"],
  metabolic: ["#1D2740", "#2A3F66", "#52709C"],
  cognitive: ["#261B1D", "#4A1A1E", "#7C4A4F"],
  slate: null, // keep the photo's color, add gloss only
};

const src = "data:image/webp;base64," + readFileSync(join(ROOT, "public/vial/vial.webp")).toString("base64");
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();

for (const [key, stops] of Object.entries(TONES)) {
  const url = await page.evaluate(async ({ src, stops, BAND, LABEL }) => {
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [dark, body, sheen] = stops ? stops.map(hex) : [];
    const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    const im = new Image(); im.src = src; await im.decode();
    const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
    const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    const img = g.getImageData(0, 0, c.width, c.height); const d = img.data;
    const lum = (i) => (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    // Brightness range of the slate label (ignoring white print).
    let lo = 1, hi = 0;
    for (let y = BAND.y0; y < BAND.y1; y += 2) for (let x = BAND.x0; x < BAND.x1; x += 2) {
      const i = (y * c.width + x) * 4; if (d[i + 3] < 240) continue;
      const L = lum(i); if (L < 0.62 && d[i + 2] >= d[i]) { lo = Math.min(lo, L); hi = Math.max(hi, L); }
    }
    if (stops) for (let y = BAND.y0; y < BAND.y1; y++) for (let x = BAND.x0; x < BAND.x1; x++) {
      const i = (y * c.width + x) * 4; if (d[i + 3] < 200) continue;
      const [R, G, B] = [d[i], d[i + 1], d[i + 2]];
      if (B < R - 6) continue; // not the blue-gray label (e.g. warm glass reflections)
      const L = lum(i);
      const w = Math.max(0, Math.min(1, (0.78 - L) / 0.22)); // 1 on slate, 0 on white print
      if (!w) continue;
      const t = Math.max(0, Math.min(1, (L - lo) / (hi - lo)));
      const m = t < 0.5 ? lerp(dark, body, t / 0.5) : lerp(body, sheen, (t - 0.5) / 0.5);
      for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] * (1 - w) + m[k] * w);
    }
    // Gloss over the whole label (print included, like a laminate).
    const gauss = (u, m, s) => Math.exp(-(((u - m) / s) ** 2));
    for (let y = LABEL.y0; y <= LABEL.y1; y++) {
      const v = (y - LABEL.y0) / (LABEL.y1 - LABEL.y0);
      const fadeV = Math.min(1, v / 0.04, (1 - v) / 0.04); // soften at top/bottom edges
      for (let x = LABEL.x0; x <= LABEL.x1; x++) {
        const i = (y * c.width + x) * 4; if (d[i + 3] < 200) continue;
        const u = (x - LABEL.x0) / (LABEL.x1 - LABEL.x0);
        const spec = (0.42 * gauss(u, 0.2, 0.028) + 0.16 * gauss(u, 0.2, 0.1) + 0.07 * gauss(u, 0.83, 0.045)) * fadeV;
        const edge = Math.max(0, Math.abs(u - 0.5) - 0.36) / 0.14;
        const shade = 1 - 0.3 * edge ** 1.6;
        for (let k = 0; k < 3; k++) { const b = d[i + k] * shade; d[i + k] = Math.round(b + (255 - b) * spec); }
      }
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL("image/webp", 0.92);
  }, { src, stops, BAND, LABEL });
  writeFileSync(join(ROOT, `public/vial/vial-${key}.webp`), Buffer.from(url.split(",")[1], "base64"));
  console.log("wrote", `public/vial/vial-${key}.webp`);
}
await browser.close();
