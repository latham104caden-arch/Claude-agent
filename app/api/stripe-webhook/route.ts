import type Stripe from "stripe";
import { trackOrder, trackRefund } from "@adz/next";
import { saveCustomer } from "../../../lib/customers";
import { sendEvent } from "../../../lib/omnisend";
import { getCatalog } from "../../../lib/catalog";
import { getStripe } from "../../../lib/stripe";
import { syncRewards } from "../../../lib/rewards";
import { sendOrderConfirmation } from "../../../lib/email";
import { alertTeamNewOrder } from "../../../lib/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe → Developers → Webhooks: point an endpoint at /api/stripe-webhook with
 * checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.expired and charge.refunded, and put its signing secret in
 * STRIPE_WEBHOOK_SECRET.
 * Paid orders and refunds go to adz (deduped by payment id) for commissions.
 * A non-2xx reply makes Stripe retry, so adz failures return 500.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("not configured", { status: 503 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("bad signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = await stripe.checkout.sessions.retrieve(event.data.object.id, { expand: ["line_items.data.price.product"] });
      if (session.payment_status === "paid") {
        await alertTeamNewOrder(session).catch((err) => console.error("[stripe-webhook] team alert", err));
        await sendOrderConfirmation(session).catch((err) => console.error("[stripe-webhook] confirmation", err));
        await reportOrder(session);
        await saveCustomer(session);
        // Issue any $100 reward this order unlocked (idempotent; the account page also does this).
        const email = session.customer_details?.email;
        if (email) await syncRewards(email).catch((err) => console.error("[stripe-webhook] rewards", err));
      }
    } else if (event.type === "checkout.session.expired") {
      await reportAbandonedCheckout(stripe, event.data.object.id);
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const orderId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      // Only orders that carried a creator code were reported to adz, so only those get refunds reported.
      if (orderId) {
        const pi = await stripe.paymentIntents.retrieve(orderId);
        if (pi.metadata?.adz_code) await trackRefund({ orderId, totalRefunded: charge.amount_refunded / 100 });
      }
    }
  } catch (err) {
    console.error(`[stripe-webhook] ${event.type} failed`, err);
    return new Response("handler failed", { status: 500 });
  }
  return Response.json({ received: true });
}

/**
 * An unpaid checkout expired. If the shopper typed their email and left the
 * marketing box ticked, tell Omnisend ("started checkout" with the cart) so its
 * abandoned-checkout automation can follow up. One event per checkout.
 */
async function reportAbandonedCheckout(stripe: Stripe, sessionId: string) {
  const s = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items.data.price.product"] });
  const email = s.customer_details?.email?.toLowerCase();
  if (s.payment_status === "paid" || !email || s.metadata?.mkt_email !== "yes") return;
  const bySku = new Map(getCatalog().flatMap((p) => p.variants.map((v) => [v.sku, { p, v }] as const)));
  const lineItems = (s.line_items?.data ?? []).flatMap((li) => {
    const prod = li.price?.product;
    const sku = prod && typeof prod === "object" && "metadata" in prod ? prod.metadata?.sku : undefined;
    const hit = sku ? bySku.get(sku) : undefined;
    if (!hit) return [];
    return [{
      productID: hit.p.slug, productTitle: hit.p.name, productVariantID: hit.v.sku, productVariantTitle: hit.v.option, productSKU: hit.v.sku,
      productPrice: hit.v.price, productQuantity: li.quantity ?? 1, productURL: `https://revisedresearch.com/product/${hit.p.slug}`,
      productImageURL: `https://revisedresearch.com/email/vial-${hit.p.accent ?? "metabolic"}.png`,
    }];
  });
  if (!lineItems.length) return;
  await sendEvent("started checkout", email, {
    abandonedCheckoutURL: "https://revisedresearch.com/cart",
    cartID: s.id,
    value: (s.amount_total ?? 0) / 100,
    currency: (s.currency ?? "usd").toUpperCase(),
    lineItems,
  }, `abandoned-${s.id}`);
}

/**
 * Affiliates are paid only when their code was actually applied to the order
 * (typed, or auto-applied from their link). Orders with no creator code, or
 * where a reward code took the single discount slot, aren't reported.
 */
async function reportOrder(session: Stripe.Checkout.Session) {
  const d = session.total_details;
  const m = session.metadata ?? {};
  if (!m.adz_code) return;
  const orderId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? session.id;
  return trackOrder({
    id: orderId,
    number: session.id.slice(-8).toUpperCase(),
    total: (session.amount_total ?? 0) / 100,
    subtotal: ((session.amount_subtotal ?? 0) - (d?.amount_discount ?? 0)) / 100,
    shipping: (d?.amount_shipping ?? 0) / 100,
    tax: (d?.amount_tax ?? 0) / 100,
    discount: (d?.amount_discount ?? 0) / 100,
    currency: session.currency ?? "usd",
    code: m.adz_code,
    referral: m.adz_code,
    source: m.adz_src,
    customer: { email: session.customer_details?.email, firstName: session.customer_details?.name },
    lineItems: (session.line_items?.data ?? []).map((li) => {
      const product = li.price?.product;
      const sku = product && typeof product === "object" && "metadata" in product ? product.metadata?.sku : undefined;
      return { sku: sku ?? null, name: li.description, quantity: li.quantity ?? 1, price: (li.price?.unit_amount ?? 0) / 100 };
    }),
  });
}
