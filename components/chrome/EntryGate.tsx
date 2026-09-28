"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE } from "../../lib/site";
import { BrandMark } from "../Brand";
import { Icon } from "../Icon";

/**
 * Researcher verification gate (age 21+ and research-use acknowledgement).
 * Client-side only for now: the answer is kept in localStorage. When accounts
 * exist, record the attestation server-side against the customer too.
 *
 * Legal pages stay readable behind the gate so a visitor can read the
 * disclaimer before agreeing to it.
 */
const KEY = "rr-gate-v1";
const OPEN_PATHS = ["/disclaimer", "/privacy-policy", "/terms", "/shipping-policy", "/refund-policy"];

const TYPES = [
  "Academic / university lab",
  "Independent researcher",
  "Commercial / industry lab",
  "Clinical research organization",
  "Other",
];

export function EntryGate() {
  const [show, setShow] = useState(false);
  const [age, setAge] = useState(false);
  const [ruo, setRuo] = useState(false);
  const [type, setType] = useState("");

  useEffect(() => {
    if (OPEN_PATHS.some((p) => location.pathname.startsWith(p))) return;
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [show]);

  if (!show) return null;

  const ok = age && ruo && type !== "";

  const accept = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ at: new Date().toISOString(), type }));
    } catch {}
    setShow(false);
  };

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="gate-card">
        <div className="brand">
          <BrandMark />
          <span className="brand-word"><b>Revised</b><span>Research</span></span>
        </div>
        <h2 id="gate-title">Researcher <em>Verification</em></h2>
        <p>{SITE.name} supplies compounds for laboratory research only. Please confirm the following to continue.</p>

        <label className="check">
          <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} />
          <span>I am {SITE.minAge} years of age or older.</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={ruo} onChange={(e) => setRuo(e.target.checked)} />
          <span>I understand these products are for research use only and are not for human or veterinary use.</span>
        </label>

        <div className="field">
          <label htmlFor="gate-type">What type of researcher are you?</label>
          <select id="gate-type" className="select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="" disabled>Select one…</option>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <button type="button" className="btn btn--primary btn--block" disabled={!ok} onClick={accept}>
          Enter Site <Icon name="arrow" />
        </button>

        <p className="gate-fine">
          By entering you agree to our <Link href="/terms">Terms</Link> and <Link href="/disclaimer">Disclaimer</Link>.
        </p>
        <p className="gate-exit">Not a researcher? <a href="https://www.google.com/">Exit</a></p>
      </div>
    </div>
  );
}
