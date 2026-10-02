"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { Icon } from "../Icon";
import { PaymentForm } from "./PaymentForm";
import { Summary } from "./Summary";

/**
 * Checkout: research attestation and an optional creator code, then Stripe's
 * embedded form (address and card) opens right here on the page. The server
 * re-prices the cart (app/api/checkout); nothing priced here is trusted.
 */
export function CheckoutForm() {
  const { lines, ready } = useCart();
  const [attest, setAttest] = useState(false);
  const [code, setCode] = useState("");
  // Pre-ticked per the owner; the shopper can untick it. Email only (no SMS opt-in is collected).
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  if (!ready) return <div style={{ minHeight: 400 }} />;
  if (lines.length === 0) {
    return (
      <div className="drawer-empty" style={{ padding: "80px 0 var(--section-y)" }}>
        <p>Your cart is empty.</p>
        <Link href="/shop" className="btn btn--primary">Browse Compounds</Link>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <div className="checkout-pay">
        <button type="button" className="shop-clear" onClick={() => { setClientSecret(""); setBusy(false); }}>← Edit code or cart</button>
        <PaymentForm clientSecret={clientSecret} />
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attest || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines: lines.map((l) => ({ sku: l.sku, qty: l.qty })), code: code.trim() || undefined, attest, emailOptIn }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setError(data.message || "Couldn't start checkout. Please try again.");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <form className="checkout-grid" onSubmit={submit}>
      <div>
        <fieldset>
          <legend>Creator code</legend>
          <div className="form-grid">
            <div className="field span-2">
              <label htmlFor="co-code">Code (optional)</label>
              <input id="co-code" className="input" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={64} placeholder="Enter a code" />
            </div>
          </div>
          <p className="drawer-note">Arrived from a creator link? Their code is applied automatically.</p>
        </fieldset>
        <fieldset>
          <legend>Shipping and payment</legend>
          <p className="muted">Your address and card are entered on the next step, in a secure form from Stripe. US shipping only.</p>
        </fieldset>
        <label className="check" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={emailOptIn} onChange={(e) => setEmailOptIn(e.target.checked)} />
          <span>Email me new compounds, restocks and offers. Unsubscribe any time.</span>
        </label>
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
          <button type="submit" className="btn btn--primary btn--block" disabled={!attest || busy}>
            {busy ? "Loading secure payment…" : <>Continue to Payment <Icon name="arrow" /></>}
          </button>
          {error ? <p className="drawer-note" role="alert" style={{ marginTop: 10, color: "var(--danger)" }}>{error}</p> : null}
          {!attest && !error ? <p className="drawer-note" style={{ marginTop: 10 }}>Research-use confirmation required.</p> : null}
        </Summary>
      </div>
    </form>
  );
}
