"use client";

import { SITE } from "../../lib/site";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";

/** Display totals. The server recomputes everything (lib/orders.ts) before Stripe charges. */
export type AppliedDiscount = { code: string; label: string; amount: number };

export function Summary({ children, discount }: { children?: React.ReactNode; discount?: AppliedDiscount | null }) {
  const { subtotal } = useCart();
  // Free-shipping threshold is judged on the pre-discount subtotal (same as the server).
  const shipping = subtotal >= SITE.freeShippingThreshold ? 0 : SITE.flatShipping;
  const off = discount ? Math.min(discount.amount, subtotal) : 0;
  return (
    <aside className="card summary">
      <h2 className="h3" style={{ marginBottom: 12 }}>Order Summary</h2>
      <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      {discount ? <div className="summary-row summary-discount"><span>Discount <span className="mono">{discount.code}</span></span><span>−{money(off)}</span></div> : null}
      <div className="summary-row"><span>Shipping</span><span>{shipping ? money(shipping) : "Free"}</span></div>
      <div className="summary-row total"><span>Total</span><span>{money(subtotal - off + shipping)}</span></div>
      {shipping ? <p className="drawer-note">Free shipping on orders {money(SITE.freeShippingThreshold)}+.</p> : null}
      {children}
    </aside>
  );
}
