"use client";

import { Icon } from "../Icon";
import { useStubSubmit } from "./StubForm";

export function AffiliateForm() {
  const { state, message, submit } = useStubSubmit("/api/affiliate");
  return (
    <form onSubmit={submit} className="form-grid">
      <div className="field"><label htmlFor="a-name">Name</label><input id="a-name" name="name" className="input" required /></div>
      <div className="field"><label htmlFor="a-email">Email</label><input id="a-email" name="email" type="email" className="input" required /></div>
      <div className="field span-2"><label htmlFor="a-url">Website or social handle</label><input id="a-url" name="channel" className="input" required /></div>
      <div className="field span-2"><label htmlFor="a-about">Tell us about your audience</label><textarea id="a-about" name="about" className="textarea" /></div>
      <div className="span-2">
        <button type="submit" className="btn btn--primary" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : <>Apply <Icon name="arrow" /></>}
        </button>
        {state !== "idle" ? <p role="status" className="muted" style={{ marginTop: 12, fontSize: 14 }}>{message}</p> : null}
      </div>
    </form>
  );
}
