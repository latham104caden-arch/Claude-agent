import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { attributionMetadata, readAttribution, validateCode } from "@adz/next";
import { priceCart, shippingFor } from "../../../lib/orders";
import { getStripe } from "../../../lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cents = (usd: number) => Math.round(usd * 100);
const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

/**
 * Creates a Stripe Checkout session from the cart. Prices, shipping and the
 * creator-code discount are all decided here; Stripe collects the address and
 * card. Attribution rides on the session so the webhook can report the order.
 */
export async function POST(req: Request) {
  let body: { lines?: unknown; code?: unknown; attest?: unknown };
  try { body = await req.json(); } catch { return fail("Invalid request."); }
  if (body.attest !== true) return fail("Please confirm the research-use statement.");

  const stripe = getStripe();
  if (!stripe) return fail("Payments aren't connected yet.", 503);

  const cart = priceCart(body.lines);
  if (!cart.ok) return fail(cart.message);

  const jar = await cookies();
  const attribution = readAttribution(jar);
  const metadata: Record<string, string> = { ...attributionMetadata(jar), ruo_attested: "yes", attested_at: new Date().toISOString() };

  // Creator code: the one typed at checkout wins over the one from a creator link.
  const typed = typeof body.code === "string" ? body.code.trim() : "";
  const code = typed || attribution.code;
  const discounts: { coupon: string }[] = [];
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
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    });
    if (!session.url) return fail("Couldn't start checkout. Please try again.", 502);
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe session failed", err);
    return fail("Couldn't start checkout. Please try again.", 502);
  }
}
