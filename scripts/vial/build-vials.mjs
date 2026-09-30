// Builds the product images from the studio photos (v4: vials + nasal bottle).
//
//   node scripts/vial/build-vials.mjs repair=<teal.jpg> cognitive=<maroon.jpg> metabolic=<navy.jpg> \
//     supply=<gray.jpg> nasal=<nasal.jpg> [preview.png]
//
// Any subset of tones can be rebuilt. For each 2000×2000 photo:
// 1) Finds the label: the longest band of rows that are colored or darker than
//    the backdrop (so the gray label and dark print work too).
// 2) Erases the printed placeholder name + size pill (anything that differs
//    sharply from the clean label just above it); each column is filled by
//    interpolating the label above and below the text, keeping its gradient.
// 3) Cuts the product out of the backdrop, which is measured per row on both
//    sides so gray or vignetted backdrops work:
//    - glass vials: "color to alpha" with a soft knee, label and cap solid,
//      everything below the glass base faded out;
//    - nasal (white plastic bottle): a solid silhouette, row by row.
// 4) Crops to one 746×1740 box. Vials are anchored to the label; the nasal
//    bottle is scaled to stand in the same space as a vial.
// Writes public/vial/vial-<tone>.webp and design/vial-blank-<tone>.jpg, and
// prints where the placeholder name and pill sat (as % of the crop) for the
// text positions in styles/shop.css. CALIB_DIR=<dir> also saves the un-erased
// crops for checking those positions (never commit them).
//
// The source photos are not committed: they carry a placeholder product name.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";

const root = process.env.REPO_ROOT || new URL("../..", import.meta.url).pathname;
const args = process.argv.slice(2);
const inputs = args.filter((a) => a.includes("=")).map((a) => a.split("="));
const preview = args.find((a) => !a.includes("="));

// Output box; vials are cropped with the label top this far down.
const CROP = { w: 746, h: 1740, above: 670 };
// Tones shot as a solid (opaque plastic) bottle rather than a glass vial.
const SOLID = new Set(["nasal"]);

const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage();
const shown = [];

for (const [tone, file] of inputs) {
  const url = "data:image/jpeg;base64," + readFileSync(file).toString("base64");
  const out = await p.evaluate(async ({ url, CROP, solid }) => {
    const img = new Image(); img.src = url; await img.decode();
    const W = img.width, H = img.height;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, W, H); const px = d.data;
    const at = (x, y) => { const i = (y * W + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
    const lumOf = (q) => (q[0] + q[1] + q[2]) / 3;

    // Backdrop per row, sampled far left and far right, blended across.
    const strip = (sx, y) => { let s = [0, 0, 0], n = 0; for (let yy = Math.max(0, y - 2); yy <= Math.min(H - 1, y + 2); yy++) for (let x = sx; x < sx + 100; x += 4) { const v = at(x, yy); s = s.map((t, k) => t + v[k]); n++; } return s.map((t) => t / n + 1); };
    const bgL = [], bgR = [];
    for (let y = 0; y < H; y++) { bgL.push(strip(60, y)); bgR.push(strip(W - 160, y)); }
    const back = (x, y) => { const t = (x - 110) / (W - 220); return [0, 1, 2].map((k) => bgL[y][k] + (bgR[y][k] - bgL[y][k]) * t); };
    // "Ink" = label material: clearly colored, or clearly darker than the backdrop there.
    const ink = (x, y) => { const q = at(x, y); return Math.max(...q) - Math.min(...q) > 20 || lumOf(q) < lumOf(back(x, y)) - 45; };

    // 1) Label: longest run of "ink" rows (small gaps from print merged), then its columns.
    const runs = []; let cur = null;
    for (let y = 0; y < H; y++) {
      let n = 0; for (let x = 0; x < W; x += 3) if (ink(x, y)) n++;
      if (n > 110) { if (cur && y - cur.y1 < 30) cur.y1 = y; else { cur = { y0: y, y1: y }; runs.push(cur); } }
    }
    const L = runs.sort((a, z) => (z.y1 - z.y0) - (a.y1 - a.y0))[0];
    const LH = L.y1 - L.y0, mid = Math.round((L.y0 + L.y1) / 2);
    for (let x = 0; x < W; x++) if (ink(x, mid) && ink(x, mid - Math.round(LH * 0.3)) && ink(x, mid + Math.round(LH * 0.3))) { if (L.x0 === undefined) L.x0 = x; L.x1 = x; }
    const LW = L.x1 - L.x0, Lcx = (L.x0 + L.x1) / 2;

    // 2) Printed name + pill: pixels in the upper-left of the label that differ
    // sharply from the clean strip at the top of that column.
    const avg = (x, ya, yb) => { let s = [0, 0, 0], n = 0; for (let y = ya; y < yb; y++) { const q = at(x, y); s = s.map((v, k) => v + q[k]); n++; } return s.map((v) => v / n); };
    let e = { x0: W, x1: 0, y0: H, y1: 0 };
    const ry0 = L.y0 + Math.round(LH * 0.015), ry1 = L.y0 + Math.round(LH * 0.045);
    for (let x = L.x0 + Math.round(LW * 0.04); x < L.x0 + LW * 0.6; x++) {
      const ref = lumOf(avg(x, ry0, ry1));
      for (let y = L.y0 + Math.round(LH * 0.05); y < L.y0 + LH * 0.45; y++)
        if (Math.abs(lumOf(at(x, y)) - ref) > 45) { e.x0 = Math.min(e.x0, x); e.x1 = Math.max(e.x1, x); e.y0 = Math.min(e.y0, y); e.y1 = Math.max(e.y1, y); }
    }
    const print = { ...e };
    e = { x0: e.x0 - 16, x1: e.x1 + 18, y0: e.y0 - 14, y1: e.y1 + 18 };

    // Crop geometry (source rect → 746×1740), decided before erasing.
    const bright = (x, y) => { const q = at(x, y), B = back(x, y); return Math.max(...q.map((v, k) => Math.abs(v - B[k]))); };
    let src, spans = null;
    if (!solid) {
      src = { x: Math.round(Lcx - CROP.w / 2), y: L.y0 - CROP.above, w: CROP.w, h: CROP.h };
    } else {
      // Solid bottle: white plastic is nearly the backdrop's color, so find the
      // shaded right-hand outline on each row (a sharp brightness step) and
      // mirror it across the label's center line; the bottle is symmetric.
      spans = new Array(H).fill(null);
      const cxi = Math.round(Lcx);
      const lum3 = (x, y) => (lumOf(at(x, Math.max(0, y - 1))) + lumOf(at(x, y)) + lumOf(at(x, Math.min(H - 1, y + 1)))) / 3;
      for (let y = 2; y < H - 2; y++) {
        let hw = -1;
        // The nozzle (within ~150px of the axis) has a fainter outline than the body.
        for (let x = cxi + 450; x > cxi + 6; x--) if (Math.abs(lum3(x + 3, y) - lum3(x - 3, y)) > (x - cxi < 150 ? 3.5 : 6)) { hw = x - cxi; break; }
        if (hw >= 12) spans[y] = [cxi - hw, cxi + hw];
      }
      // Keep the contiguous block through the label (drops stray specks and shadow).
      // Short gaps (a faint row or two) are bridged from the row below.
      let top = L.y0, bot = L.y1;
      for (let y = L.y0 - 1, gap = 0; y > 0; y--) { if (spans[y]) { for (let f = y + 1; f < top; f++) spans[f] = spans[top]; top = y; gap = 0; } else if (++gap > 24) break; }
      while (bot < H - 1 && spans[bot + 1]) bot++;
      for (let y = 0; y < H; y++) if (y < top || y > bot) spans[y] = null;
      const s = Math.min(1, 1706 / (bot - top));
      src = { x: Lcx - CROP.w / (2 * s), y: top - 24 / s, w: CROP.w / s, h: CROP.h / s };
    }
    const toCrop = (r) => ({ x0: (r.x0 - src.x) * CROP.w / src.w, x1: (r.x1 - src.x) * CROP.w / src.w, y0: (r.y0 - src.y) * CROP.h / src.h, y1: (r.y1 - src.y) * CROP.h / src.h });
    const cropOf = (canvas, type, q) => { const o = document.createElement("canvas"); o.width = CROP.w; o.height = CROP.h; o.getContext("2d").drawImage(canvas, src.x, src.y, src.w, src.h, 0, 0, CROP.w, CROP.h); return type ? o.toDataURL(type, q) : o; };

    // Un-erased crop, for text-position checks only.
    const printed = cropOf(c, "image/jpeg", 0.9);

    // Erase: per column, blend from the clean strip above to the one below.
    for (let x = e.x0; x <= e.x1; x++) {
      const top = avg(x, e.y0 - 20, e.y0 - 4), bot = avg(x, e.y1 + 4, e.y1 + 20);
      for (let y = e.y0; y <= e.y1; y++) {
        const t = (y - e.y0) / (e.y1 - e.y0), i = (y * W + x) * 4, k = (Math.random() - 0.5) * 1.2;
        for (let j = 0; j < 3; j++) px[i + j] = top[j] + (bot[j] - top[j]) * t + k;
      }
    }
    g.putImageData(d, 0, 0);
    const blank = cropOf(c, "image/jpeg", 0.92);

    // 3) Cut out, in source coordinates.
    const k = new ImageData(new Uint8ClampedArray(px), W, H); const q = k.data;
    // The label is solid, but only where it really is: its top and bottom edges
    // curve round the vial, so take each row's own left/right label edge rather
    // than the bounding box (whose corners would keep patches of white backdrop).
    const labSpan = new Map();
    for (let y = L.y0 - 6; y <= L.y1 + 6; y++) {
      let a = -1, z = -1;
      for (let x = L.x0 - 6; x <= L.x1 + 6; x++) if (ink(x, y)) { if (a < 0) a = x; z = x; }
      if (a >= 0 && z - a > LW * 0.5) labSpan.set(y, [a, z]);
    }
    // Near the top/bottom edge only real label pixels count (no light seam where
    // the label meets the glass); inside, the whole span (white print included).
    const inLab = (x, y) => {
      const sp = labSpan.get(y); if (!sp || x < sp[0] || x > sp[1]) return false;
      return (y > L.y0 + 8 && y < L.y1 - 8) || ink(x, y);
    };
    if (solid) {
      for (let y = 0; y < H; y++) {
        const sp = spans[y];
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (!sp || x < sp[0] - 3 || x > sp[1] + 3) { q[i + 3] = 0; continue; }
          if (x > sp[0] + 2 && x < sp[1] - 2) { q[i + 3] = 255; continue; }
          q[i + 3] = Math.round(255 * Math.max(0, Math.min(1, (bright(x, y) - 4) / 14))); // anti-aliased rim
        }
      }
    } else {
      const capTop = src.y, capEnd = src.y + Math.round(CROP.above * 0.47);
      const x0 = Math.max(0, src.x), x1 = Math.min(W, src.x + src.w), y0 = Math.max(0, src.y), y1 = Math.min(H, src.y + src.h);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * W + x) * 4;
        if (inLab(x, y)) { q[i + 3] = 255; continue; }
        const B = back(x, y);
        let a = 0; for (let j = 0; j < 3; j++) a = Math.max(a, (B[j] - q[i + j]) / B[j]);
        if (y < capEnd && a > 0.08) { q[i + 3] = 255; continue; } // metal cap/crimp
        const t = Math.max(0, Math.min(1, (a - 0.015) / 0.06)); // soft knee: no blocky patches
        a = Math.min(1, a * 1.3) * t * t * (3 - 2 * t);
        if (a <= 0.002) { q[i + 3] = 0; continue; }
        for (let j = 0; j < 3; j++) q[i + j] = Math.max(0, Math.min(255, B[j] - (B[j] - q[i + j]) / Math.max(a, 0.05)));
        q[i + 3] = Math.round(a * 255);
      }
      // Cap + crimp are solid metal: fill each full-width row with the original pixels.
      for (let y = y0; y < capEnd; y++) {
        let a = -1, z = -1;
        for (let x = x0; x < x1; x++) if (q[(y * W + x) * 4 + 3] > 60) { if (a < 0) a = x; z = x; }
        if (a < 0 || z - a < CROP.w * 0.5) continue;
        for (let x = a + 2; x <= z - 2; x++) { const i = (y * W + x) * 4; for (let j = 0; j < 3; j++) q[i + j] = px[i + j]; q[i + 3] = 255; }
      }
      // Glass base: last row with solid glass under the label; fade everything below.
      let base = L.y1;
      for (let y = L.y1 + 1; y < y1; y++) { let n = 0; for (let x = L.x0; x <= L.x1; x++) if (q[(y * W + x) * 4 + 3] > 70) n++; if (n > LW * 0.12) base = y; }
      for (let y = base - 6; y < y1; y++) { const f = Math.max(0, 1 - (y - (base - 6)) / 16); for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4; q[i + 3] = Math.round(q[i + 3] * f); } }
      // Feather the left/right crop edges below the label so no straight cut shows.
      const F = 18;
      for (let y = L.y1 + 1; y < y1; y++) for (let x = x0; x < x1; x++) {
        const ed = Math.min(x - src.x, src.x + src.w - 1 - x); if (ed >= F) continue;
        const i = (y * W + x) * 4; q[i + 3] = Math.round(q[i + 3] * (Math.max(0, ed) / F) ** 1.5);
      }
    }
    const kc = document.createElement("canvas"); kc.width = W; kc.height = H; kc.getContext("2d").putImageData(k, 0, 0);
    const alpha = cropOf(kc, "image/webp", 0.92);

    const pct = (v, n) => +((v / n) * 100).toFixed(2);
    const lc = toCrop(L), pc = toCrop(print);
    return {
      blank, printed, alpha,
      label: { left: pct(lc.x0, CROP.w), right: pct(CROP.w - lc.x1, CROP.w), top: pct(lc.y0, CROP.h), bottom: pct(CROP.h - lc.y1, CROP.h) },
      print: { left: pct(pc.x0, CROP.w), top: pct(pc.y0, CROP.h), right: pct(pc.x1, CROP.w), bottom: pct(pc.y1, CROP.h) },
    };
  }, { url, CROP, solid: SOLID.has(tone) });
  writeFileSync(`${root}design/vial-blank-${tone}.jpg`, Buffer.from(out.blank.split(",")[1], "base64"));
  writeFileSync(`${root}public/vial/vial-${tone}.webp`, Buffer.from(out.alpha.split(",")[1], "base64"));
  if (process.env.CALIB_DIR) writeFileSync(`${process.env.CALIB_DIR}/printed-${tone}.jpg`, Buffer.from(out.printed.split(",")[1], "base64"));
  console.log(tone, JSON.stringify({ label: out.label, print: out.print }));
  shown.push(out.alpha);
}

if (preview) {
  await p.setViewportSize({ width: 300 * shown.length, height: 760 });
  await p.setContent(`<body style="margin:0;display:flex">${shown.map((s, i) => `
    <div style="flex:1;height:760px;background:${i % 2 ? "linear-gradient(160deg,#6A84A0,#33475F)" : "#CCD8E4"};display:grid;place-items:center"><img src="${s}" style="height:720px"></div>`).join("")}</body>`);
  await p.screenshot({ path: preview });
}
await b.close();
