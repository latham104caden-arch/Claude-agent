// Produces a blank-label version of the supplied vial photo.
// 1) Erases the product name + size pill by copying, column by column, the
//    averaged clean label pixels from just above the text (keeps the label's
//    horizontal shading). 2) Crops tight to the vial.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";

const [src, out] = process.argv.slice(2);
const dataUrl = "data:image/jpeg;base64," + readFileSync(src).toString("base64");

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage();
const result = await p.evaluate(async (url) => {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);

  // Erase region (name + pill) and the clean sample band above it.
  const ex = { x0: 322, x1: 548, y0: 412, y1: 548 };
  const band = { y0: 388, y1: 404 };
  const W = c.width;
  const data = g.getImageData(0, 0, W, c.height);
  const px = data.data;
  for (let x = ex.x0; x < ex.x1; x++) {
    let r = 0, gg = 0, bb = 0, n = 0;
    for (let y = band.y0; y < band.y1; y++) {
      const i = (y * W + x) * 4; r += px[i]; gg += px[i + 1]; bb += px[i + 2]; n++;
    }
    r /= n; gg /= n; bb /= n;
    for (let y = ex.y0; y < ex.y1; y++) {
      const i = (y * W + x) * 4;
      // tiny noise so the fill matches the photo's grain
      const k = (Math.random() - 0.5) * 1.6;
      px[i] = r + k; px[i + 1] = gg + k; px[i + 2] = bb + k;
    }
  }
  g.putImageData(data, 0, 0);

  // Crop to the vial.
  const crop = { x: 268, y: 58, w: 412, h: 852 };
  const o = document.createElement("canvas");
  o.width = crop.w; o.height = crop.h;
  o.getContext("2d").drawImage(c, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
  return o.toDataURL("image/jpeg", 0.9);
}, dataUrl);
writeFileSync(out, Buffer.from(result.split(",")[1], "base64"));
console.log("wrote", out);
await b.close();
