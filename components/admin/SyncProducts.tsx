"use client";

import { useState } from "react";

/** One-tap push of the site catalog to Omnisend's product catalog. */
export function SyncProducts() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const run = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/sync-products", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setMsg(data.message ?? (res.ok ? "Done." : "Something went wrong."));
    } catch { setMsg("Couldn't reach the server."); }
    setBusy(false);
  };
  return (
    <section className="card adm-alerts" aria-label="Omnisend products">
      <div>
        <h2 className="h4">Products → Omnisend</h2>
        <p className="muted">Sends every product, with each size, price, photo and link, to Omnisend's catalog for cart emails, product blocks and recommendations. Run it again after adding products or changing prices. Products taken off the site are marked not available, never deleted.</p>
      </div>
      <div className="adm-alerts-actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={run} disabled={busy}>{busy ? "Syncing…" : "Sync products to Omnisend"}</button>
      </div>
      {msg ? <p className="form-msg adm-alerts-msg" role="status">{msg}</p> : null}
    </section>
  );
}
