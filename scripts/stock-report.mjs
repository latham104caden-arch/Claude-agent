#!/usr/bin/env node
/**
 * Read-only stock report: what Ikonik (our 3PL) actually holds, per catalogue SKU.
 *
 * The site itself has no stock data — data/products.ts hardcodes `inStock: true`
 * on every variant — so ShipStation is the only place real quantities exist.
 * This script reads them. It never writes: GET requests only.
 *
 *   SHIPSTATION_API_KEY=... SHIPSTATION_API_SECRET=... node scripts/stock-report.mjs
 *   node scripts/stock-report.mjs --json     # machine-readable
 *   node scripts/stock-report.mjs --probe    # just show which endpoints answer
 *
 * Credentials: ShipStation → Settings → Account → API Settings. Same pair
 * lib/shipstation.ts uses. Pass them in the environment; never commit them.
 *
 * ShipStation's inventory endpoints vary by account plan, so the script tries
 * each known shape and reports which one answered rather than assuming. If none
 * do, it says so and prints what the API returned instead of failing silently.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const API = "https://ssapi.shipstation.com";
const args = new Set(process.argv.slice(2));
const JSON_OUT = args.has("--json");
const PROBE_ONLY = args.has("--probe");

const KEY = process.env.SHIPSTATION_API_KEY;
const SECRET = process.env.SHIPSTATION_API_SECRET;
if (!KEY || !SECRET) {
  console.error("stock-report: set SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET.");
  process.exit(2);
}

/* ---------- catalogue SKUs (mirrors data/products.ts + lib/sku.ts) ---------- */

/** Pull an array literal out of a .ts source by its declaration. */
function arrayLiteral(src, declRe) {
  const m = src.match(declRe);
  if (!m) return null;
  const eq = src.indexOf("=", m.index + m[0].length - 1);
  let i = src.indexOf("[", eq), depth = 0;
  const start = i;
  for (; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]" && !--depth) return src.slice(start, i + 1);
  }
  return null;
}

const productsSrc = readFileSync(join(root, "data/products.ts"), "utf8");
const ROWS = eval(arrayLiteral(productsSrc, /const ROWS\s*:\s*Row\[\]\s*=/));

const renamesSrc = readFileSync(join(root, "data/sku-renames.ts"), "utf8");
const renamesBody = renamesSrc.slice(renamesSrc.indexOf("{", renamesSrc.indexOf("SKU_RENAMES")));
const SKU_RENAMES = eval("(" + renamesBody.slice(0, renamesBody.indexOf("};") + 1) + ")");

const rawSku = (slug, option) => `RR-${slug.toUpperCase()}-${option.replace(/[\s/]+/g, "").toUpperCase()}`;
const currentSku = (sku) => (Object.hasOwn(SKU_RENAMES, sku) ? SKU_RENAMES[sku] : sku);

/** Every variant we sell, keyed by the SKU the warehouse should see. */
const variants = ROWS.flatMap((r) =>
  r.sizes.map(([option]) => {
    const original = rawSku(r.slug, option);
    return { slug: r.slug, name: r.name, option, original, sku: currentSku(original) };
  }),
);

/* ---------- ShipStation ---------- */

/** One GET. 40 requests a minute; on a 429 wait out the window once, then retry. */
async function get(path, retried = false) {
  const auth = Buffer.from(`${KEY}:${SECRET}`).toString("base64");
  const res = await fetch(`${API}${path}`, { headers: { authorization: `Basic ${auth}` } });
  if (res.status === 429 && !retried) {
    const wait = Math.min(60, Math.max(1, Number(res.headers.get("x-rate-limit-reset")) || 30));
    await new Promise((r) => setTimeout(r, wait * 1000));
    return get(path, true);
  }
  const text = await res.text().catch(() => "");
  if (!res.ok) return { ok: false, status: res.status, body: text.slice(0, 300) };
  try { return { ok: true, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: false, status: res.status, body: "non-JSON response" }; }
}

/**
 * Candidate inventory sources, best first. `rows` pulls the array out of a
 * response; `norm` maps one row to { sku, onHand, available, allocated, name }.
 */
const SOURCES = [
  {
    name: "inventory",
    path: (page) => `/inventory?page=${page}&pageSize=500`,
    rows: (d) => d?.inventory ?? d?.inventoryItems ?? (Array.isArray(d) ? d : null),
    norm: (r) => ({
      sku: r.sku, name: r.productName ?? r.name ?? null,
      onHand: num(r.onHand ?? r.quantityOnHand ?? r.onhand),
      available: num(r.available ?? r.availableQuantity ?? r.quantityAvailable),
      allocated: num(r.allocated ?? r.allocatedQuantity),
    }),
  },
  {
    name: "products",
    path: (page) => `/products?page=${page}&pageSize=500`,
    rows: (d) => d?.products ?? null,
    norm: (r) => ({
      sku: r.sku, name: r.name ?? null,
      onHand: num(r.quantityOnHand ?? r.onHand),
      available: num(r.quantityAvailable ?? r.available),
      allocated: num(r.quantityAllocated ?? r.allocated),
    }),
  },
];

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

async function probe() {
  const results = [];
  for (const s of SOURCES) {
    const res = await get(s.path(1));
    const rows = res.ok ? s.rows(res.data) : null;
    results.push({
      source: s.name, path: s.path(1), status: res.status,
      usable: !!rows, rowCount: rows?.length ?? 0,
      sampleFields: rows?.[0] ? Object.keys(rows[0]).slice(0, 18) : null,
      error: res.ok ? null : res.body,
    });
  }
  return results;
}

/** Page through the first source that answers with rows. */
async function fetchStock() {
  for (const s of SOURCES) {
    const first = await get(s.path(1));
    if (!first.ok) continue;
    const firstRows = s.rows(first.data);
    if (!firstRows) continue;

    const all = [...firstRows];
    const pages = Number(first.data?.pages ?? 1) || 1;
    for (let p = 2; p <= pages; p++) {
      const next = await get(s.path(p));
      if (!next.ok) break;
      all.push(...(s.rows(next.data) ?? []));
    }
    return { source: s.name, rows: all.map(s.norm).filter((r) => r.sku) };
  }
  return null;
}

/* ---------- report ---------- */

const fmt = (v) => (v === null || Number.isNaN(v) ? "—" : String(v));

(async () => {
  if (PROBE_ONLY) {
    const p = await probe();
    console.log(JSON.stringify(p, null, 2));
    process.exit(p.some((r) => r.usable) ? 0 : 1);
  }

  const stock = await fetchStock();
  if (!stock) {
    console.error("stock-report: no ShipStation endpoint returned inventory rows.");
    console.error("Run with --probe to see what each endpoint answered, and send me that output.");
    const p = await probe();
    console.error(JSON.stringify(p, null, 2));
    process.exit(1);
  }

  const bySku = new Map(stock.rows.map((r) => [r.sku, r]));
  const matched = variants.map((v) => ({ ...v, stock: bySku.get(v.sku) ?? null }));
  const known = matched.filter((v) => v.stock);
  const unknown = matched.filter((v) => !v.stock);
  const catalogueSkus = new Set(variants.map((v) => v.sku));
  const extra = stock.rows.filter((r) => !catalogueSkus.has(r.sku));

  if (JSON_OUT) {
    console.log(JSON.stringify({ source: stock.source, matched, unknownToShipStation: unknown, notInCatalogue: extra }, null, 2));
    return;
  }

  console.log(`Stock from ShipStation (source: /${stock.source}) — ${stock.rows.length} rows\n`);

  const w = Math.max(...variants.map((v) => v.sku.length), 10);
  console.log(`${"SKU".padEnd(w)}  ${"ON HAND".padStart(8)}  ${"AVAIL".padStart(7)}  ${"ALLOC".padStart(6)}  PRODUCT`);
  console.log("-".repeat(w + 40));
  for (const v of known.sort((a, b) => (a.stock.available ?? 0) - (b.stock.available ?? 0))) {
    console.log(
      `${v.sku.padEnd(w)}  ${fmt(v.stock.onHand).padStart(8)}  ${fmt(v.stock.available).padStart(7)}  ` +
      `${fmt(v.stock.allocated).padStart(6)}  ${v.name} (${v.option})`,
    );
  }

  const out = known.filter((v) => (v.stock.available ?? 0) <= 0);
  console.log(`\nIn ShipStation: ${known.length} of ${variants.length} catalogue variants.`);
  if (out.length) {
    console.log(`\nAT OR BELOW ZERO (${out.length}) — the site still sells these as in stock:`);
    for (const v of out) console.log(`  ${v.sku}  ${v.name} (${v.option})`);
  }

  if (unknown.length) {
    console.log(`\nShipStation has no record of these ${unknown.length} catalogue SKUs:`);
    for (const v of unknown) {
      const note = v.sku === v.original ? "" : `  (renamed from ${v.original})`;
      console.log(`  ${v.sku}  ${v.name} (${v.option})${note}`);
    }
    if (!Object.keys(SKU_RENAMES).length) {
      console.log("\n  data/sku-renames.ts is empty, so these are still RR- SKUs. Ikonik picks by VSC-.");
    }
  }

  if (extra.length) {
    console.log(`\nIn ShipStation but not in the catalogue (${extra.length}):`);
    for (const r of extra.slice(0, 40)) console.log(`  ${r.sku}  ${r.name ?? ""}  available=${fmt(r.available)}`);
    if (extra.length > 40) console.log(`  … and ${extra.length - 40} more`);
  }
})().catch((e) => { console.error("stock-report:", e.message); process.exit(1); });
