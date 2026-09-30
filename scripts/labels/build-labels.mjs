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
// Strengths are placeholders until the owner confirms the real lineup.
// Names are checked against data/ruo-banned.json and the build refuses any hit.
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { crc32 } from "node:zlib";
import { join } from "node:path";

const ROOT = process.env.REPO_ROOT ?? new URL("../../", import.meta.url).pathname;
const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT = join(ROOT, "design/labels");

// Label palettes (print assets, not site UI): edge, sheen, body, dark end.
const CATEGORIES = [
  {
    slug: "repair-immune", name: "Repair & Immune", colors: ["#3E8A89", "#6FB8B6", "#3C7F7F", "#264A4D"],
    items: [
      ["BPC-157", "10mg"], ["TB-500", "10mg"], ["Thymosin Beta-4", "5mg"], ["GHK-Cu", "50mg"],
      ["KPV", "10mg"], ["LL-37", "5mg"], ["Thymosin Alpha-1", "10mg"], ["Thymalin", "10mg"],
      ["VIP", "5mg"], ["ARA-290", "10mg"], ["BPC-157 + TB-500", "20mg"], ["GLOW Blend", "70mg"],
      ["KLOW Blend", "80mg"],
    ],
  },
  {
    slug: "metabolic-gh", name: "Metabolic & GH", colors: ["#34507C", "#52709C", "#2A3F66", "#1D2740"],
    items: [
      ["CJC-1295 DAC", "5mg"], ["CJC-1295 No DAC", "5mg"], ["Sermorelin", "5mg"], ["Tesamorelin", "10mg"],
      ["Ipamorelin", "10mg"], ["GHRP-2", "10mg"], ["GHRP-6", "10mg"], ["Hexarelin", "5mg"],
      ["IGF-1 LR3", "1mg"], ["AOD-9604", "5mg"], ["HGH Frag 176-191", "5mg"], ["MOTS-c", "10mg"],
      ["SS-31", "10mg"], ["Humanin", "5mg"], ["CJC-1295 + Ipa", "10mg"],
    ],
  },
  {
    slug: "cognitive-longevity", name: "Cognitive & Longevity", colors: ["#5A1F24", "#7C4A4F", "#4A1A1E", "#261B1D"],
    items: [
      ["Semax", "10mg"], ["Selank", "10mg"], ["Dihexa", "10mg"], ["Pinealon", "10mg"], ["DSIP", "5mg"],
      ["Epitalon", "10mg"], ["FOXO4-DRI", "10mg"], ["PT-141", "10mg"], ["Melanotan I", "10mg"],
      ["Melanotan II", "10mg"], ["Kisspeptin-10", "10mg"], ["Oxytocin", "2mg"], ["Gonadorelin", "2mg"],
    ],
  },
];

const banned = JSON.parse(readFileSync(join(ROOT, "data/ruo-banned.json"), "utf8"));
const bannedList = (Array.isArray(banned) ? banned : Object.values(banned).flat()).map((s) => String(s).toLowerCase());
for (const c of CATEGORIES) for (const [n] of c.items) {
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
.stack { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; margin-top: 7px; }
.pill { background: #fff; color: #3A3F47; font-size: 23px; font-weight: 600; height: 35px; line-height: 35px; padding: 0 12px; border-radius: 11px; }
.purity { font-size: 16px; font-weight: 500; height: 30px; line-height: 27px; padding: 0 10px; border: 1.5px solid rgba(255,255,255,.85); border-radius: 999px; }
.bottom { position: absolute; left: 22px; bottom: 16px; }
.made { font-size: 21px; font-weight: 600; }
.ruo { margin-top: 3px; font-size: 16px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; opacity: .7; }
/* Sits just right of the text block (~1.1 in from the left edge) so it stays
   on the front of the vial instead of wrapping round the back. */
.word { position: absolute; left: 340px; top: 50%; transform: translateY(-50%); writing-mode: vertical-rl; line-height: 1;
  font-size: 37px; font-weight: 600; letter-spacing: .05em; color: rgba(255,255,255,.95); }
`;

const labelHtml = (c, [name, mg]) => `
<div class="label" style="--c0:${c.colors[0]};--c1:${c.colors[1]};--c2:${c.colors[2]};--c3:${c.colors[3]}">
  <div class="top"><div class="name">${esc(name)}</div>
    <div class="stack"><span class="pill">${esc(mg)}</span><span class="purity">99% Purity</span></div></div>
  <div class="bottom"><div class="made">U.S. Synthesized</div><div class="ruo">Research use only</div></div>
  <div class="word">REVISED</div>
</div>`;

// Fit each name on one line: 52px (~12.5pt) down to 28px (~6.7pt).
const FIT = `for (const el of document.querySelectorAll('.name')) {
  const max = el.parentElement.clientWidth; let s = 52; el.style.fontSize = s + 'px';
  while (el.scrollWidth > max && s > 28) { s -= 1; el.style.fontSize = s + 'px'; }
  if (el.scrollWidth > max) throw new Error('Name too long for label: ' + el.textContent);
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
  mkdirSync(join(OUT, c.slug), { recursive: true });
  for (const item of c.items) {
    await page.setContent(`<style>${CSS}</style>${labelHtml(c, item)}`);
    await page.evaluate(FIT);
    const png = await page.locator(".label").screenshot();
    writeFileSync(join(OUT, c.slug, `${slugify(item[0])}.png`), withDpi(png, 600));
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
    <div class="grid">${c.items.map((i) => `<div class="cell">${labelHtml(c, i)}</div>`).join("")}</div>`);
  await sheet.evaluate(FIT);
  await sheet.screenshot({ path: join(OUT, `overview-${c.slug}.png`), fullPage: true });
  await sheet.close();
}
await browser.close();
console.log(`wrote ${count} labels to ${OUT}`);
