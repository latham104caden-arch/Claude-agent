"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { Icon } from "../Icon";
import { PaymentForm } from "./PaymentForm";
import { Summary, type AppliedDiscount } from "./Summary";
import { bulkFor, bulkLabel } from "../../lib/bulk";

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
  const [applied, setApplied] = useState<(AppliedDiscount & { fromLink?: boolean }) | null>(null);
  const [applying, setApplying] = useState(false);
  const [codeMsg, setCodeMsg] = useState("");
  // The entry gate already asked for 21+ (rr-gate-v1). If it's on record, checkout only asks for research use.
  const [gateAt, setGateAt] = useState<string | null>(null);
  useEffect(() => {
    try {
      const at = JSON.parse(localStorage.getItem("rr-gate-v1") || "null")?.at;
      if (typeof at === "string") setGateAt(at);
    } catch {}
  }, []);

  const preview = async (typed: string) => {
    const res = await fetch("/api/checkout/code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lines: lines.map((l) => ({ sku: l.sku, qty: l.qty })), code: typed || undefined }),
    });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  };

  // Show a creator-link code that checkout will auto-apply; refresh the amount when the cart changes.
  const cartKey = lines.map((l) => `${l.sku}x${l.qty}`).join(",");
  useEffect(() => {
    if (!ready || !lines.length) return;
    let live = true;
    preview(applied && !applied.fromLink ? applied.code : "").then(({ ok, data }) => {
      if (!live) return;
      if (ok) setApplied(data.discount ?? null);
      else if (applied) { setApplied(null); setCodeMsg(data.message || "That code no longer applies to this cart."); }
    }).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cartKey]);

  const apply = async () => {
    const typed = code.trim();
    if (!typed || applying) return;
    setApplying(true);
    setCodeMsg("");
    try {
      const { ok, data } = await preview(typed);
      if (ok && data.discount) { setApplied(data.discount); setCode(""); }
      else setCodeMsg(data.message || "That code isn't valid.");
    } catch {
      setCodeMsg("Couldn't check the code. Check your connection and try again.");
    }
    setApplying(false);
  };

  const bulk = bulkFor(lines);

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
        body: JSON.stringify({ lines: lines.map((l) => ({ sku: l.sku, qty: l.qty })), code: applied && !applied.fromLink ? applied.code : undefined, useLink: !bulk.tier && !!applied?.fromLink, attest, emailOptIn, gateAt }),
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
        {bulk.tier ? (
        <fieldset>
          <legend>Bulk pricing</legend>
          <div className="code-applied" role="status">
            <Icon name="check" strokeWidth={2.4} />
            <span><b>{bulkLabel(bulk.tier)}</b> applied · you save {money(bulk.amount)} and shipping is free</span>
          </div>
          <p className="drawer-note">Bulk pricing can&apos;t be combined with other codes. A sitewide sale code still works, and you get whichever saves more. <Link href="/bulk">How bulk pricing works</Link></p>
        </fieldset>
        ) : null}
        <fieldset>
          <legend>Discount code</legend>
          <div className="form-grid">
            <div className="field span-2">
              <label htmlFor="co-code">Code (optional)</label>
              <div className="code-apply">
                <input id="co-code" className="input" value={code} onChange={(e) => { setCode(e.target.value); setCodeMsg(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={64} placeholder="Enter a code" />
                <button type="button" className="btn btn--dark" onClick={apply} disabled={!code.trim() || applying}>{applying ? "Checking…" : "Apply"}</button>
              </div>
            </div>
          </div>
          {applied ? (
            <div className="code-applied" role="status">
              <Icon name="check" strokeWidth={2.4} />
              <span><b className="mono">{applied.code}</b> applied · {applied.label}{applied.fromLink ? " (from your creator link)" : ""}</span>
              <button type="button" className="link-btn" onClick={() => setApplied(null)}>Remove</button>
            </div>
          ) : null}
          {codeMsg ? <p className="drawer-note" role="alert" style={{ color: "var(--danger)" }}>{codeMsg}</p> : <p className="drawer-note">Creator code, RR25 on a first order, or a $100 reward code from your account. One code per order.</p>}
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
          <span>{gateAt
            ? "I confirm these products are purchased for laboratory research use only, not for human or veterinary use."
            : "I confirm I am 21 or older and that these products are purchased for laboratory research use only, not for human or veterinary use."}</span>
        </label>
      </div>
      <div>
        <Summary discount={applied}>
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
