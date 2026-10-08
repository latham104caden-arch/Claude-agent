"use client";

import { useState } from "react";

/** One-tap backfill of past buyers into Omnisend (respects each buyer's email opt-in). */
export function SyncCustomers() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const run = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/sync-customers", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setMsg(data.message ?? (res.ok ? "Done." : "Something went wrong."));
    } catch { setMsg("Couldn't reach the server."); }
    setBusy(false);
  };
  return (
    <section className="card adm-alerts" aria-label="Omnisend">
      <div>
        <h2 className="h4">Past buyers → Omnisend</h2>
        <p className="muted">Adds everyone who has paid to Omnisend as a customer, with their orders (totals and products), for purchase segments. Only buyers who left the email box ticked are subscribed. Safe to run again.</p>
      </div>
      <div className="adm-alerts-actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={run} disabled={busy}>{busy ? "Adding…" : "Add past buyers to Omnisend"}</button>
      </div>
      {msg ? <p className="form-msg adm-alerts-msg" role="status">{msg}</p> : null}
    </section>
  );
}
