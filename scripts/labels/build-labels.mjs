// Renders flat vial-label PNGs (no vial) in the Revised label style:
// category-colored gradient, name + strength pill top left, purity pill and
// "U.S. Synthesized" bottom left, vertical REVISED wordmark on the right.
//
//   node scripts/labels/build-labels.mjs
//
// Label size is 1.75 in × 0.75 in. Layout is drawn at 300 px/in (525×225)
// and rendered at 2x, so each PNG is 1050×450 px = 600 dpi, with the DPI
// written into the file so it opens at print size. Also writes
// design/labels/overview-<category>.png contact sheets for review.
// Needs playwright-core + Chromium (CHROME_PATH to override). If
// playwright-core lives elsewhere, copy this file there and set REPO_ROOT.
//
// Products, sizes and label colors come from the live catalog (lib/catalog.ts):
// one label per product per size, bundles skipped. Names are checked against
// data/ruo-banned.json and the build refuses any hit; GLP-coded listings are
// never labelled.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { crc32 } from "node:zlib";
import { join } from "node:path";

const ROOT = process.env.REPO_ROOT ?? new URL("../../", import.meta.url).pathname;
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT = join(ROOT, "design/labels");

// Label palettes (print assets, not site UI): edge, sheen, body, dark end.
// Keyed by the product's photo accent, so each label matches its vial on the site.
const PALETTES = {
  repair: ["#3E8A89", "#6FB8B6", "#3C7F7F", "#264A4D"],
  metabolic: ["#34507C", "#52709C", "#2A3F66", "#1D2740"],
  cognitive: ["#5A1F24", "#7C4A4F", "#4A1A1E", "#261B1D"],
  nasal: ["#5A1F24", "#7C4A4F", "#4A1A1E", "#261B1D"],
  supply: ["#E9ECEF", "#FFFFFF", "#F4F5F7", "#DADDE2"],
};
const CATEGORY_NAMES = {
  "repair-immune": "Repair & Immune", "metabolic-gh": "Metabolic & GH", "cognitive-longevity": "Cognitive & Longevity",
  nasal: "Nasal Research", supplies: "Lab Supplies",
};

const catalog = JSON.parse(execFileSync("npx", ["tsx", "-e",
  'import { getCatalog } from "./lib/catalog.ts"; console.log(JSON.stringify(getCatalog().map((p) => ({ slug: p.slug, name: p.name, category: p.category, accent: p.accent, sizes: p.variants.map((v) => v.option) }))))',
], { cwd: ROOT, encoding: "utf8" }));
const NEVER = /glp|retatrutide|semaglutide|tirzepatide|liraglutide/i;
const CATEGORIES = Object.entries(CATEGORY_NAMES).map(([slug, name]) => ({
  slug, name,
  items: catalog.filter((p) => p.category === slug && !NEVER.test(p.slug + " " + p.name))
    .flatMap((p) => p.sizes.map((size) => ({ slug: p.slug, name: p.name, size: size.replace(/\s+/g, ""), tone: p.accent ?? "metabolic" }))),
})).filter((c) => c.items.length);

const banned = JSON.parse(readFileSync(join(ROOT, "data/ruo-banned.json"), "utf8"));
const bannedList = (Array.isArray(banned) ? banned : Object.values(banned).flat()).map((s) => String(s).toLowerCase());
for (const c of CATEGORIES) for (const { name: n } of c.items) {
  if (bannedList.some((b) => n.toLowerCase().includes(b))) throw new Error(`Banned name in label list: ${n}`);
}

const slugify = (s) => s.toLowerCase().replace(/\+/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const inter = readFileSync(join(ROOT, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")).toString("base64");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// 1pt = 300/72 ≈ 4.17px at this scale. Smallest print text here is ~4.5pt.
const CSS = `
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${inter}) format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
body { background: transparent; font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; }
.label { position: relative; width: 525px; height: 225px; overflow: hidden; color: #fff;
  background:
    linear-gradient(180deg, rgba(255,255,255,.06) 0%, transparent 22%, transparent 78%, rgba(0,0,0,.14) 100%),
    linear-gradient(90deg, transparent 5%, rgba(255,255,255,.16) 13%, transparent 26%),
    linear-gradient(90deg, var(--c0) 0%, var(--c1) 14%, var(--c2) 45%, var(--c3) 100%); }
.top { position: absolute; left: 22px; top: 18px; width: 300px; }
.name { font-weight: 700; letter-spacing: -.01em; line-height: 1.04; white-space: nowrap; }
.name.wrap { white-space: normal; }
.label--supply, .label--supply .word { color: #16191D; }
.label--supply .pill { background: #fff; border: 1.5px solid #9AA1AA; line-height: 28px; }
.row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.pill { background: #fff; color: #3A3F47; font-size: 20px; font-weight: 600; height: 31px; line-height: 31px; padding: 0 11px; border-radius: 10px; }
.purity { font-size: 14px; font-weight: 500; height: 26px; line-height: 23px; padding: 0 9px; border: 1.5px solid rgba(255,255,255,.85); border-radius: 999px; }
.bottom { position: absolute; left: 22px; bottom: 16px; }
.made { font-size: 18px; font-weight: 600; }
.ruo { margin-top: 3px; font-size: 14px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; opacity: .7; }
/* Reads bottom to top, like the vials on the site. Sits just right of the
   text block (~1.2 in from the left edge) so it stays on the front of the vial. */
.word { position: absolute; left: 362px; top: 50%; transform: translate(-50%, -50%) rotate(-90deg); white-space: nowrap; line-height: 1;
  font-size: 44px; font-weight: 800; letter-spacing: .05em; color: #fff; }
`;

const labelHtml = ({ name, size, tone }) => {
  const c = PALETTES[tone] ?? PALETTES.metabolic;
  const supply = tone === "supply";
  return `
<div class="label${supply ? " label--supply" : ""}" style="--c0:${c[0]};--c1:${c[1]};--c2:${c[2]};--c3:${c[3]}">
  <div class="top"><div class="name">${esc(supply ? name.toUpperCase() : name)}</div>
    <div class="row"><span class="pill">${esc(size)}</span>${supply ? "" : '<span class="purity">99% Purity</span>'}</div></div>
  <div class="bottom"><div class="made">${supply ? "Multi-use" : "U.S. Synthesized"}</div><div class="ruo">Research use only</div></div>
  <div class="word">REVISED</div>
</div>`;
};

// Fit each name on one line: 44px (~10.5pt) down to 26px (~6.2pt).
const FIT = `for (const el of document.querySelectorAll('.name')) {
  const max = el.parentElement.clientWidth; let s = 44; el.style.fontSize = s + 'px';
  while (el.scrollWidth > max && s > 26) { s -= 1; el.style.fontSize = s + 'px'; }
  if (el.scrollWidth > max) { // two lines, as the site does for long names
    el.classList.add('wrap'); s = 34; el.style.fontSize = s + 'px';
    while ((el.scrollWidth > max || el.clientHeight > s * 1.04 * 2 + 1) && s > 22) { s -= 1; el.style.fontSize = s + 'px'; }
    if (el.scrollWidth > max || el.clientHeight > s * 1.04 * 2 + 1) throw new Error('Name too long for label: ' + el.textContent);
  }
}`;

// Stamp 600 dpi into the PNG (pHYs chunk right after IHDR).
const withDpi = (png, dpi) => {
  const ppm = Math.round(dpi / 0.0254);
  const data = Buffer.alloc(9); data.writeUInt32BE(ppm, 0); data.writeUInt32BE(ppm, 4); data[8] = 1;
  const type = Buffer.from("pHYs");
  const len = Buffer.alloc(4); len.writeUInt32BE(9);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([type, data])) >>> 0);
  return Buffer.concat([png.subarray(0, 33), len, type, data, crc, png.subarray(33)]);
};

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 525, height: 225 }, deviceScaleFactor: 2 });
let count = 0;
for (const c of CATEGORIES) {
  rmSync(join(OUT, c.slug), { recursive: true, force: true });
  mkdirSync(join(OUT, c.slug), { recursive: true });
  for (const item of c.items) {
    await page.setContent(`<style>${CSS}</style>${labelHtml(item)}`);
    await page.evaluate(FIT);
    const png = await page.locator(".label").screenshot();
    writeFileSync(join(OUT, c.slug, `${item.slug.toLowerCase()}-${slugify(item.size)}.png`), withDpi(png, 600));
    count++;
  }
  // Contact sheet for review.
  const sheet = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 1 });
  await sheet.setContent(`<style>${CSS}
    body { background: #F2F4F7; padding: 40px; } h1 { font: 700 28px Inter; color: #223044; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 315px); gap: 18px; }
    .cell { width: 315px; height: 135px; overflow: hidden; border-radius: 4px; box-shadow: 0 6px 18px rgba(0,0,0,.12); }
    .cell .label { transform: scale(.6); transform-origin: 0 0; }</style>
    <h1>${esc(c.name)} · ${c.items.length} labels · 1.75 × 0.75 in</h1>
    <div class="grid">${c.items.map((i) => `<div class="cell">${labelHtml(i)}</div>`).join("")}</div>`);
  await sheet.evaluate(FIT);
  await sheet.screenshot({ path: join(OUT, `overview-${c.slug}.png`), fullPage: true });
  await sheet.close();
}
// Every label as one PDF page at print size (vector text), for Canva import.
const all = CATEGORIES.flatMap((c) => c.items);
const pdfPage = await browser.newPage();
await pdfPage.setContent(`<style>${CSS} @page { size: 1.75in 0.75in; margin: 0; }
  .label { page-break-after: always; break-after: page; }</style>${all.map(labelHtml).join("")}`);
await pdfPage.evaluate(FIT);
// Layout is 300 px/in; CSS px are 96/in, so scale to print size.
await pdfPage.pdf({ path: join(OUT, "revised-labels.pdf"), width: "1.75in", height: "0.75in", printBackground: true, scale: 96 / 300 });
await pdfPage.close();
await browser.close();
console.log(`wrote ${count} labels to ${OUT}`);
