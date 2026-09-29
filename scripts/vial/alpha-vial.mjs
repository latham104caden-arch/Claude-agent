// White → alpha ("color to alpha") so the glass is genuinely see-through on any
// background, with the label and the cap/crimp forced opaque so they never go
// translucent on dark backdrops. Writes a WebP with alpha plus a dark-bg preview.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";

const [src, out, preview] = process.argv.slice(2);
const url = "data:image/jpeg;base64," + readFileSync(src).toString("base64");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage();
const dataUrl = await p.evaluate(async (url) => {
  const img = new Image(); img.src = url; await img.decode();
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height); const px = d.data; const W = c.width;
  // Opaque zones (crop coordinates): label, cap, crimp.
  const solid = [
    { x0: 48, x1: 358, y0: 315, y1: 685 },
    { x0: 58, x1: 350, y0: 30, y1: 108 },
    { x0: 80, x1: 331, y0: 112, y1: 176 },
  ];
  const zone = (x, y) => solid.findIndex((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1);
  for (let y = 0; y < c.height; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const z = zone(x, y);
    if (z === 0) { px[i + 3] = 255; continue; }            // label: always solid
    const lum = (px[i] + px[i + 1] + px[i + 2]) / 3;
    if (z > 0) { px[i + 3] = lum >= 251 ? 0 : 255; continue; } // metal: solid unless it's backdrop
    const r = px[i], gg = px[i + 1], bb = px[i + 2];
    let a = Math.max(255 - r, 255 - gg, 255 - bb) / 255;
    if (a < 0.025) { px[i + 3] = 0; continue; }
    a = Math.min(1, a * 1.35); // lift faint glass so edges read on dark backgrounds
    const un = (v) => Math.max(0, Math.min(255, 255 - (255 - v) / a));
    px[i] = un(r); px[i + 1] = un(gg); px[i + 2] = un(bb); px[i + 3] = Math.round(a * 255);
  }
  g.putImageData(d, 0, 0);
  return c.toDataURL("image/webp", 0.92);
}, url);
writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));

// Preview on light and dark backgrounds.
await p.setViewportSize({ width: 900, height: 900 });
await p.setContent(`<body style="margin:0;display:flex">
  <div style="flex:1;height:900px;background:#E4E8ED;display:grid;place-items:center"><img src="${dataUrl}" style="height:820px"></div>
  <div style="flex:1;height:900px;background:linear-gradient(160deg,#5A7089,#2B3748);display:grid;place-items:center"><img src="${dataUrl}" style="height:820px"></div></body>`);
await p.screenshot({ path: preview });
console.log("wrote", out);
await b.close();
