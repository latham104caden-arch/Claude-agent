"use client";

import { useEffect, useState } from "react";
import { PaymentForm } from "../checkout/PaymentForm";

/** Research-use confirmation, then Stripe's embedded form for an approved partner kit. */
export function PartnerPay({ token, total }: { token: string; total: string }) {
  const [attest, setAttest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [gateAt, setGateAt] = useState<string | null>(null);
  useEffect(() => {
    try {
      const at = JSON.parse(localStorage.getItem("rr-gate-v1") || "null")?.at;
      if (typeof at === "string") setGateAt(at);
    } catch {}
  }, []);

  if (clientSecret) return <div className="checkout-pay"><PaymentForm clientSecret={clientSecret} /></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attest || busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/partner/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, attest, gateAt }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.clientSecret) { setClientSecret(data.clientSecret); return; }
      setError(data.message || "Couldn't start checkout. Please try again.");
    } catch { setError("Couldn't reach the server. Check your connection and try again."); }
    setBusy(false);
  };

  return (
    <form onSubmit={submit}>
      <label className="check" style={{ marginBottom: 20 }}>
        <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} />
        <span>{gateAt
          ? "I confirm these products are purchased for laboratory research use only, not for human or veterinary use."
          : "I confirm I am 21 or older and that these products are purchased for laboratory research use only, not for human or veterinary use."}</span>
      </label>
      {error ? <p className="form-msg is-error" role="alert">{error}</p> : null}
      <button type="submit" className="btn btn--primary btn--block" disabled={!attest || busy}>{busy ? "Starting…" : `Continue to payment · ${total}`}</button>
    </form>
  );
}
