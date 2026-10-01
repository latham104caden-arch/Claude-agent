import { getCatalog } from "./catalog";
import { SITE } from "./site";
import type { Product, Variant } from "./types";

export type PricedLine = { product: Product; variant: Variant; qty: number };

/**
 * Re-prices a cart from the catalog. The browser only says which SKUs and how
 * many; every price comes from here, never from the client.
 */
export function priceCart(input: unknown): { ok: true; lines: PricedLine[]; subtotal: number } | { ok: false; message: string } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, message: "Your cart is empty." };
  if (input.length > 60) return { ok: false, message: "Too many items in one order." };
  const bySku = new Map<string, { product: Product; variant: Variant }>();
  for (const product of getCatalog()) for (const variant of product.variants) bySku.set(variant.sku, { product, variant });

  const lines: PricedLine[] = [];
  for (const raw of input) {
    const sku = typeof raw?.sku === "string" ? raw.sku : "";
    const qty = Number(raw?.qty);
    const hit = bySku.get(sku);
    if (!hit) return { ok: false, message: "An item in your cart is no longer available. Please remove it and try again." };
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return { ok: false, message: `Check the quantity for ${hit.product.name}.` };
    if (!hit.variant.inStock) return { ok: false, message: `${hit.product.name} (${hit.variant.option}) is sold out.` };
    const same = lines.find((l) => l.variant.sku === sku);
    if (same) same.qty = Math.min(99, same.qty + qty);
    else lines.push({ ...hit, qty });
  }
  const subtotal = lines.reduce((n, l) => n + l.variant.price * l.qty, 0);
  return { ok: true, lines, subtotal };
}

/** Shipping in USD for a pre-discount subtotal (matches what the cart shows). */
export function shippingFor(subtotal: number): number {
  return subtotal >= SITE.freeShippingThreshold ? 0 : SITE.flatShipping;
}
