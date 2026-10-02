import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StubNotice } from "../../components/ui";
import { SignIn } from "../../components/account/SignIn";
import { Reorder, SignOut } from "../../components/account/AccountActions";
import { authConfigured, currentEmail } from "../../lib/auth";
import { ordersFor, type Order } from "../../lib/account";
import { money } from "../../lib/format";

export const metadata: Metadata = { title: "Account", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Passwordless sign-in (emailed code) and order history from Stripe. */
export default async function AccountPage() {
  const email = await currentEmail();
  if (!email) {
    return (
      <>
        <PageHero crumbs={[{ label: "Account" }]} eyebrow="Account" title="Sign in" lead="Track orders and reorder in one tap." />
        <section className="section">
          <div className="container auth">
            {authConfigured() ? <SignIn /> : <div className="card"><StubNotice>Accounts are being set up. Check back soon.</StubNotice></div>}
            <p className="muted" style={{ textAlign: "center", marginTop: 18, fontSize: 14 }}>
              Need help? <Link href="/contact" style={{ color: "var(--accent-ink)" }}>Contact support</Link>
            </p>
          </div>
        </section>
      </>
    );
  }

  let orders: Order[] | null = null;
  let failed = false;
  try { orders = await ordersFor(email); } catch (err) { failed = true; console.error("[account] orders", err); }

  return (
    <>
      <PageHero crumbs={[{ label: "Account" }]} eyebrow="Account" title="Your orders" lead={<>Signed in as <b>{email}</b>.</>} />
      <section className="section">
        <div className="container acct-orders">
          {failed ? <p className="muted">We couldn&apos;t load your orders just now. Please refresh in a moment.</p>
            : !orders || orders.length === 0 ? (
              <div className="card acct-empty">
                <p>No orders yet for this email.</p>
                <Link href="/shop" className="btn btn--primary">Browse Compounds</Link>
              </div>
            ) : orders.map((o) => (
              <article className="card acct-order" key={o.id}>
                <header>
                  <div>
                    <b>Order {o.number}</b>
                    <span className="muted">{new Date(o.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                  <span className="badge">{o.status}</span>
                </header>
                <ul>
                  {o.items.map((i, n) => <li key={n}><span>{i.qty} × {i.name}</span><span>{money(i.amount)}</span></li>)}
                </ul>
                {o.shipTo ? <p className="muted acct-ship">Ships to {o.shipTo}</p> : null}
                <footer>
                  <b>Total {money(o.total)}</b>
                  <Reorder lines={o.reorder} />
                </footer>
              </article>
            ))}
          <div className="acct-foot"><SignOut /></div>
        </div>
      </section>
    </>
  );
}
