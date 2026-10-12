import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { PageHero } from "../../../components/ui";
import { ClearCart } from "../../../components/checkout/ClearCart";
import { getStripe } from "../../../lib/stripe";
import { sendOrderConfirmation } from "../../../lib/email";
import { saveCustomer } from "../../../lib/customers";

export const metadata: Metadata = { title: "Order Confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Stripe sends the shopper here after paying. Shows the receipt email and empties the cart. */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  let email: string | null = null;
  let paid = false;
  let complete = false;
  const stripe = getStripe();
  if (stripe && session_id?.startsWith("cs_")) {
    try {
      const s = await stripe.checkout.sessions.retrieve(session_id, { expand: ["line_items"] });
      paid = s.payment_status === "paid";
      // "complete" = the shopper finished checkout; a delayed payment method can still be settling.
      complete = s.status === "complete";
      email = s.customer_details?.email ?? null;
      // Sent after the page is on screen, so a slow Resend or Omnisend never holds the shopper
      // on Stripe's spinner. The webhook also sends it; the Idempotency-Key keeps it to one email.
      if (paid) {
        after(() => Promise.all([
          sendOrderConfirmation(s).catch((err) => console.error("[success] confirmation", err)),
          // Also done by the webhook; doing it here too means buyers reach Omnisend even if the webhook is down.
          saveCustomer(s).catch((err) => console.error("[success] omnisend", err)),
        ]));
      }
    } catch (err) {
      console.error("[success] session lookup", err);
    }
  }
  return (
    <>
      <PageHero crumbs={[{ label: "Order" }]} title={paid ? "Thank you. Your order is in." : "Order received."} />
      <div className="container" style={{ paddingBottom: "var(--section-y)", maxWidth: 640 }}>
        {paid || complete ? <ClearCart /> : null}
        <p className="lead">
          {paid
            ? <>We&apos;ve received your payment{email ? <> and emailed your order confirmation to <b>{email}</b></> : null}. Shipping takes 2–3 business days, and tracking is emailed when your label is created.</>
            : <>If your payment is still processing, you&apos;ll get a receipt by email once it clears.</>}
        </p>
        <p style={{ marginTop: 24 }}><Link href="/shop" className="btn btn--primary">Keep Browsing</Link></p>
      </div>
    </>
  );
}
