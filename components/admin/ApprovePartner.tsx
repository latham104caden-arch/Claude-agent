"use client";

import { useState } from "react";

/**
 * Approve a partner request: makes the lab's private checkout link and emails
 * it to them. The link is shown with a copy button so the team can send it too.
 */
export function ApprovePartner({ id, url: initialUrl, status }: { id: string; url: string | null; status: string | null }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const approve = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/partner-approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await res.json().catch(() => ({}));
      if (data.url) setUrl(data.url);
      setMsg(data.message ?? (res.ok ? "Approved." : "Something went wrong."));
    } catch { setMsg("Couldn't reach the server."); }
    setBusy(false);
  };
  const copy = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  const closed = status === "paid" || status === "expired";
  return (
    <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
      {status ? <span className="adm-sub">{status === "paid" ? "Paid ✓" : status === "expired" ? "Link expired" : "Approved"}</span> : null}
      {!status || closed ? (
        <button type="button" className="btn btn--primary btn--sm" onClick={approve} disabled={busy || status === "paid"}>
          {busy ? "Approving…" : status === "expired" ? "Approve again" : "Approve & email link"}
        </button>
      ) : null}
      {url && status !== "paid" ? (
        <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
          {status === "open" || (!status && url) ? <button type="button" className="btn btn--ghost btn--sm" onClick={approve} disabled={busy}>{busy ? "Sending…" : "Resend email"}</button> : null}
        </span>
      ) : null}
      {msg ? <span className="adm-sub" role="status" style={{ maxWidth: 280, textAlign: "right" }}>{msg}</span> : null}
    </div>
  );
}
