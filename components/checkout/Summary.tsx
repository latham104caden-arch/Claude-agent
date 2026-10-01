"use client";

import { SITE } from "../../lib/site";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";

/** Display totals. The server recomputes everything (lib/orders.ts) before Stripe charges. */
export function Summary({ children }: { children?: React.ReactNode }) {
  const { subtotal } = useCart();
  const shipping = subtotal >= SITE.freeShippingThreshold ? 0 : SITE.flatShipping;
  return (
    <aside className="card summary">
      <h2 className="h3" style={{ marginBottom: 12 }}>Order Summary</h2>
      <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      <div className="summary-row"><span>Shipping</span><span>{shipping ? money(shipping) : "Free"}</span></div>
      <div className="summary-row total"><span>Total</span><span>{money(subtotal + shipping)}</span></div>
      {shipping ? <p className="drawer-note">Free shipping on orders {money(SITE.freeShippingThreshold)}+. Creator-code discounts apply at payment.</p> : <p className="drawer-note">Creator-code discounts apply at payment.</p>}
      {children}
    </aside>
  );
}
