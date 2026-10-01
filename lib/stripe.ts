import Stripe from "stripe";

/**
 * Server-side Stripe client, or null when STRIPE_SECRET_KEY isn't set, or is a
 * live key without CHECKOUT_LIVE=true. Never import this from client components.
 */
let client: Stripe | null = null;
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Live keys take real money: off until the owner sets CHECKOUT_LIVE=true. Test keys always work.
  if (key.startsWith("sk_live_") && process.env.CHECKOUT_LIVE !== "true") return null;
  return (client ??= new Stripe(key));
}
