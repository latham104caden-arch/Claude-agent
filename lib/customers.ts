import type Stripe from "stripe";
import { splitName, upsertContact } from "./omnisend";

/**
 * Paid buyer → Omnisend contact with name, phone and ship-to, tagged "customer".
 * Email-subscribed only when the checkout opt-in box was left ticked (it starts
 * ticked). Upserts by email, so the webhook and the thank-you page can both
 * call this safely.
 */
export async function saveCustomer(session: Stripe.Checkout.Session): Promise<void> {
  const c = session.customer_details;
  if (!c?.email || session.payment_status !== "paid") return;
  const ship = session.collected_information?.shipping_details;
  const a = ship?.address ?? c.address;
  await upsertContact({
    email: c.email.toLowerCase(),
    ...splitName(ship?.name || c.name),
    phone: c.phone,
    address: a ? { line1: a.line1, line2: a.line2, city: a.city, state: a.state, postalCode: a.postal_code, country: a.country } : null,
    tags: ["customer"],
    subscribe: session.metadata?.mkt_email === "yes",
    consentSource: "website checkout opt-in",
  });
}
