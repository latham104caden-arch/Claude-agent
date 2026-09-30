// Builds the product vial images from the studio photos (v3: category labels).
//
//   node scripts/vial/build-vials.mjs repair=<teal.jpg> cognitive=<maroon.jpg> metabolic=<navy.jpg> [preview.png]
//
// For each 2000×2000 photo:
// 1) Finds the label (the saturated band) and crops every vial to the same
//    box relative to it, so one set of text positions fits all colors.
// 2) Erases the printed product name + size pill: each column is filled by
//    interpolating the clean label pixels just above and below the text, so the
//    label's gradient and highlights carry straight through.
// 3) Keys the white studio backdrop to transparent ("color to alpha"); the
//    label and the cap/crimp are forced opaque so they never go translucent.
// Writes public/vial/vial-<tone>.webp and design/vial-blank-<tone>.jpg, and
// prints where the name and pill sat (as % of the crop) for styles/shop.css.
//
// The source photos are not committed: they carry a placeholder product name.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";

const root = process.env.REPO_ROOT || new URL("../..", import.meta.url).pathname;
const args = process.argv.slice(2);
const inputs = args.filter((a) => a.includes("=")).map((a) => a.split("="));
const preview = args.find((a) => !a.includes("="));

// Crop box relative to the detected label (source pixels).
const CROP = { w: 746, h: 1740, above: 670 };

const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage();
const shown = [];

for (const [tone, file] of inputs) {
  const url = "data:image/jpeg;base64," + readFileSync(file).toString("base64");
  const out = await p.evaluate(async ({ url, CROP }) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const W = c.width, H = c.height;
    const d = g.getImageData(0, 0, W, H); const px = d.data;
    const at = (x, y) => { const i = (y * W + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
    const sat = (x, y) => { const q = at(x, y); return Math.max(...q) - Math.min(...q); };

    // Label: rows where most pixels are saturated, then columns that stay colored/dark.
    const rows = [];
    for (let y = 0; y < H; y++) { let n = 0; for (let x = 0; x < W; x += 4) if (sat(x, y) > 20) n++; if (n > W / 4 * 0.2) rows.push(y); }
    const L = { y0: rows[0], y1: rows[rows.length - 1] };
    const cols = [];
    for (let x = 0; x < W; x++) { let n = 0; for (let y = L.y0; y < L.y1; y += 4) { const q = at(x, y); if (sat(x, y) > 14 || Math.max(...q) < 110) n++; } if (n > (L.y1 - L.y0) / 4 * 0.8) cols.push(x); }
    L.x0 = cols[0]; L.x1 = cols[cols.length - 1];
    const LW = L.x1 - L.x0, LH = L.y1 - L.y0;

    // Printed name + pill: near-white pixels in the upper-left of the label
    // (skipping the lit left edge and the vertical wordmark on the right).
    let e = { x0: W, x1: 0, y0: H, y1: 0 };
    for (let y = L.y0 + Math.round(LH * 0.04); y < L.y0 + LH * 0.45; y++)
      for (let x = L.x0 + Math.round(LW * 0.04); x < L.x0 + LW * 0.6; x++) {
        const q = at(x, y); if (Math.min(...q) > 190) { e.x0 = Math.min(e.x0, x); e.x1 = Math.max(e.x1, x); e.y0 = Math.min(e.y0, y); e.y1 = Math.max(e.y1, y); }
      }
    const print = { ...e };
    e = { x0: e.x0 - 16, x1: e.x1 + 18, y0: e.y0 - 16, y1: e.y1 + 18 };

    // Erase: per column, blend from the clean strip above to the one below.
    const avg = (x, ya, yb) => { let s = [0, 0, 0], n = 0; for (let y = ya; y < yb; y++) { const q = at(x, y); s = s.map((v, k) => v + q[k]); n++; } return s.map((v) => v / n); };
    for (let x = e.x0; x <= e.x1; x++) {
      const top = avg(x, e.y0 - 22, e.y0 - 4), bot = avg(x, e.y1 + 4, e.y1 + 22);
      for (let y = e.y0; y <= e.y1; y++) {
        const t = (y - e.y0) / (e.y1 - e.y0), i = (y * W + x) * 4, k = (Math.random() - 0.5) * 1.2;
        for (let j = 0; j < 3; j++) px[i + j] = top[j] + (bot[j] - top[j]) * t + k;
      }
    }
    g.putImageData(d, 0, 0);

    // Crop, same box relative to the label for every photo.
    const cx = Math.round((L.x0 + L.x1) / 2 - CROP.w / 2), cy = L.y0 - CROP.above;
    const o = document.createElement("canvas"); o.width = CROP.w; o.height = CROP.h;
    const og = o.getContext("2d"); og.drawImage(c, cx, cy, CROP.w, CROP.h, 0, 0, CROP.w, CROP.h);
    const blank = o.toDataURL("image/jpeg", 0.92);

    // Backdrop → alpha. Label and metal cap are opaque.
    const od = og.getImageData(0, 0, CROP.w, CROP.h); const q = od.data;
    const B = [0, 1, 2].map((k) => Math.max(q[(3 * CROP.w + 3) * 4 + k], q[(3 * CROP.w + CROP.w - 4) * 4 + k]) + 1);
    const lab = { x0: L.x0 - cx, x1: L.x1 - cx, y0: L.y0 - cy, y1: L.y1 - cy };
    const capY1 = Math.round(lab.y0 * 0.47); // cap + crimp end about halfway down to the label
    for (let y = 0; y < CROP.h; y++) for (let x = 0; x < CROP.w; x++) {
      const i = (y * CROP.w + x) * 4;
      if (x >= lab.x0 && x <= lab.x1 && y >= lab.y0 && y <= lab.y1) { q[i + 3] = 255; continue; }
      const lum = (q[i] + q[i + 1] + q[i + 2]) / 3;
      if (y < capY1 && lum < (B[0] + B[1] + B[2]) / 3 - 6) {
        // Metal: opaque wherever it is visibly darker than the backdrop.
        let a = 0; for (let k = 0; k < 3; k++) a = Math.max(a, (B[k] - q[i + k]) / B[k]);
        if (a > 0.08) { q[i + 3] = 255; continue; }
      }
      let a = 0;
      for (let k = 0; k < 3; k++) a = Math.max(a, (B[k] - q[i + k]) / B[k]);
      // Below the label the studio floor casts a faint shadow; drop it so the
      // crop edge never shows as a box on colored backgrounds.
      if (a < (y > lab.y1 ? 0.09 : 0.03)) { q[i + 3] = 0; continue; }
      a = Math.min(1, a * 1.3);
      for (let k = 0; k < 3; k++) q[i + k] = Math.max(0, Math.min(255, B[k] - (B[k] - q[i + k]) / a));
      q[i + 3] = Math.round(a * 255);
    }
    // Feather the left/right crop edges below the label (glass base + floor
    // shadow run to the edge there) so no straight cut line shows.
    const F = 18;
    for (let y = lab.y1 + 1; y < CROP.h; y++) for (let x = 0; x < CROP.w; x++) {
      const e = Math.min(x, CROP.w - 1 - x); if (e >= F) continue;
      const i = (y * CROP.w + x) * 4; q[i + 3] = Math.round(q[i + 3] * (e / F) ** 1.5);
    }
    // Cap + crimp are solid metal: fill each row's span so bright highlights
    // (close to the white backdrop) don't key out and leave holes.
    for (let y = 0; y < capY1; y++) {
      let a = -1, z = -1;
      for (let x = 0; x < CROP.w; x++) if (q[(y * CROP.w + x) * 4 + 3] > 60) { if (a < 0) a = x; z = x; }
      if (a < 0 || z - a < CROP.w * 0.5) continue; // only full-width metal rows
      for (let x = a + 2; x <= z - 2; x++) q[(y * CROP.w + x) * 4 + 3] = 255;
    }
    og.putImageData(od, 0, 0);
    const pct = (v, n) => +((v / n) * 100).toFixed(2);
    return {
      blank, alpha: o.toDataURL("image/webp", 0.92),
      label: { left: pct(lab.x0, CROP.w), right: pct(CROP.w - lab.x1, CROP.w), top: pct(lab.y0, CROP.h), bottom: pct(CROP.h - lab.y1, CROP.h) },
      print: { left: pct(print.x0 - cx, CROP.w), top: pct(print.y0 - cy, CROP.h), right: pct(print.x1 - cx, CROP.w), bottom: pct(print.y1 - cy, CROP.h) },
    };
  }, { url, CROP });
  writeFileSync(`${root}design/vial-blank-${tone}.jpg`, Buffer.from(out.blank.split(",")[1], "base64"));
  writeFileSync(`${root}public/vial/vial-${tone}.webp`, Buffer.from(out.alpha.split(",")[1], "base64"));
  console.log(tone, JSON.stringify({ label: out.label, print: out.print }));
  shown.push(out.alpha);
}

if (preview) {
  await p.setViewportSize({ width: 1200, height: 900 });
  await p.setContent(`<body style="margin:0;display:flex">${shown.map((s, i) => `
    <div style="flex:1;height:900px;background:${i % 2 ? "linear-gradient(160deg,#6A84A0,#33475F)" : "#CCD8E4"};display:grid;place-items:center"><img src="${s}" style="height:840px"></div>`).join("")}</body>`);
  await p.screenshot({ path: preview });
}
await b.close();
