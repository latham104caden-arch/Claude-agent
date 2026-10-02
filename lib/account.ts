import type Stripe from "stripe";
import { getCatalog } from "./catalog";
import { getStripe } from "./stripe";
import type { CartLine } from "./types";

export type OrderItem = { name: string; qty: number; amount: number; sku: string | null };
export type Order = {
  id: string;
  number: string;
  date: string;
  total: number;
  status: string;
  shipTo: string | null;
  items: OrderItem[];
  /** Lines still sold today, priced from the current catalog (for Reorder). */
  reorder: CartLine[];
};

/** A shopper's paid orders, newest first, straight from Stripe (no local copy). */
export async function ordersFor(email: string, limit = 10): Promise<Order[] | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  const sessions = await stripe.checkout.sessions.list({ customer_details: { email }, limit: 30 });
  const paid = sessions.data.filter((s) => s.payment_status === "paid").slice(0, limit);

  const bySku = new Map<string, CartLine>();
  for (const p of getCatalog()) for (const v of p.variants) {
    if (v.inStock) bySku.set(v.sku, { sku: v.sku, slug: p.slug, name: p.name, option: v.option, price: v.price, qty: 1 });
  }

  return Promise.all(paid.map(async (s) => {
    const li = await stripe.checkout.sessions.listLineItems(s.id, { limit: 50, expand: ["data.price.product"] });
    const items: OrderItem[] = li.data.map((l) => {
      const product = l.price?.product;
      const sku = product && typeof product === "object" && "metadata" in product ? product.metadata?.sku ?? null : null;
      return { name: l.description ?? "Item", qty: l.quantity ?? 1, amount: (l.amount_total ?? 0) / 100, sku };
    });
    const reorder = items.flatMap((i) => {
      const line = i.sku ? bySku.get(i.sku) : undefined;
      return line ? [{ ...line, qty: i.qty }] : [];
    });
    return {
      id: s.id,
      number: s.id.slice(-8).toUpperCase(),
      date: new Date(s.created * 1000).toISOString(),
      total: (s.amount_total ?? 0) / 100,
      status: orderStatus(s),
      shipTo: shipTo(s),
      items,
      reorder,
    };
  }));
}

function orderStatus(s: Stripe.Checkout.Session): string {
  return s.status === "complete" ? "Paid" : "Processing";
}

function shipTo(s: Stripe.Checkout.Session): string | null {
  const d = s.collected_information?.shipping_details ?? null;
  const a = d?.address;
  if (!a) return null;
  return [d?.name, a.line1, a.line2, `${a.city ?? ""}, ${a.state ?? ""} ${a.postal_code ?? ""}`.trim()].filter(Boolean).join(" · ");
}
