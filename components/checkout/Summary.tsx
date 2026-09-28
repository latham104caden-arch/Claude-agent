"use client";

import { SITE } from "../../lib/site";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";

/** Display-only totals. The server must recompute everything when checkout is wired. */
export function Summary({ children }: { children?: React.ReactNode }) {
  const { subtotal } = useCart();
  const freeShip = subtotal >= SITE.freeShippingThreshold;
  return (
    <aside className="card summary">
      <h2 className="h3" style={{ marginBottom: 12 }}>Order Summary</h2>
      <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      <div className="summary-row"><span>Shipping</span><span>{freeShip ? "Free" : "Calculated at checkout"}</span></div>
      <div className="summary-row"><span>Tax</span><span>Calculated at checkout</span></div>
      <div className="summary-row total"><span>Total</span><span>{money(subtotal)}</span></div>
      {children}
    </aside>
  );
}
