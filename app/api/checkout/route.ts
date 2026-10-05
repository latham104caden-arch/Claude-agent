import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { attributionMetadata, readAttribution } from "@adz/next";
import { priceCart, shippingFor } from "../../../lib/orders";
import { getStripe } from "../../../lib/stripe";
import { currentEmail } from "../../../lib/auth";
import { resolveDiscount } from "../../../lib/discounts";
import { BULK_NO_CODES, bulkFor, bulkLabel } from "../../../lib/bulk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cents = (usd: number) => Math.round(usd * 100);
const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

/**
 * Creates an embedded Stripe Checkout session from the cart (the card form
 * mounts on our checkout page). Prices, shipping and the creator-code discount
 * are all decided here; Stripe's form collects the address and card. Attribution
 * rides on the session so the webhook can report the order. Codes: a $100 spend
 * reward (lib/rewards.ts, signed-in owner only) or an adz creator code. Bulk
 * orders (lib/bulk.ts) get the bulk discount and free shipping instead of a code.
 */
export async function POST(req: Request) {
  let body: { lines?: unknown; code?: unknown; useLink?: unknown; attest?: unknown; emailOptIn?: unknown };
  try { body = await req.json(); } catch { return fail("Invalid request."); }
  if (body.attest !== true) return fail("Please confirm the research-use statement.");

  const stripe = getStripe();
  if (!stripe) return fail("Payments aren't connected yet.", 503);

  const cart = priceCart(body.lines);
  if (!cart.ok) return fail(cart.message);

  const jar = await cookies();
  const attribution = readAttribution(jar);
  const metadata: Record<string, string> = { ...attributionMetadata(jar), ruo_attested: "yes", attested_at: new Date().toISOString(), mkt_email: body.emailOptIn === true ? "yes" : "no" };

  // Signed-in shoppers check out under their account email (orders, rewards and Omnisend all key on it).
  const account = await currentEmail();

  // One discount per order (Stripe rule; no stacking). Bulk pricing wins; otherwise a typed code wins over a creator-link code.
  const typed = typeof body.code === "string" ? body.code.trim() : "";
  const discounts: ({ coupon: string } | { promotion_code: string })[] = [];
  const bulk = bulkFor(cart.lines.map((l) => ({ slug: l.product.slug, price: l.variant.price, qty: l.qty })));
  if (bulk.tier) {
    if (typed) return fail(BULK_NO_CODES);
    const coupon = await stripe.coupons.create({ amount_off: cents(bulk.amount), currency: "usd", duration: "once", max_redemptions: 1, name: bulkLabel(bulk.tier) });
    discounts.push({ coupon: coupon.id });
    metadata.bulk_tier = String(bulk.tier.min);
  } else {
    // The creator-link code applies only if the shopper kept it (they can remove it on the page).
    const linkCode = body.useLink === true ? attribution.code : null;
    const d = await resolveDiscount(typed || linkCode || "", { subtotal: cart.subtotal, account, explicit: !!typed });
    if (d && "error" in d) return fail(d.error);
    if (d?.kind === "reward") {
      discounts.push({ promotion_code: d.promotionCode });
      metadata.reward_code = d.code;
    } else if (d?.kind === "first") {
      const coupon = await stripe.coupons.create({ percent_off: d.percent, duration: "once", max_redemptions: 1, name: `${d.code} first order` });
      discounts.push({ coupon: coupon.id });
      metadata.first_order_code = d.code;
    } else if (d?.kind === "creator") {
      const coupon = await stripe.coupons.create({ percent_off: d.percent, duration: "once", max_redemptions: 1, name: d.code });
      discounts.push({ coupon: coupon.id });
      metadata.adz_code = d.code;
    }
  }

  const shipping = bulk.tier ? 0 : shippingFor(cart.subtotal);
  const origin = new URL(req.url).origin;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      ...(account ? { customer_email: account } : {}),
      line_items: cart.lines.map((l) => ({
        quantity: l.qty,
        price_data: {
          currency: "usd",
          unit_amount: cents(l.variant.price),
          product_data: { name: `${l.product.name} (${l.variant.option})`, description: "For laboratory research use only.", metadata: { sku: l.variant.sku } },
        },
      })),
      ...(discounts.length ? { discounts } : {}),
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [{
        shipping_rate_data: { type: "fixed_amount", display_name: shipping ? "Standard shipping" : "Free shipping", fixed_amount: { amount: cents(shipping), currency: "usd" } },
      }],
      phone_number_collection: { enabled: true },
      custom_text: { submit: { message: "Research use only. By paying you confirm you are 21 or older and these products are not for human or veterinary use." } },
      metadata,
      payment_intent_data: { metadata },
      return_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    });
    if (!session.client_secret) return fail("Couldn't start checkout. Please try again.", 502);
    return NextResponse.json({ ok: true, clientSecret: session.client_secret });
  } catch (err) {
    console.error("[checkout] Stripe session failed", err);
    return fail("Couldn't start checkout. Please try again.", 502);
  }
}
