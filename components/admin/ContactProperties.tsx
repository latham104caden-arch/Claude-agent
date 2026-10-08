"use client";

import { useRef, useState } from "react";
import { parseCsv } from "../../lib/csv";

const CHUNK = 100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    // Resume where an interrupted run of this same file stopped.
    const key = `rr-contact-fields:${file.name}:${file.size}`;
    let start = 0;
    try { start = Math.min(Number(localStorage.getItem(key)) || 0, rows.length); } catch {}
    for (let i = start; i < rows.length; i += CHUNK) {
      const n = Math.min(CHUNK, rows.length - i);
      setMsg(`Updating ${(i + n).toLocaleString()} of ${rows.length.toLocaleString()}… keep this tab open.`);
      // A slow or throttled chunk is retried, then counted as failed; the run never stops part-way.
      let done = false;
      for (let attempt = 0; attempt < 4 && !done; attempt++) {
        try {
          const res = await fetch("/api/admin/contact-properties", {
            method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rows: rows.slice(i, i + CHUNK) }),
          });
          if (res.status === 401) { setMsg("Signed out. Sign in again and re-run the file."); setBusy(false); return; }
          const d = await res.json().catch(() => null);
          if (res.ok && d) { t.updated += d.updated ?? 0; t.missing += d.missing ?? 0; t.failed += d.failed ?? 0; done = true; }
        } catch {}
        if (!done) await sleep(5000 * (attempt + 1));
      }
      if (!done) t.failed += n;
      try { localStorage.setItem(key, String(i + n)); } catch {}
    }
    try { localStorage.removeItem(key); } catch {}
    setMsg(`Done${start ? ` (resumed at row ${start.toLocaleString()})` : ""}: ${t.updated.toLocaleString()} contacts updated${t.missing ? `, ${t.missing.toLocaleString()} not in Omnisend (import them first)` : ""}${t.failed ? `, ${t.failed.toLocaleString()} failed (run the file again; it's safe)` : ""}.`);
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
