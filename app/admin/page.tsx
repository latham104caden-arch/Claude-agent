import Link from "next/link";
import { currentAdmin } from "../../lib/admin";
import {
  RANGES, allOrders, codeBreakdown, dailySeries, isRange, linesFor, previousWindow, productBreakdown,
  reconcile, refundsIn, stateBreakdown, summarize, windowFor, type RangeKey, type Summary,
} from "../../lib/metrics";
import { cents, change, count, dayLabel, tzName, when } from "../../lib/admin-format";
import { dayKey } from "../../lib/metrics";
import { countSubscriptions, storageReady, TEAM_PREFIX } from "../../lib/push";
import { Gate } from "../../components/admin/Gate";
import { SalesChart } from "../../components/admin/SalesChart";
import { OrderAlerts } from "../../components/admin/OrderAlerts";
import { SyncCustomers } from "../../components/admin/SyncCustomers";
import { SyncProducts } from "../../components/admin/SyncProducts";
import { ContactProperties } from "../../components/admin/ContactProperties";
import { Funnel } from "../../components/admin/Funnel";
import { funnelReady, report } from "../../lib/funnel";
import { getCatalog } from "../../lib/catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Product line items are fetched per order; past this many orders the product table says it's partial. */
const PRODUCT_ORDER_CAP = 400;

export default async function AdminOverview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await currentAdmin())) return <Gate />;
  const sp = await searchParams;
  const range: RangeKey = isRange(sp.range) ? sp.range : "30d";

  const raw = await allOrders(sp.fresh === "1");
  if (!raw) return <div className="card"><p>Stripe isn&apos;t connected (STRIPE_SECRET_KEY, and CHECKOUT_LIVE=true for a live key).</p></div>;

  const first = raw.orders.at(-1)?.created;
  const w = windowFor(range, Date.now(), first);
  const prev = range === "all" ? null : previousWindow(w);
  const inW = raw.orders.filter((o) => o.created >= w.from && o.created < w.to);
  const capped = inW.slice(0, PRODUCT_ORDER_CAP);

  const [funnel, refunds, prevRefunds, rec, lines, devices] = await Promise.all([
    report(w.days).catch((err) => { console.error("[admin] funnel", err); return null; }),
    refundsIn(w),
    prev ? refundsIn(prev) : Promise.resolve(0),
    reconcile(raw.orders, w),
    linesFor(capped.map((o) => o.id)),
    storageReady() ? countSubscriptions(TEAM_PREFIX).catch(() => null) : Promise.resolve(null),
  ]);
  const s = summarize(raw.orders, w, refunds);
  const p = prev ? summarize(raw.orders, prev, prevRefunds) : null;
  const days = dailySeries(raw.orders, w);
  const products = productBreakdown(lines).slice(0, 12);
  const codes = codeBreakdown(inW);
  const states = stateBreakdown(inW).slice(0, 10);
  const bySku = new Map(getCatalog().flatMap((p) => p.variants.map((v) => [v.sku, p.slug] as const)));
  const names = new Map(getCatalog().map((p) => [p.slug, p.name]));
  // The funnel compares only orders placed since tracking began (earlier orders have no visits on record).
  const since = funnel?.since ?? null;
  const tracked = (unix: number) => !!since && dayKey(unix) >= since;
  const funnelOrders = inW.filter((o) => tracked(o.created));
  const bought = new Map<string, number>();
  for (const o of funnelOrders) for (const l of lines.get(o.id) ?? []) {
    const slug = l.sku ? bySku.get(l.sku) : undefined;
    if (slug) bought.set(slug, (bought.get(slug) ?? 0) + l.qty);
  }
  const issues = rec ? rec.mismatched.length + rec.missingCharge.length + rec.outsideCheckout.length : 0;

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h1 className="adm-title">Overview</h1>
          <p className="muted">
            {raw.livemode === false ? <span className="badge badge--muted">Test mode</span> : raw.livemode ? <span className="badge">Live</span> : null}{" "}
            From Stripe · updated {when(Math.floor(raw.fetchedAt / 1000))} {tzName()} · <Link href={`/admin?range=${range}&fresh=1`}>Refresh</Link>
          </p>
        </div>
        <nav className="adm-tabs" aria-label="Date range">
          {RANGES.map((r) => <Link key={r.key} href={`/admin?range=${r.key}`} aria-current={r.key === range ? "page" : undefined}>{r.label}</Link>)}
        </nav>
      </div>

      <section className="adm-kpis" aria-label="Key numbers">
        <Kpi label="Sales collected" value={cents(s.collected)} delta={p && change(s.collected, p.collected)} />
        <Kpi label="Orders" value={count(s.orders)} delta={p && change(s.orders, p.orders)} />
        <Kpi label="Average order" value={cents(s.aov)} delta={p && change(s.aov, p.aov)} />
        <Kpi label="Net after refunds & fees" value={cents(s.net)} delta={p && change(s.net, p.net)} note={s.fees === null ? "Some fees not settled yet" : undefined} />
        <Kpi label="Customers" value={count(s.customers)} note={`${count(s.newCustomers)} new · ${count(s.returningCustomers)} returning`} />
        <Kpi label="Discounts given" value={cents(s.discounts)} note={s.gross ? `${((s.discounts / s.gross) * 100).toFixed(1)}% of gross` : undefined} />
      </section>

      <section className="card adm-card">
        <h2 className="h4">Daily sales <span className="muted">· {w.label}</span></h2>
        <SalesChart days={days} />
      </section>

      <section className="card adm-card">
        <h2 className="h4">Shopper funnel <span className="muted">· {w.label}</span></h2>
        {funnel ? (
          <>
            <Funnel report={funnel} ordersByDay={days.map((d) => (since && d.day >= since ? d.orders : 0))} orders={funnelOrders.length} bought={bought} names={names} />
            {since && since > w.days[0] ? <p className="adm-fine muted">Tracking started {dayLabel(since)}; orders before then aren&apos;t in the funnel.</p> : null}
          </>
        ) : funnelReady() ? (
          <p className="muted">Couldn&apos;t load funnel numbers just now. Refresh in a moment.</p>
        ) : (
          <p className="muted">Funnel tracking needs a Redis store: in Vercel, open the project → Storage → Create → <b>Upstash for Redis</b> (free tier), connect it to this project, then redeploy. Counting starts from that moment.</p>
        )}
      </section>

      <div className="adm-grid">
        <section className="card adm-card">
          <h2 className="h4">Money</h2>
          <Breakdown s={s} />
        </section>
        <section className={`card adm-card adm-check${issues ? " is-bad" : ""}`}>
          <h2 className="h4">Accuracy check</h2>
          {!rec ? <p className="muted">Stripe not connected.</p> : issues === 0 ? (
            <p>All {count(rec.checked)} orders in this range match their card charges, and there are no payments in Stripe outside checkout.</p>
          ) : (
            <ul className="adm-issues">
              {rec.mismatched.map((m) => <li key={m.number}>Order {m.number}: order total {cents(m.order)} but card charged {cents(m.charged)}.</li>)}
              {rec.missingCharge.map((n) => <li key={n}>Order {n}: paid, but no card charge found.</li>)}
              {rec.outsideCheckout.map((c) => <li key={c.id}>Payment {cents(c.amount)} on {when(c.created)} wasn&apos;t a website checkout (e.g. a manual charge). It&apos;s not counted above.</li>)}
            </ul>
          )}
          {raw.truncated ? <p className="muted">Only the newest 5,000 checkouts were read.</p> : null}
          <p className="muted adm-fine">Orders = paid Stripe checkouts. Refunds count in the period they were issued. Fees come from Stripe&apos;s balance transactions. Days run midnight to midnight {tzName()}.</p>
        </section>
      </div>

      <div className="adm-grid">
        <section className="card adm-card">
          <h2 className="h4">Top products</h2>
          {products.length ? (
            <table className="adm-table">
              <thead><tr><th>Product</th><th className="num">Units</th><th className="num">Sales</th></tr></thead>
              <tbody>{products.map((r) => <tr key={r.sku ?? r.name}><td>{r.name}</td><td className="num">{count(r.units)}</td><td className="num">{cents(r.sales)}</td></tr>)}</tbody>
            </table>
          ) : <p className="muted">No orders in this range.</p>}
          {inW.length > PRODUCT_ORDER_CAP ? <p className="muted adm-fine">From the newest {PRODUCT_ORDER_CAP} orders in this range. Sales are before order-level discounts.</p> : <p className="muted adm-fine">Sales are before order-level discounts.</p>}
        </section>
        <section className="card adm-card">
          <h2 className="h4">Codes & bulk pricing</h2>
          {codes.length ? (
            <table className="adm-table">
              <thead><tr><th>Code</th><th className="num">Orders</th><th className="num">Discount</th><th className="num">Sales</th></tr></thead>
              <tbody>{codes.map((c) => <tr key={c.code}><td>{c.code}</td><td className="num">{count(c.orders)}</td><td className="num">{cents(c.discount)}</td><td className="num">{cents(c.collected)}</td></tr>)}</tbody>
            </table>
          ) : <p className="muted">No codes used in this range.</p>}
        </section>
      </div>

      <div className="adm-grid">
        <section className="card adm-card">
          <h2 className="h4">Recent orders</h2>
          {inW.length ? (
            <table className="adm-table">
              <tbody>{inW.slice(0, 8).map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders?q=${o.number}`}>{o.number}</Link><span className="adm-sub">{when(o.created)}</span></td>
                  <td>{o.name ?? o.email ?? "—"}<span className="adm-sub">{[o.city, o.state].filter(Boolean).join(", ")}</span></td>
                  <td className="num">{cents(o.total)}{o.status !== "Paid" ? <span className="adm-sub">{o.status}</span> : null}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="muted">No orders in this range.</p>}
          <p className="adm-fine"><Link href={`/admin/orders?range=${range}`}>All orders →</Link></p>
        </section>
        <section className="card adm-card">
          <h2 className="h4">Top states</h2>
          {states.length ? (
            <table className="adm-table">
              <thead><tr><th>State</th><th className="num">Orders</th><th className="num">Sales</th></tr></thead>
              <tbody>{states.map((r) => <tr key={r.state}><td>{r.state}</td><td className="num">{count(r.orders)}</td><td className="num">{cents(r.collected)}</td></tr>)}</tbody>
            </table>
          ) : <p className="muted">No orders in this range.</p>}
        </section>
      </div>

      <OrderAlerts devices={devices} />
      <SyncCustomers />
      <SyncProducts />
      <ContactProperties />
    </div>
  );
}

function Kpi({ label, value, delta, note }: { label: string; value: string; delta?: string | null; note?: string }) {
  const down = delta?.startsWith("−");
  return (
    <div className="card adm-kpi">
      <span className="adm-kpi-label">{label}</span>
      <b className="adm-kpi-value">{value}</b>
      {delta ? <span className={`adm-kpi-delta${down ? " is-down" : ""}`}>{down ? "▼" : "▲"} {delta} <span className="muted">vs previous</span></span> : null}
      {note ? <span className="adm-kpi-note muted">{note}</span> : null}
    </div>
  );
}

function Breakdown({ s }: { s: Summary }) {
  const rows: [string, number, boolean?][] = [
    ["Gross sales", s.gross],
    ["− Discounts", -s.discounts],
    ["+ Shipping charged", s.shipping],
    ["+ Tax", s.tax],
    ["= Collected", s.collected, true],
    ["− Refunds issued", -s.refunds],
    ["− Stripe fees", -(s.fees ?? 0)],
    ["= Net", s.net, true],
  ];
  return (
    <table className="adm-table adm-money">
      <tbody>{rows.map(([l, v, strong]) => <tr key={l} className={strong ? "is-total" : undefined}><td>{l}</td><td className="num">{v < 0 ? `−${cents(-v)}` : cents(v)}</td></tr>)}</tbody>
    </table>
  );
}
