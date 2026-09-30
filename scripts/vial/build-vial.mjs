// Builds public/vial/vial.webp from the studio vial photo (v2: slate label).
//
//   node scripts/vial/build-vial.mjs <photo.jpg> [preview.png]
//
// 1) Erases the printed product name + size pill by copying, column by column,
//    the averaged clean label pixels just above the text — this keeps the
//    label's left→right gradient intact.
// 2) Crops tight to the vial (reflection trimmed).
// 3) Keys the light-gray studio backdrop to transparent ("color to alpha"
//    against the measured backdrop, not pure white), so glass is see-through
//    on any background. Label text/wordmark and the silver crimp are forced
//    opaque so they never go translucent.
// Also writes design/vial-blank.jpg (erased, cropped, backdrop intact).
//
// All pixel boxes are for the 2000×2000 source photo. If the framing changes,
// re-measure them and update the label text positions (.vp-name / .vp-opt)
// in styles/shop.css.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";

const [src, preview] = process.argv.slice(2);
// REPO_ROOT lets the script run from a folder that has playwright-core installed.
const root = process.env.REPO_ROOT || new URL("../..", import.meta.url).pathname;
const url = "data:image/jpeg;base64," + readFileSync(src).toString("base64");

const CFG = {
  erase: { x0: 700, x1: 1070, y0: 906, y1: 1162 },   // "RETA" + "10mg" pill
  band: { y0: 850, y1: 892 },                         // clean label strip above the text
  crop: { x: 640, y: 150, w: 746, h: 1695 },          // vial, reflection trimmed
  // opaque zones in CROP coordinates
  label: { x0: 42, x1: 704, y0: 670, y1: 1426 },
  metal: [{ x0: 46, x1: 702, y0: 18, y1: 205 }, { x0: 94, x1: 652, y0: 205, y1: 345 }],
};

const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage();
const { blank, alpha } = await p.evaluate(async ({ url, CFG }) => {
  const img = new Image(); img.src = url; await img.decode();
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  const W = c.width;

  // 1) erase
  const d = g.getImageData(0, 0, W, c.height); const px = d.data;
  const { erase: ex, band } = CFG;
  for (let x = ex.x0; x < ex.x1; x++) {
    let r = 0, gg = 0, bb = 0, n = 0;
    for (let y = band.y0; y < band.y1; y++) { const i = (y * W + x) * 4; r += px[i]; gg += px[i + 1]; bb += px[i + 2]; n++; }
    r /= n; gg /= n; bb /= n;
    for (let y = ex.y0; y < ex.y1; y++) {
      const i = (y * W + x) * 4; const k = (Math.random() - 0.5) * 1.4;
      px[i] = r + k; px[i + 1] = gg + k; px[i + 2] = bb + k;
    }
  }
  g.putImageData(d, 0, 0);

  // 2) crop
  const { crop } = CFG;
  const o = document.createElement("canvas"); o.width = crop.w; o.height = crop.h;
  const og = o.getContext("2d");
  og.drawImage(c, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
  const blank = o.toDataURL("image/jpeg", 0.92);

  // 3) backdrop → alpha
  const od = og.getImageData(0, 0, crop.w, crop.h); const q = od.data;
  // measure the backdrop from the crop's top corners
  const bgs = [[3, 3], [crop.w - 4, 3]].map(([x, y]) => { const i = (y * crop.w + x) * 4; return [q[i], q[i + 1], q[i + 2]]; });
  const B = [0, 1, 2].map((k) => Math.max(...bgs.map((v) => v[k])) + 1);
  const inBox = (x, y, r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;
  for (let y = 0; y < crop.h; y++) for (let x = 0; x < crop.w; x++) {
    const i = (y * crop.w + x) * 4;
    if (inBox(x, y, CFG.label)) { q[i + 3] = 255; continue; }
    const lum = (q[i] + q[i + 1] + q[i + 2]) / 3;
    if (CFG.metal.some((r) => inBox(x, y, r))) { q[i + 3] = lum >= (B[0] + B[1] + B[2]) / 3 - 4 ? 0 : 255; continue; }
    let a = 0;
    for (let k = 0; k < 3; k++) a = Math.max(a, (B[k] - q[i + k]) / B[k]);
    if (a < 0.03) { q[i + 3] = 0; continue; }
    a = Math.min(1, a * 1.3);
    for (let k = 0; k < 3; k++) q[i + k] = Math.max(0, Math.min(255, B[k] - (B[k] - q[i + k]) / a));
    q[i + 3] = Math.round(a * 255);
  }
  og.putImageData(od, 0, 0);
  return { blank, alpha: o.toDataURL("image/webp", 0.92) };
}, { url, CFG });

writeFileSync(root + "design/vial-blank.jpg", Buffer.from(blank.split(",")[1], "base64"));
writeFileSync(root + "public/vial/vial.webp", Buffer.from(alpha.split(",")[1], "base64"));
if (preview) {
  await p.setViewportSize({ width: 900, height: 900 });
  await p.setContent(`<body style="margin:0;display:flex">
    <div style="flex:1;height:900px;background:#CCD8E4;display:grid;place-items:center"><img src="${alpha}" style="height:840px"></div>
    <div style="flex:1;height:900px;background:linear-gradient(160deg,#6A84A0,#33475F);display:grid;place-items:center"><img src="${alpha}" style="height:840px"></div></body>`);
  await p.screenshot({ path: preview });
}
console.log("wrote design/vial-blank.jpg and public/vial/vial.webp");
await b.close();
