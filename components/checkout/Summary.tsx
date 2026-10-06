"use client";

import { SITE } from "../../lib/site";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { bulkFor, bulkLabel } from "../../lib/bulk";
import { SALE } from "../../lib/sale";

/** Display totals. The server recomputes everything (lib/orders.ts) before Stripe charges. */
export type AppliedDiscount = { code: string; label: string; amount: number };

export function Summary({ children, discount }: { children?: React.ReactNode; discount?: AppliedDiscount | null }) {
  const { subtotal, lines } = useCart();
  // Bulk pricing replaces codes and ships free (same rule as the server, lib/bulk.ts).
  const bulk = bulkFor(lines);
  // Free-shipping threshold is judged on the pre-discount subtotal (same as the server).
  // On a bulk order only a sale code can apply, and only if it saves more than bulk pricing.
  const codeWins = !!discount && (!bulk.tier || discount.amount > bulk.amount);
  // The sale code lowers the free-shipping threshold (same rule as the server).
  const shipFreeAt = codeWins && discount!.code === SALE.code ? SALE.freeShippingOver : SITE.freeShippingThreshold;
  const shipping = bulk.tier || subtotal >= shipFreeAt ? 0 : SITE.flatShipping;
  const off = codeWins ? Math.min(discount!.amount, subtotal) : bulk.tier ? bulk.amount : 0;
  return (
    <aside className="card summary">
      <h2 className="h3" style={{ marginBottom: 12 }}>Order Summary</h2>
      <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      {codeWins ? <div className="summary-row summary-discount"><span>Discount <span className="mono">{discount!.code}</span></span><span>−{money(off)}</span></div>
        : bulk.tier ? <div className="summary-row summary-discount"><span>{bulkLabel(bulk.tier)}</span><span>−{money(off)}</span></div> : null}
      <div className="summary-row"><span>Shipping</span><span>{shipping ? money(shipping) : "Free"}</span></div>
      <div className="summary-row total"><span>Total</span><span>{money(subtotal - off + shipping)}</span></div>
      {shipping ? <p className="drawer-note">Free shipping on orders {money(shipFreeAt)}+.</p> : null}
      {bulk.next && bulk.units > 0 ? <p className="drawer-note">Add {bulk.toNext} more compound{bulk.toNext === 1 ? "" : "s"} for the {bulk.next.min}+ bulk tier.</p> : null}
      {children}
    </aside>
  );
}
