"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Team sign-in: email → emailed code. No marketing boxes; team emails are kept out of Omnisend. */
export function AdminSignIn() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);

  const post = async (url: string, body: object) => {
    setBusy(true); setMsg(""); setErr(false);
    try {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, message: data.message as string | undefined };
    } catch {
      return { ok: false, message: "Couldn't reach the server." };
    } finally { setBusy(false); }
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const r = await post("/api/auth/request", { email });
    if (r.ok) { setStep("code"); setCode(""); setMsg(r.message ?? "Code sent."); }
    else { setErr(true); setMsg(r.message ?? "Something went wrong."); }
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await post("/api/auth/verify", { code });
    if (r.ok) router.refresh();
    else { setErr(true); setMsg(r.message ?? "Something went wrong."); }
  };

  return (
    <div className="card adm-signin">
      <p className="eyebrow">Revised Research team</p>
      <h1 className="h3">Sign in to the dashboard</h1>
      {step === "email" ? (
        <form onSubmit={send}>
          <div className="field">
            <label htmlFor="adm-email">Team email</label>
            <input id="adm-email" type="email" className="input" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn--dark btn--block" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in code"}</button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <div className="field">
            <label htmlFor="adm-code">Sign-in code</label>
            <input id="adm-code" className="input auth-code" autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} maxLength={9} placeholder="XXXX-XXXX" required value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          </div>
          <button type="submit" className="btn btn--dark btn--block" disabled={busy || code.replace(/[^0-9a-z]/gi, "").length < 8}>{busy ? "Checking…" : "Sign in"}</button>
          <p className="drawer-note" style={{ marginTop: 12 }}>
            Sent to <b>{email}</b>. <button type="button" className="link-btn" onClick={() => send()} disabled={busy}>Send a new code</button>
          </p>
        </form>
      )}
      {msg ? <p className="form-msg" role={err ? "alert" : "status"} style={{ marginTop: 10, color: err ? "var(--danger)" : undefined }}>{msg}</p> : null}
    </div>
  );
}
