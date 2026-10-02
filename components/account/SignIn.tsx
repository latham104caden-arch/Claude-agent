"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Two steps: email → emailed 8-character code → signed in (page refreshes into the account view). */
export function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
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
      return { ok: false, message: "Couldn't reach the server. Check your connection." };
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const r = await post("/api/auth/request", { email, firstName, lastName, phone });
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
    <div className="card">
      {step === "email" ? (
        <form onSubmit={sendCode}>
          <div className="auth-row">
            <div className="field">
              <label htmlFor="acct-fn">First name</label>
              <input id="acct-fn" className="input" autoComplete="given-name" required maxLength={60} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="acct-ln">Last name</label>
              <input id="acct-ln" className="input" autoComplete="family-name" required maxLength={60} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="acct-email">Email</label>
            <input id="acct-email" type="email" className="input" placeholder="you@lab.org" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="acct-phone">Phone (optional)</label>
            <input id="acct-phone" type="tel" className="input" placeholder="(405) 555-0101" autoComplete="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button type="submit" className="btn btn--dark btn--block" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in code"}</button>
          <p className="drawer-note" style={{ marginTop: 12 }}>Use the email you check out with. No password needed.</p>
        </form>
      ) : (
        <form onSubmit={verify}>
          <div className="field">
            <label htmlFor="acct-code">Sign-in code</label>
            <input id="acct-code" className="input auth-code" inputMode="text" autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} maxLength={9} placeholder="XXXX-XXXX" required value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          </div>
          <button type="submit" className="btn btn--dark btn--block" disabled={busy || code.replace(/[^0-9a-z]/gi, "").length < 8}>{busy ? "Checking…" : "Sign in"}</button>
          <p className="drawer-note" style={{ marginTop: 12 }}>
            Sent to <b>{email}</b>. <button type="button" className="link-btn" onClick={() => sendCode()} disabled={busy}>Send a new code</button> · <button type="button" className="link-btn" onClick={() => { setStep("email"); setMsg(""); }}>Use another email</button>
          </p>
        </form>
      )}
      {msg ? <p className="form-msg" role={err ? "alert" : "status"} style={{ marginTop: 10, color: err ? "var(--danger)" : undefined }}>{msg}</p> : null}
    </div>
  );
}
