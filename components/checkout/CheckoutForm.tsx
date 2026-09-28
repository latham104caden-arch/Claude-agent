"use client";

import Link from "next/link";
import { useState } from "react";
import { US_STATES } from "../../lib/states";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { StubNotice } from "../ui";
import { Summary } from "./Summary";

/**
 * Checkout layout — contact, shipping, research attestation, payment slot.
 * PAYMENTS ARE NOT CONNECTED. The Place Order button is disabled until a
 * payment provider + server-side order creation exist (app/api/checkout).
 */
export function CheckoutForm() {
  const { lines, ready } = useCart();
  const [attest, setAttest] = useState(false);

  if (!ready) return <div style={{ minHeight: 400 }} />;
  if (lines.length === 0) {
    return (
      <div className="drawer-empty" style={{ padding: "80px 0 var(--section-y)" }}>
        <p>Your cart is empty.</p>
        <Link href="/shop" className="btn btn--primary">Browse Compounds</Link>
      </div>
    );
  }

  return (
    <form className="checkout-grid" onSubmit={(e) => e.preventDefault()}>
      <div>
        <fieldset>
          <legend>Contact</legend>
          <div className="form-grid">
            <div className="field span-2"><label htmlFor="co-email">Email</label><input id="co-email" type="email" className="input" autoComplete="email" required /></div>
          </div>
        </fieldset>
        <fieldset>
          <legend>Shipping address</legend>
          <div className="form-grid">
            <div className="field"><label htmlFor="co-fn">First name</label><input id="co-fn" className="input" autoComplete="given-name" required /></div>
            <div className="field"><label htmlFor="co-ln">Last name</label><input id="co-ln" className="input" autoComplete="family-name" required /></div>
            <div className="field span-2"><label htmlFor="co-a1">Address</label><input id="co-a1" className="input" autoComplete="address-line1" required /></div>
            <div className="field span-2"><label htmlFor="co-a2">Apartment, suite, etc. (optional)</label><input id="co-a2" className="input" autoComplete="address-line2" /></div>
            <div className="field"><label htmlFor="co-city">City</label><input id="co-city" className="input" autoComplete="address-level2" required /></div>
            <div className="field">
              <label htmlFor="co-state">State</label>
              <select id="co-state" className="select" autoComplete="address-level1" defaultValue="" required>
                <option value="" disabled>Select…</option>
                {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="co-zip">ZIP</label><input id="co-zip" className="input" autoComplete="postal-code" inputMode="numeric" required /></div>
            <div className="field"><label htmlFor="co-phone">Phone (for delivery issues)</label><input id="co-phone" type="tel" className="input" autoComplete="tel" /></div>
          </div>
        </fieldset>
        <fieldset>
          <legend>Payment</legend>
          <StubNotice>Payments are not connected yet. The card form from the payment provider will mount here.</StubNotice>
        </fieldset>
        <label className="check" style={{ marginBottom: 20 }}>
          <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} />
          <span>I confirm I am 21 or older and that these products are purchased for laboratory research use only, not for human or veterinary use.</span>
        </label>
      </div>
      <div>
        <Summary>
          <div style={{ marginTop: 14, display: "grid", gap: 6, fontSize: 14 }}>
            {lines.map((l) => (
              <div key={l.sku} className="summary-row" style={{ padding: 0 }}>
                <span className="muted">{l.qty} × {l.name} ({l.option})</span><span>{money(l.qty * l.price)}</span>
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn--primary btn--block" disabled title="Payments not connected yet">
            Place Order
          </button>
          {!attest ? <p className="drawer-note" style={{ marginTop: 10 }}>Research-use confirmation required.</p> : null}
        </Summary>
      </div>
    </form>
  );
}
