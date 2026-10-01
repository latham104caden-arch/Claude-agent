import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StubNotice } from "../../components/ui";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

/**
 * Sign-in shell. Ventra uses passwordless email codes; the same flow will go
 * here once transactional email and a database are connected.
 */
export default function AccountPage() {
  return (
    <>
      <PageHero crumbs={[{ label: "Account" }]} eyebrow="Account" title="Sign in" lead="Track orders and reorder in one tap." />
      <section className="section">
        <div className="container auth">
          <div className="card">
            <form>
              <div className="field">
                <label htmlFor="acct-email">Email</label>
                <input id="acct-email" type="email" className="input" placeholder="you@lab.org" autoComplete="email" disabled />
              </div>
              <button type="button" className="btn btn--dark btn--block" disabled>Email me a sign-in code</button>
            </form>
            <div style={{ marginTop: 18 }}>
              <StubNotice>Accounts are not connected yet. Sign-in codes will be sent once transactional email and the database are set up.</StubNotice>
            </div>
          </div>
          <p className="muted" style={{ textAlign: "center", marginTop: 18, fontSize: 14 }}>
            Need help? <Link href="/contact" style={{ color: "var(--accent-ink)" }}>Contact support</Link>
          </p>
        </div>
      </section>
    </>
  );
}
