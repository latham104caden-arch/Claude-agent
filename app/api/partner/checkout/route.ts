import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe";
import { approvalState, getApproval, priceApproval } from "../../../../lib/partner-approvals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cents = (usd: number) => Math.round(usd * 100);
const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

/**
 * Checkout for an approved Research Partner kit (lib/partner-approvals.ts):
 * exactly the approved vials and quantities, each at its tier's unit price,
 * re-priced from the live catalog. Body: { token, attest, gateAt? }.
 */
export async function POST(req: Request) {
  let body: { token?: unknown; attest?: unknown; gateAt?: unknown };
  try { body = await req.json(); } catch { return fail("Invalid request."); }
  if (body.attest !== true) return fail("Please confirm the research-use statement.");
  const stripe = getStripe();
  if (!stripe) return fail("Payments aren't connected yet.", 503);

  const a = await getApproval(body.token);
  if (!a) return fail("This partner link isn't valid.", 404);
  const state = approvalState(a);
  if (state === "paid") return fail("This partner kit has already been paid for.");
  if (state === "expired") return fail("This partner link has expired. Reply to your approval email and we'll send a new one.");
  const priced = priceApproval(a);
  if (!priced.ok) return fail(priced.message);

  const gateAt = typeof body.gateAt === "string" && !Number.isNaN(Date.parse(body.gateAt)) ? new Date(body.gateAt).toISOString() : null;
  const metadata: Record<string, string> = {
    ruo_attested: "yes", attested_at: new Date().toISOString(),
    age_21_confirmed: gateAt ? `entry gate ${gateAt}` : "checkout box",
    mkt_email: "no",
    partner_token: a.token,
    partner_savings: priced.savings.toFixed(2),
  };
  const origin = new URL(req.url).origin;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      customer_email: a.contact.email,
      line_items: priced.lines.map((l) => ({
        quantity: l.qty,
        price_data: {
          currency: "usd",
          unit_amount: cents(l.unit),
          product_data: {
            name: `${l.name} (${l.option})${l.tier ? ` · partner ${l.tier.percent}% off` : ""}`,
            description: "For laboratory research use only.",
            metadata: { sku: l.sku },
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [{
        shipping_rate_data: { type: "fixed_amount", display_name: priced.shipping ? "Standard shipping" : "Free shipping", fixed_amount: { amount: cents(priced.shipping), currency: "usd" } },
      }],
      phone_number_collection: { enabled: true },
      custom_text: { submit: { message: "Research use only. By paying you confirm you are 21 or older and these products are not for human or veterinary use." } },
      metadata,
      payment_intent_data: { metadata },
      expires_at: Math.floor(Date.now() / 1000) + 2 * 3600,
      return_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    });
    if (!session.client_secret) return fail("Couldn't start checkout. Please try again.", 502);
    return NextResponse.json({ ok: true, clientSecret: session.client_secret });
  } catch (err) {
    console.error("[partner-checkout] Stripe session failed", err);
    return fail("Couldn't start checkout. Please try again.", 502);
  }
}
