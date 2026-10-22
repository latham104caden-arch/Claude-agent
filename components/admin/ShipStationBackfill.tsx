"use client";

import { useState } from "react";

type Row = { id: string; number: string; created: number; name: string | null; place: string; total: number; status: string; live: boolean; items: string[] };
type Result = { state: "sent" | "already" | "skipped" | "failed"; message: string };

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const day = (s: number) => new Date(s * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * Sends past paid orders to ShipStation for Ikonik. Lists them first so the team
 * can untick anything already shipped by hand; each send checks ShipStation
 * first, so an order that's already there is never added twice.
 */
export function ShipStationBackfill() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [store, setStore] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, Result>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setBusy(true); setMsg(""); setResults({});
    try {
      const res = await fetch("/api/admin/shipstation-backfill");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setMsg(data.message ?? "Couldn't load orders."); setBusy(false); return; }
      setRows(data.orders);
      setStore(data.store);
      // Partly refunded orders start unticked: check what's still owed before shipping them.
      setPicked(new Set((data.orders as Row[]).filter((o) => o.status === "Paid").map((o) => o.id)));
      if (!data.orders.length) setMsg("No paid orders to send.");
      else if (data.capped) setMsg("Showing the newest 150 orders.");
    } catch { setMsg("Couldn't reach the server."); }
    setBusy(false);
  };

  const send = async () => {
    const ids = (rows ?? []).filter((o) => picked.has(o.id)).map((o) => o.id);
    if (!ids.length || !confirm(`Send ${ids.length} order${ids.length === 1 ? "" : "s"} to ShipStation? Ikonik will pack and ship ${ids.length === 1 ? "it" : "them"}.`)) return;
    setBusy(true); setMsg("");
    let sent = 0, failed = 0;
    for (const id of ids) {
      setResults((r) => ({ ...r, [id]: { state: "skipped", message: "Sending…" } }));
      try {
        const res = await fetch("/api/admin/shipstation-backfill", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
        const data = await res.json().catch(() => ({}));
        const state: Result["state"] = res.ok && data.ok ? data.result : "failed";
        if (state === "sent") sent++;
        if (state === "failed") failed++;
        setResults((r) => ({ ...r, [id]: { state, message: data.message ?? (res.ok ? "Done." : "Failed.") } }));
        // Stop early if the keys are wrong: every other order would fail the same way.
        if (res.status === 503 || /\(401\)/.test(data.message ?? "")) { setMsg(data.message); break; }
      } catch {
        failed++;
        setResults((r) => ({ ...r, [id]: { state: "failed", message: "Couldn't reach the server." } }));
      }
    }
    setMsg((m) => m || `Sent ${sent}.${failed ? ` ${failed} failed: press Send again to retry them (orders already in ShipStation are skipped).` : ""}`);
    setBusy(false);
  };

  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <section className="card adm-alerts" aria-label="Send past orders to ShipStation">
      <div>
        <h2 className="h4">Past orders → ShipStation</h2>
        <p className="muted">New orders go to ShipStation automatically. This sends orders from before that, so Ikonik can ship them. Untick anything you already shipped yourself. Orders already in ShipStation are skipped, and refunded or test orders are never sent. {store ? `They go to ShipStation store ${store}.` : "No SHIPSTATION_STORE_ID is set, so they land in ShipStation's Manual Orders store."}</p>
      </div>
      <div className="adm-alerts-actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={load} disabled={busy}>{rows ? "Reload orders" : "Load past orders"}</button>
        {rows?.length ? <button type="button" className="btn btn--primary btn--sm" onClick={send} disabled={busy || !picked.size}>{busy ? "Working…" : `Send ${picked.size} to ShipStation`}</button> : null}
      </div>
      {msg ? <p className="form-msg adm-alerts-msg" role="status">{msg}</p> : null}
      {rows?.length ? (
        <table className="adm-table">
          <tbody>{rows.map((o) => (
            <tr key={o.id}>
              <td><label className="check"><input type="checkbox" checked={picked.has(o.id)} onChange={() => toggle(o.id)} disabled={busy} /><span>{o.number}{o.live ? "" : " (test)"}</span></label><span className="adm-sub">{day(o.created)}</span></td>
              <td>{o.name ?? "—"}<span className="adm-sub">{o.place}</span><span className="adm-sub">{o.items.join(" · ")}</span></td>
              <td className="num">{usd(o.total)}{o.status !== "Paid" ? <span className="adm-sub">{o.status}</span> : null}{results[o.id] ? <span className="adm-sub">{results[o.id].message}</span> : null}</td>
            </tr>
          ))}</tbody>
        </table>
      ) : null}
    </section>
  );
}
