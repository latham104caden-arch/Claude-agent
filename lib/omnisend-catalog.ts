/**
 * Site catalog → Omnisend's product catalog (owner-approved Omnisend). IDs match
 * the events the site already sends: product ID = slug, variant ID = SKU, so
 * cart, checkout and order events line up with these products in Omnisend's
 * product blocks, recommendations and segments.
 */
import { getCatalog, getCategories } from "./catalog";
import { isMarketed } from "./marketing";
import { productImage } from "./seo";
import { SITE } from "./site";
import type { Product } from "./types";

const API = "https://api.omnisend.com/v5";
const PARALLEL = 5;

const status = (inStock: boolean) => (inStock ? "inStock" : "outOfStock");

export function omnisendProduct(p: Product) {
  const url = `${SITE.url}/product/${p.slug}`;
  const image = productImage(p);
  const known = new Set(getCategories().map((c) => c.slug));
  return {
    id: p.slug,
    title: p.name,
    status: status(p.variants.some((v) => v.inStock)),
    currency: "USD",
    url,
    description: `${p.description} For laboratory research use only.`.slice(0, 1000),
    defaultImageUrl: image,
    images: [image],
    ...(known.has(p.category) ? { categoryIDs: [p.category] } : {}),
    tags: [p.category, p.subtitle].filter(Boolean),
    type: p.subtitle.slice(0, 100),
    vendor: SITE.name,
    variants: p.variants.map((v) => ({
      id: v.sku,
      sku: v.sku,
      title: v.option,
      price: v.price,
      ...(v.compareAt ? { strikeThroughPrice: v.compareAt } : {}),
      status: status(v.inStock),
      url,
      defaultImageUrl: image,
    })),
  };
}

type Call = { ok: boolean; status: number; body: unknown };

async function call(key: string, method: string, path: string, body?: unknown): Promise<Call> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "content-type": "application/json", accept: "application/json", "X-API-KEY": key },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => null) };
}

/** Create, or update in place (`existing` method) when the ID is already there. */
async function upsert(key: string, collection: string, id: string, body: unknown, existing: "PUT" | "PATCH"): Promise<Call> {
  const path = `/${collection}/${encodeURIComponent(id)}`;
  const found = await call(key, "GET", path);
  return found.ok ? call(key, existing, path, body) : call(key, "POST", `/${collection}`, body);
}

export type SyncResult = { products: number; categories: number; retired: number; failed: string[] };

/**
 * Pushes every category and every marketed product (lib/marketing.ts).
 * Anything else already in Omnisend is marked "notAvailable" (never deleted), so old
 * emails and order history keep working but they stop being recommended.
 */
export async function syncCatalog(key: string): Promise<SyncResult> {
  const failed: string[] = [];
  let categories = 0, products = 0, retired = 0;

  for (const c of getCategories()) {
    const r = await upsert(key, "product-categories", c.slug, { categoryID: c.slug, title: c.name }, "PATCH");
    if (r.ok) categories++;
    else failed.push(`category ${c.slug} (${r.status})`);
  }

  const catalog = getCatalog().filter(isMarketed);
  for (let i = 0; i < catalog.length; i += PARALLEL) {
    await Promise.all(catalog.slice(i, i + PARALLEL).map(async (p) => {
      const r = await upsert(key, "products", p.slug, omnisendProduct(p), "PUT");
      if (r.ok) products++;
      else failed.push(`${p.slug} (${r.status})`);
    }));
  }

  // Retire products that left the site.
  const live = new Set(catalog.map((p) => p.slug));
  for (let offset = 0; ; offset += 100) {
    const page = await call(key, "GET", `/products?limit=100&offset=${offset}`);
    const list = ((page.body as { products?: Record<string, unknown>[] } | null)?.products ?? []);
    for (const old of list) {
      const id = String(old.id ?? "");
      if (!id || live.has(id) || old.status === "notAvailable") continue;
      const variants = Array.isArray(old.variants) ? old.variants.map((v: Record<string, unknown>) => ({ ...v, status: "notAvailable" })) : [];
      const r = await call(key, "PUT", `/products/${encodeURIComponent(id)}`, { ...old, status: "notAvailable", variants });
      if (r.ok) retired++;
      else failed.push(`retire ${id} (${r.status})`);
    }
    if (list.length < 100) break;
  }

  return { products, categories, retired, failed };
}
