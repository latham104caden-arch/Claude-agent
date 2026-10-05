"use client";

import { SITE } from "../../lib/site";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { bulkFor, bulkLabel } from "../../lib/bulk";

/** Display totals. The server recomputes everything (lib/orders.ts) before Stripe charges. */
export type AppliedDiscount = { code: string; label: string; amount: number };

export function Summary({ children, discount }: { children?: React.ReactNode; discount?: AppliedDiscount | null }) {
  const { subtotal, lines } = useCart();
  // Bulk pricing replaces codes and ships free (same rule as the server, lib/bulk.ts).
  const bulk = bulkFor(lines);
  // Free-shipping threshold is judged on the pre-discount subtotal (same as the server).
  const shipping = bulk.tier || subtotal >= SITE.freeShippingThreshold ? 0 : SITE.flatShipping;
  const off = bulk.tier ? bulk.amount : discount ? Math.min(discount.amount, subtotal) : 0;
  return (
    <aside className="card summary">
      <h2 className="h3" style={{ marginBottom: 12 }}>Order Summary</h2>
      <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      {bulk.tier ? <div className="summary-row summary-discount"><span>{bulkLabel(bulk.tier)}</span><span>−{money(off)}</span></div>
        : discount ? <div className="summary-row summary-discount"><span>Discount <span className="mono">{discount.code}</span></span><span>−{money(off)}</span></div> : null}
      <div className="summary-row"><span>Shipping</span><span>{shipping ? money(shipping) : "Free"}</span></div>
      <div className="summary-row total"><span>Total</span><span>{money(subtotal - off + shipping)}</span></div>
      {shipping ? <p className="drawer-note">Free shipping on orders {money(SITE.freeShippingThreshold)}+.</p> : null}
      {bulk.next && bulk.units > 0 ? <p className="drawer-note">Add {bulk.toNext} more compound{bulk.toNext === 1 ? "" : "s"} for the {bulk.next.min}+ bulk tier.</p> : null}
      {children}
    </aside>
  );
}
