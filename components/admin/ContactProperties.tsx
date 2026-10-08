"use client";

import { useRef, useState } from "react";

/** Upload an import CSV; its purchase fields are written onto the matching Omnisend contacts. */
export function ContactProperties() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const run = async () => {
    const file = input.current?.files?.[0];
    if (!file) { setMsg("Choose a CSV file first."); return; }
    setBusy(true); setMsg("");
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/contact-properties", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      setMsg(data.message ?? (res.ok ? "Done." : "Something went wrong."));
    } catch { setMsg("Couldn't reach the server."); }
    setBusy(false);
  };
  return (
    <section className="card adm-alerts" aria-label="Contact purchase fields">
      <div>
        <h2 className="h4">Purchase fields → Omnisend</h2>
        <p className="muted">For contacts you imported by file: upload the same CSV and its total spent, orders, average order, order dates and status are added to each contact as segmentable fields, matched by email. Subscription status and tags aren&apos;t touched. Import the contacts first.</p>
      </div>
      <div className="adm-alerts-actions">
        <input ref={input} type="file" accept=".csv,text/csv" aria-label="Contact CSV" />
        <button type="button" className="btn btn--ghost btn--sm" onClick={run} disabled={busy}>{busy ? "Sending…" : "Add purchase fields"}</button>
      </div>
      {msg ? <p className="form-msg adm-alerts-msg" role="status">{msg}</p> : null}
    </section>
  );
}
