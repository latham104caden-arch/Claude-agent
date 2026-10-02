import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { attributionMetadata, readAttribution, validateCode } from "@adz/next";
import { priceCart, shippingFor } from "../../../lib/orders";
import { getStripe } from "../../../lib/stripe";
import { currentEmail } from "../../../lib/auth";
import { isRewardCode, rewardPromotionFor } from "../../../lib/rewards";

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
 */
export async function POST(req: Request) {
  let body: { lines?: unknown; code?: unknown; attest?: unknown; emailOptIn?: unknown };
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

  // One discount per order (Stripe rule). A typed code wins over a creator-link code.
  const typed = typeof body.code === "string" ? body.code.trim() : "";
  const discounts: ({ coupon: string } | { promotion_code: string })[] = [];
  if (typed && isRewardCode(typed)) {
    // $100 spend reward: only for the account it was earned on.
    if (!account) return fail("Sign in to use a reward code. It only works for the account that earned it.");
    const r = await rewardPromotionFor(account, typed);
    if ("error" in r) return fail(r.error);
    discounts.push({ promotion_code: r.id });
    metadata.reward_code = typed.toUpperCase();
  }
  const code = discounts.length ? null : typed || attribution.code;
  if (code) {
    let check: Awaited<ReturnType<typeof validateCode>> | null = null;
    try { check = await validateCode(code); } catch (err) { console.error("[checkout] adz code check failed", err); }
    if (check?.valid && check.discount_pct && check.discount_pct > 0) {
      const coupon = await stripe.coupons.create({ percent_off: check.discount_pct, duration: "once", max_redemptions: 1, name: check.code ?? code.toUpperCase() });
      discounts.push({ coupon: coupon.id });
      metadata.adz_code = check.code ?? code.toUpperCase();
    } else if (typed) {
      return fail(check ? `The code “${typed.toUpperCase()}” isn't valid.` : "We couldn't check that code right now. Try again, or check out without it.");
    }
  }

  const shipping = shippingFor(cart.subtotal);
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
