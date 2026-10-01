"use client";

import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

// Inlined at build: live key on production, test key on previews.
const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PK ? loadStripe(PK) : null;

/** Stripe's card and address form, mounted on our own checkout page. */
export function PaymentForm({ clientSecret }: { clientSecret: string }) {
  if (!stripePromise) return <p className="muted">Payments aren&apos;t connected yet.</p>;
  return (
    <div className="pay-embed">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
