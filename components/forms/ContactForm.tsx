"use client";

import { Icon } from "../Icon";
import { useStubSubmit } from "./StubForm";

export function ContactForm() {
  const { state, message, submit } = useStubSubmit("/api/contact");
  return (
    <form onSubmit={submit} className="form-grid">
      <div className="field"><label htmlFor="c-name">Name</label><input id="c-name" name="name" className="input" required autoComplete="name" /></div>
      <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" className="input" required autoComplete="email" /></div>
      <div className="field span-2"><label htmlFor="c-order">Order number (optional)</label><input id="c-order" name="order" className="input" /></div>
      <div className="field span-2">
        <label htmlFor="c-topic">Topic</label>
        <select id="c-topic" name="topic" className="select" defaultValue="General">
          <option>General</option><option>Order status</option><option>Product question</option><option>Wholesale</option><option>Partner program</option>
        </select>
      </div>
      <div className="field span-2"><label htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" className="textarea" required /></div>
      <div className="span-2">
        <button type="submit" className="btn btn--primary" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : <>Send Message <Icon name="arrow" /></>}
        </button>
        {state !== "idle" ? <p role="status" className="muted" style={{ marginTop: 12, fontSize: 14 }}>{message}</p> : null}
      </div>
    </form>
  );
}
