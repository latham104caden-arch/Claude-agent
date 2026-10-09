import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { attributionMetadata, readAttribution } from "@adz/next";
import { priceCart, shippingFor } from "../../../lib/orders";
import { getStripe } from "../../../lib/stripe";
import { currentEmail } from "../../../lib/auth";
import { resolveDiscount } from "../../../lib/discounts";
import { SALE } from "../../../lib/sale";
import { record } from "../../../lib/funnel";
import { giftFor } from "../../../lib/gift";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cents = (usd: number) => Math.round(usd * 100);
const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

/**
 * Creates an embedded Stripe Checkout session from the cart (the card form
 * mounts on our checkout page). Prices, shipping and the creator-code discount
 * are all decided here; Stripe's form collects the address and card. Attribution
 * rides on the session so the webhook can report the order. Codes: a $100 spend
 * reward (lib/rewards.ts, signed-in owner only) or an adz creator code.
 * Research Partner kit pricing (lib/partner.ts) is set up by the team, not here.
 */
export async function POST(req: Request) {
  let body: { lines?: unknown; code?: unknown; useLink?: unknown; attest?: unknown; emailOptIn?: unknown; gateAt?: unknown; sid?: unknown };
  try { body = await req.json(); } catch { return fail("Invalid request."); }
  if (body.attest !== true) return fail("Please confirm the research-use statement.");

  const stripe = getStripe();
  if (!stripe) return fail("Payments aren't connected yet.", 503);

  const cart = priceCart(body.lines);
  if (!cart.ok) return fail(cart.message);

  const jar = await cookies();
  const attribution = readAttribution(jar);
  // 21+ is confirmed at the entry gate (its timestamp is recorded here); without one, the checkout box itself includes 21+.
  const gateAt = typeof body.gateAt === "string" && !Number.isNaN(Date.parse(body.gateAt)) ? new Date(body.gateAt).toISOString() : null;
  const metadata: Record<string, string> = {
    ...attributionMetadata(jar), ruo_attested: "yes", attested_at: new Date().toISOString(),
    age_21_confirmed: gateAt ? `entry gate ${gateAt}` : "checkout box",
    mkt_email: body.emailOptIn === true ? "yes" : "no",
  };

  // Signed-in shoppers check out under their account email (orders, rewards and Omnisend all key on it).
  const account = await currentEmail();

  // One discount per order (Stripe rule; no stacking): a typed code wins over a creator-link code.
  // Research Partner pricing (lib/partner.ts) is never applied here; the team sets it up after a request.
  const typed = typeof body.code === "string" ? body.code.trim() : "";
  const discounts: ({ coupon: string } | { promotion_code: string })[] = [];
  // The creator-link code applies only if the shopper kept it (they can remove it on the page).
  const linkCode = body.useLink === true ? attribution.code : null;
  const d = await resolveDiscount(typed || linkCode || "", { subtotal: cart.subtotal, account, explicit: !!typed });
  if (d && "error" in d) return fail(d.error);
  if (d?.kind === "reward") {
    discounts.push({ promotion_code: d.promotionCode });
    metadata.reward_code = d.code;
  } else if (d?.kind === "sale") {
    const coupon = await stripe.coupons.create({ percent_off: d.percent, duration: "once", max_redemptions: 1, name: d.code });
    discounts.push({ coupon: coupon.id });
    metadata.sale_code = d.code;
  } else if (d?.kind === "first") {
    const coupon = await stripe.coupons.create({ percent_off: d.percent, duration: "once", max_redemptions: 1, name: `${d.code} first order` });
    discounts.push({ coupon: coupon.id });
    metadata.first_order_code = d.code;
  } else if (d?.kind === "creator") {
    const coupon = await stripe.coupons.create({ percent_off: d.percent, duration: "once", max_redemptions: 1, name: d.code });
    discounts.push({ coupon: coupon.id });
    metadata.adz_code = d.code;
  }

  // Free shipping: the normal threshold (lower during a gift deal), or the sale code's lower threshold.
  const saleShip = metadata.sale_code === SALE.code && cart.subtotal >= SALE.freeShippingOver;
  const shipping = saleShip ? 0 : shippingFor(cart.subtotal);
  const origin = new URL(req.url).origin;

  // Free gift with purchase (lib/gift.ts): judged on the pre-discount subtotal, added as a $0 line so it
  // shows on the receipt, the order email and the team's order list.
  const gift = giftFor(cart.subtotal);
  const lineItems = cart.lines.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency: "usd",
      unit_amount: cents(l.variant.price),
      product_data: { name: `${l.product.name} (${l.variant.option})`, description: "For laboratory research use only.", metadata: { sku: l.variant.sku } },
    },
  }));
  if (gift?.unlocked) {
    metadata.gift_sku = gift.variant.sku;
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: 0,
        product_data: { name: `FREE GIFT: ${gift.product.name} (${gift.variant.option})`, description: "Free with orders over the gift minimum. For laboratory research use only.", metadata: { sku: gift.variant.sku } },
      },
    });
  }

  const create = (items: typeof lineItems) => stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      ...(account ? { customer_email: account } : {}),
      line_items: items,
      ...(discounts.length ? { discounts } : {}),
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [{
        shipping_rate_data: { type: "fixed_amount", display_name: shipping ? "Standard shipping" : "Free shipping", fixed_amount: { amount: cents(shipping), currency: "usd" } },
      }],
      phone_number_collection: { enabled: true },
      custom_text: { submit: { message: "Research use only. By paying you confirm you are 21 or older and these products are not for human or veterinary use." } },
      metadata,
      payment_intent_data: { metadata },
      // Unpaid checkouts expire after 2 hours (Stripe's default is 24), so abandoned-checkout follow-ups go out the same day.
      expires_at: Math.floor(Date.now() / 1000) + 2 * 3600,
      return_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    });
  try {
    let session;
    try {
      session = await create(lineItems);
    } catch (err) {
      // Never let the gift block a sale: if Stripe refuses the $0 line, check out without it.
      // The gift stays on the order as metadata.gift_sku (shown on /admin/orders) for packing.
      if (!gift?.unlocked) throw err;
      console.error("[checkout] gift line refused, retrying without it", err);
      metadata.gift_line = "missing";
      session = await create(lineItems.slice(0, -1));
    }
    if (!session.client_secret) return fail("Couldn't start checkout. Please try again.", 502);
    // Funnel: count the checkout start for the team dashboard (never blocks checkout).
    const sid = typeof body.sid === "string" && /^[a-z0-9]{8,40}$/i.test(body.sid) ? body.sid : `srv${session.id.slice(-12)}`;
    await record({ type: "checkout", sid, items: cart.lines.map((l) => ({ slug: l.product.slug, qty: l.qty })) }).catch((err) => console.error("[checkout] funnel", err));
    return NextResponse.json({ ok: true, clientSecret: session.client_secret });
  } catch (err) {
    console.error("[checkout] Stripe session failed", err);
    return fail("Couldn't start checkout. Please try again.", 502);
  }
}
