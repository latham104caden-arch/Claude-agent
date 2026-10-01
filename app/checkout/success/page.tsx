import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../../../components/ui";
import { ClearCart } from "../../../components/checkout/ClearCart";
import { getStripe } from "../../../lib/stripe";

export const metadata: Metadata = { title: "Order Confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Stripe sends the shopper here after paying. Shows the receipt email and empties the cart. */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  let email: string | null = null;
  let paid = false;
  const stripe = getStripe();
  if (stripe && session_id?.startsWith("cs_")) {
    try {
      const s = await stripe.checkout.sessions.retrieve(session_id);
      paid = s.payment_status === "paid";
      email = s.customer_details?.email ?? null;
    } catch {}
  }
  return (
    <>
      <PageHero crumbs={[{ label: "Order" }]} title={paid ? "Thank you. Your order is in." : "Order received."} />
      <div className="container" style={{ paddingBottom: "var(--section-y)", maxWidth: 640 }}>
        {paid ? <ClearCart /> : null}
        <p className="lead">
          {paid
            ? <>We&apos;ve received your payment{email ? <> and sent a receipt to <b>{email}</b></> : null}. Your order ships within one business day.</>
            : <>If your payment is still processing, you&apos;ll get a receipt by email once it clears.</>}
        </p>
        <p style={{ marginTop: 24 }}><Link href="/shop" className="btn btn--primary">Keep Browsing</Link></p>
      </div>
    </>
  );
}
