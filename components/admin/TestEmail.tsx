"use client";

import { useState } from "react";

/** Sends a test from the orders@ sender to the support inbox and shows Resend's answer. */
export function TestEmail() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const run = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/test-email", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setMsg(data.message ?? (res.ok ? "Sent." : "Something went wrong."));
    } catch { setMsg("Couldn't reach the server."); }
    setBusy(false);
  };
  return (
    <div className="adm-alerts-actions" style={{ marginTop: 12 }}>
      <button type="button" className="btn btn--ghost btn--sm" onClick={run} disabled={busy}>{busy ? "Sending…" : "Send a test email to support@"}</button>
      {msg ? <p className="form-msg adm-alerts-msg" role="status">{msg}</p> : null}
    </div>
  );
}
