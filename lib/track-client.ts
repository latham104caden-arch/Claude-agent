"use client";

/**
 * Browser-side shopper tracking:
 *  1. Funnel counts for the team dashboard (POST /api/track, random session id,
 *     no personal data).
 *  2. Omnisend's standard events ("viewed product", "added product to cart",
 *     "started checkout") so its browse/cart/checkout abandonment automations can
 *     trigger. Omnisend only keeps these for contacts it has identified (from a
 *     form, an email click, or a past order).
 */
import type { CartLine } from "./types";

const SITE = "https://revisedresearch.com";
const SID_KEY = "rr-sid";
const IDLE_MS = 30 * 60_000;

/** Session id that rolls over after 30 minutes of inactivity. */
export function sessionId(): string {
  try {
    const raw = JSON.parse(localStorage.getItem(SID_KEY) || "null") as { id: string; at: number } | null;
    const id = raw && Date.now() - raw.at < IDLE_MS ? raw.id : Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    localStorage.setItem(SID_KEY, JSON.stringify({ id, at: Date.now() }));
    return id;
  } catch {
    return "anon" + Math.random().toString(36).slice(2, 12);
  }
}

function beacon(body: object) {
  const data = JSON.stringify({ ...body, sid: sessionId() });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([data], { type: "text/plain" }))) return;
  } catch {}
  fetch("/api/track", { method: "POST", body: data, keepalive: true }).catch(() => {});
}

function omnisend(event: string, properties: Record<string, unknown>) {
  const w = window as unknown as { omnisend?: { push: (cmd: unknown[]) => number } };
  const q = (w.omnisend ??= [] as unknown as { push: (cmd: unknown[]) => number });
  q.push(["track", event, { origin: "api", eventID: crypto.randomUUID?.() ?? String(Date.now()), properties }]);
}

const cartId = () => `cart-${sessionId()}`;
const item = (l: Pick<CartLine, "slug" | "sku" | "name" | "option" | "price">, qty: number) => ({
  productID: l.slug,
  productTitle: l.name,
  productVariantID: l.sku,
  productVariantTitle: l.option,
  productSKU: l.sku,
  productPrice: l.price,
  productQuantity: qty,
  productURL: `${SITE}/product/${l.slug}`,
});
const value = (lines: CartLine[]) => Math.round(lines.reduce((n, l) => n + l.price * l.qty, 0) * 100) / 100;

export function trackPage() { beacon({ type: "page" }); }

/** Product page view. Product details are read from the page's own product meta tags. */
export function trackProductView(slug: string) {
  beacon({ type: "view", slug });
  const meta = (p: string) => document.querySelector<HTMLMetaElement>(`meta[property="${p}"]`)?.content;
  const price = Number(meta("product:price:amount"));
  omnisend("viewed product", {
    product: {
      id: slug,
      title: (meta("og:title") ?? document.title).split(" | ")[0],
      price: Number.isFinite(price) ? price : undefined,
      currency: "USD",
      url: `${SITE}/product/${slug}`,
      imageUrl: meta("og:image"),
    },
  });
}

export function trackAddToCart(line: Omit<CartLine, "qty">, qty: number, cartAfter: CartLine[]) {
  beacon({ type: "add", slug: line.slug, qty });
  omnisend("added product to cart", {
    abandonedCheckoutURL: `${SITE}/cart`,
    cartID: cartId(),
    value: value(cartAfter),
    currency: "USD",
    addedItem: item(line, qty),
    lineItems: cartAfter.map((l) => item(l, l.qty)),
  });
}

/** Checkout start: the funnel count is recorded server-side by /api/checkout; this is the Omnisend event. */
export function trackCheckoutStarted(lines: CartLine[]) {
  omnisend("started checkout", {
    abandonedCheckoutURL: `${SITE}/cart`,
    cartID: cartId(),
    value: value(lines),
    currency: "USD",
    lineItems: lines.map((l) => item(l, l.qty)),
  });
}
