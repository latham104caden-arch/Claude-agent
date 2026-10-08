import type Stripe from "stripe";
import { getCatalog } from "./catalog";
import { codeOf } from "./metrics";
import { sendEvent, splitName, upsertContact } from "./omnisend";

const SITE = "https://revisedresearch.com";

/**
 * Paid buyer → Omnisend contact with name, phone and ship-to, tagged "customer".
 * Email-subscribed only when the checkout opt-in box was left ticked (it starts
 * ticked). Upserts by email, so the webhook and the thank-you page can both
 * call this safely.
 */
export async function saveCustomer(session: Stripe.Checkout.Session): Promise<void> {
  const c = session.customer_details;
  if (!c?.email || session.payment_status !== "paid") return;
  const ship = session.collected_information?.shipping_details;
  const a = ship?.address ?? c.address;
  await upsertContact({
    email: c.email.toLowerCase(),
    ...splitName(ship?.name || c.name),
    phone: c.phone,
    address: a ? { line1: a.line1, line2: a.line2, city: a.city, state: a.state, postalCode: a.postal_code, country: a.country } : null,
    tags: ["customer"],
    subscribe: session.metadata?.mkt_email === "yes",
    consentSource: "website checkout opt-in",
  });
}

/**
 * Stripe line items (session retrieved with line_items.data.price.product
 * expanded) → Omnisend's standard lineItems, matched to the catalog by SKU.
 * Prices are what Stripe actually charged per unit (bulk pricing included).
 */
export function omnisendLineItems(s: Stripe.Checkout.Session) {
  const bySku = new Map(getCatalog().flatMap((p) => p.variants.map((v) => [v.sku, { p, v }] as const)));
  return (s.line_items?.data ?? []).flatMap((li) => {
    const prod = li.price?.product;
    const sku = prod && typeof prod === "object" && "metadata" in prod ? prod.metadata?.sku : undefined;
    const hit = sku ? bySku.get(sku) : undefined;
    if (!hit) return [];
    const qty = li.quantity ?? 1;
    const price = (li.price?.unit_amount ?? Math.round(hit.v.price * 100)) / 100;
    return [{
      productID: hit.p.slug, productTitle: hit.p.name, productVariantID: hit.v.sku, productVariantTitle: hit.v.option, productSKU: hit.v.sku,
      productPrice: price, productQuantity: qty, productTotalPrice: Math.round(price * qty * 100) / 100,
      productURL: `${SITE}/product/${hit.p.slug}`,
      productImageURL: `${SITE}/email/vial-${hit.p.accent ?? "metabolic"}.png`,
    }];
  });
}

/**
 * Paid order → Omnisend "placed order" (its standard event), so total spent,
 * order count, purchase segments and revenue reporting work, and abandoned
 * checkout/cart flows stop for people who bought. Sent for every buyer (it
 * never changes their subscription). One event per order: the eventID is the
 * Stripe session, so the webhook, a retry and the past-buyer sync can't double it.
 */
export async function reportPlacedOrder(s: Stripe.Checkout.Session): Promise<boolean> {
  const email = s.customer_details?.email?.toLowerCase();
  if (!email || s.payment_status !== "paid") return false;
  const d = s.total_details;
  const ship = s.collected_information?.shipping_details;
  const a = ship?.address ?? s.customer_details?.address;
  const name = splitName(ship?.name || s.customer_details?.name);
  const { code } = codeOf(s.metadata);
  const discount = (d?.amount_discount ?? 0) / 100;
  return sendEvent("placed order", email, {
    orderID: s.id,
    createdAt: new Date(s.created * 1000).toISOString(),
    currency: (s.currency ?? "usd").toUpperCase(),
    paymentStatus: "paid",
    fulfillmentStatus: "unfulfilled",
    totalPrice: (s.amount_total ?? 0) / 100,
    subTotalPrice: (s.amount_subtotal ?? 0) / 100,
    totalDiscount: discount,
    totalTax: (d?.amount_tax ?? 0) / 100,
    shippingPrice: (d?.amount_shipping ?? 0) / 100,
    ...(code ? { discounts: [{ code, amount: discount, type: "fixedAmount" }] } : {}),
    lineItems: omnisendLineItems(s),
    ...(a ? { shippingAddress: { ...name, address1: a.line1 ?? "", address2: a.line2 ?? "", city: a.city ?? "", stateCode: a.state ?? "", zip: a.postal_code ?? "", country: a.country ?? "", phone: s.customer_details?.phone ?? "" } } : {}),
  }, `order-${s.id}`);
}
