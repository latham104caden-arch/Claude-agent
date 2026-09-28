"use client";

import { Icon } from "../Icon";
import { useStubSubmit } from "./StubForm";

export function Newsletter() {
  const { state, message, submit } = useStubSubmit("/api/newsletter");
  return (
    <section className="newsletter">
      <div className="container newsletter-inner">
        <div>
          <p className="eyebrow">Stay in the loop</p>
          <h2 className="h2" style={{ fontSize: "clamp(26px, 3vw, 36px)" }}>New compounds, restocks and <em>lab notes.</em></h2>
        </div>
        <div>
          <form onSubmit={submit} noValidate={false}>
            <label htmlFor="nl-email" className="sr-only">Email address</label>
            <input id="nl-email" name="email" type="email" required className="input" placeholder="you@lab.org" autoComplete="email" />
            <button type="submit" className="btn btn--navy" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : <>Subscribe <Icon name="arrow" /></>}
            </button>
          </form>
          <p className="form-msg" role="status">
            {state === "idle" ? "No spam. Unsubscribe any time." : message}
          </p>
        </div>
      </div>
    </section>
  );
}
