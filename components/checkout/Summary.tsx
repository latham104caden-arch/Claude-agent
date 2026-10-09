"use client";

import { SITE } from "../../lib/site";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { PARTNER, partnerQuote } from "../../lib/partner";
import { SALE } from "../../lib/sale";
import { freeShippingAt, giftFor } from "../../lib/gift";

/** Display totals. The server recomputes everything (lib/orders.ts) before Stripe charges. */
export type AppliedDiscount = { code: string; label: string; amount: number };

export function Summary({ children, discount }: { children?: React.ReactNode; discount?: AppliedDiscount | null }) {
  const { subtotal, lines } = useCart();
  // Partner pricing isn't applied at checkout; carts with 10+ of one vial get a pointer to request it.
  const kit = partnerQuote(lines);
  // Free-shipping threshold is judged on the pre-discount subtotal (same as the server).
  const codeWins = !!discount;
  // The sale code lowers the free-shipping threshold (same rule as the server).
  const shipFreeAt = codeWins && discount!.code === SALE.code ? Math.min(SALE.freeShippingOver, freeShippingAt()) : freeShippingAt();
  const shipping = subtotal >= shipFreeAt ? 0 : SITE.flatShipping;
  const off = codeWins ? Math.min(discount!.amount, subtotal) : 0;
  const gift = giftFor(subtotal);
  return (
    <aside className="card summary">
      <h2 className="h3" style={{ marginBottom: 12 }}>Order Summary</h2>
      <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      {codeWins ? <div className="summary-row summary-discount"><span>Discount <span className="mono">{discount!.code}</span></span><span>−{money(off)}</span></div> : null}
      {gift?.unlocked ? <div className="summary-row summary-discount"><span>Free gift: {gift.product.name} ({gift.variant.option})</span><span>Free</span></div> : null}
      <div className="summary-row"><span>Shipping</span><span>{shipping ? money(shipping) : "Free"}</span></div>
      <div className="summary-row total"><span>Total</span><span>{money(subtotal - off + shipping)}</span></div>
      {shipping ? <p className="drawer-note">Free shipping on orders {money(shipFreeAt)}+.</p> : null}
      {gift && !gift.unlocked ? <p className="drawer-note">Add {money(gift.toGo)} more for a free {gift.product.name} ({gift.variant.option}){gift.minimum >= freeShippingAt() ? " and free shipping" : ""}.</p> : null}
      {kit.qualifying ? <p className="drawer-note">{kit.qualifyingVials} of these vials qualify for partner pricing. <a href={PARTNER.path}>Request it</a> and save {money(kit.savings)} before you pay.</p> : null}
      {children}
    </aside>
  );
}
