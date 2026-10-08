"use client";

import { useRef, useState } from "react";
import { parseCsv } from "../../lib/csv";

const CHUNK = 300;

/** Upload an import CSV; its purchase fields / send_group are written onto the matching Omnisend contacts. */
export function ContactProperties() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const run = async () => {
    const file = input.current?.files?.[0];
    if (!file) { setMsg("Choose a CSV file first."); return; }
    const rows = parseCsv(await file.text());
    if (!rows.length || !("email" in rows[0])) { setMsg("That file has no email column."); return; }
    setBusy(true);
    const t = { updated: 0, missing: 0, failed: 0 };
    for (let i = 0; i < rows.length; i += CHUNK) {
      setMsg(`Updating ${Math.min(i + CHUNK, rows.length).toLocaleString()} of ${rows.length.toLocaleString()}… keep this tab open.`);
      try {
        const res = await fetch("/api/admin/contact-properties", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rows: rows.slice(i, i + CHUNK) }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) { setMsg(d.message ?? "Something went wrong."); setBusy(false); return; }
        t.updated += d.updated ?? 0; t.missing += d.missing ?? 0; t.failed += d.failed ?? 0;
      } catch { t.failed += Math.min(CHUNK, rows.length - i); }
    }
    setMsg(`Done: ${t.updated.toLocaleString()} contacts updated${t.missing ? `, ${t.missing.toLocaleString()} not in Omnisend (import them first)` : ""}${t.failed ? `, ${t.failed.toLocaleString()} failed (run the file again; it's safe)` : ""}.`);
    setBusy(false);
  };
  return (
    <section className="card adm-alerts" aria-label="Contact fields">
      <div>
        <h2 className="h4">Contact fields → Omnisend</h2>
        <p className="muted">For contacts you imported by file: upload the same CSV and its total spent, orders, average order, order dates, status and send group are added to each contact as segmentable fields, matched by email. Subscription status and tags aren&apos;t touched, and nobody new is created. Safe to run again.</p>
      </div>
      <div className="adm-alerts-actions">
        <input ref={input} type="file" accept=".csv,text/csv" aria-label="Contact CSV" />
        <button type="button" className="btn btn--ghost btn--sm" onClick={run} disabled={busy}>{busy ? "Updating…" : "Add fields"}</button>
      </div>
      {msg ? <p className="form-msg adm-alerts-msg" role="status">{msg}</p> : null}
    </section>
  );
}
