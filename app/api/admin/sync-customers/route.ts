import { NextResponse } from "next/server";
import { currentAdmin } from "../../../../lib/admin";
import { getStripe } from "../../../../lib/stripe";
import { saveCustomer } from "../../../../lib/customers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Team-only: adds every past paid buyer to Omnisend, the same way a new order
 * does (tag "customer"; email-subscribed only if they left the checkout box
 * ticked). Safe to run more than once: contacts are upserted by email.
 */
export async function POST() {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, message: "Not authorized." }, { status: 401 });
  if (!process.env.OMNISEND_API_KEY) return NextResponse.json({ ok: false, message: "OMNISEND_API_KEY isn't set." }, { status: 503 });
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, message: "Stripe isn't connected." }, { status: 503 });

  let buyers = 0, subscribed = 0, failed = 0;
  const seen = new Set<string>();
  // Newest first, so each email gets its most recent order's details and opt-in choice.
  for await (const s of stripe.checkout.sessions.list({ limit: 100 })) {
    const email = s.customer_details?.email?.toLowerCase();
    if (s.payment_status !== "paid" || !email || seen.has(email)) continue;
    seen.add(email);
    try {
      await saveCustomer(s);
      buyers++;
      if (s.metadata?.mkt_email === "yes") subscribed++;
    } catch (err) {
      failed++;
      console.error("[admin/sync-customers]", err);
    }
  }
  return NextResponse.json({
    ok: true,
    message: `Added ${buyers} buyer${buyers === 1 ? "" : "s"} to Omnisend: ${subscribed} subscribed to email, ${buyers - subscribed} as customers only (they unticked the box or bought before it existed)${failed ? `, ${failed} failed` : ""}.`,
  });
}
