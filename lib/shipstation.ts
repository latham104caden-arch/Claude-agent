import type Stripe from "stripe";
import { getCatalog } from "./catalog";

/**
 * Paid orders → ShipStation, where Ikonik (our 3PL, owner-approved 2026-10-20)
 * picks, packs and ships them. Needs SHIPSTATION_API_KEY and
 * SHIPSTATION_API_SECRET (ShipStation → Settings → Account → API Settings);
 * SHIPSTATION_STORE_ID optionally files orders under a specific store instead
 * of ShipStation's "Manual Orders" store. Stripe test-mode orders are skipped
 * unless SHIPSTATION_TEST_ORDERS=true (they're then marked "do not ship").
 *
 * Sent from the Stripe webhook once an order is paid. The orderKey is the
 * Stripe session ID, so ShipStation updates the same order on a retry instead
 * of creating a second one. Only what's needed to ship goes over: name, ship-to
 * address, phone, email and the items. Shipping notifications to customers are
 * ShipStation's/Ikonik's own settings; this site sends none.
 */

const API = "https://ssapi.shipstation.com";

export const shipStationReady = () => !!(process.env.SHIPSTATION_API_KEY && process.env.SHIPSTATION_API_SECRET);

const usd = (cents: number | null | undefined) => Math.round(cents ?? 0) / 100;

type Address = {
  name: string; company: string | null; street1: string; street2: string | null;
  city: string; state: string; postalCode: string; country: string; phone: string | null; residential: boolean;
};

type Item = { lineItemKey?: string; sku?: string; name: string; quantity: number; unitPrice: number; adjustment?: boolean };

/** The ShipStation order for a paid Checkout Session (expand line_items.data.price.product). */
export function shipStationOrder(s: Stripe.Checkout.Session) {
  const ship = s.collected_information?.shipping_details;
  const a = ship?.address ?? s.customer_details?.address;
  if (!a?.line1) throw new Error(`order ${s.id} has no shipping address`);
  const address: Address = {
    name: ship?.name || s.customer_details?.name || "",
    company: null,
    street1: a.line1,
    street2: a.line2 || null,
    city: a.city ?? "",
    state: a.state ?? "",
    postalCode: a.postal_code ?? "",
    country: a.country ?? "US",
    phone: s.customer_details?.phone ?? null,
    residential: true,
  };

  const items: Item[] = (s.line_items?.data ?? []).map((li) => {
    const product = li.price?.product;
    const sku = product && typeof product === "object" && "metadata" in product ? product.metadata?.sku : undefined;
    return { lineItemKey: li.id, ...(sku ? { sku } : {}), name: li.description ?? "Item", quantity: li.quantity ?? 1, unitPrice: usd(li.price?.unit_amount) };
  });

  const m = s.metadata ?? {};
  // If Stripe refused the free-gift line at checkout, the gift rides only in metadata: still pack it.
  if (m.gift_sku && m.gift_line === "missing") {
    const hit = getCatalog().flatMap((p) => p.variants.map((v) => ({ p, v }))).find(({ v }) => v.sku === m.gift_sku);
    items.push({ sku: m.gift_sku, name: `FREE GIFT: ${hit ? `${hit.p.name} (${hit.v.option})` : m.gift_sku}`, quantity: 1, unitPrice: 0 });
  }

  const discount = s.total_details?.amount_discount ?? 0;
  const code = m.reward_code || m.sale_code || m.first_order_code || m.mail_code || m.adz_code || (m.bogo_deal ? `BOGO, ${m.bogo_deal}` : "") || (m.partner_token ? "Research Partner kit" : "");
  if (discount) items.push({ name: `Discount${code ? ` (${code})` : ""}`, quantity: 1, unitPrice: -usd(discount), adjustment: true });

  const paidAt = new Date(s.created * 1000).toISOString();
  return {
    orderNumber: s.id.slice(-8).toUpperCase(),
    orderKey: s.id,
    orderDate: paidAt,
    paymentDate: paidAt,
    orderStatus: "awaiting_shipment",
    customerEmail: s.customer_details?.email ?? null,
    billTo: address,
    shipTo: address,
    items,
    amountPaid: usd(s.amount_total),
    taxAmount: usd(s.total_details?.amount_tax),
    shippingAmount: usd(s.total_details?.amount_shipping),
    paymentMethod: "Credit Card",
    requestedShippingService: (s.total_details?.amount_shipping ?? 0) ? "Standard shipping" : "Free shipping",
    internalNotes: `Stripe ${s.id}${s.livemode ? "" : " (TEST ORDER, do not ship)"}`,
    advancedOptions: {
      source: "revisedresearch.com",
      ...(process.env.SHIPSTATION_STORE_ID ? { storeId: Number(process.env.SHIPSTATION_STORE_ID) } : {}),
    },
  };
}

/**
 * Creates (or, on a retry, updates) the order in ShipStation. Throws on failure
 * so the webhook answers 500 and Stripe retries; does nothing until the keys are set.
 */
export async function sendToShipStation(s: Stripe.Checkout.Session): Promise<{ orderId: number } | null> {
  if (!shipStationReady() || s.payment_status !== "paid") return null;
  // Stripe test-mode orders never reach the warehouse unless the team turns this on to try the hookup.
  if (!s.livemode && process.env.SHIPSTATION_TEST_ORDERS !== "true") return null;
  const auth = Buffer.from(`${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`).toString("base64");
  const res = await fetch(`${API}/orders/createorder`, {
    method: "POST",
    headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
    body: JSON.stringify(shipStationOrder(s)),
  });
  if (!res.ok) throw new Error(`ShipStation ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  const data = (await res.json().catch(() => ({}))) as { orderId?: number };
  return { orderId: data.orderId ?? 0 };
}
