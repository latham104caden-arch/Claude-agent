import Link from "next/link";
import { currentAdmin } from "../../../lib/admin";
import { RANGES, allOrders, isRange, linesFor, windowFor, type OrderRow, type RangeKey } from "../../../lib/metrics";
import { cents, count, stripeLink, when } from "../../../lib/admin-format";
import { Gate } from "../../../components/admin/Gate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = 50;

const matches = (o: OrderRow, q: string) =>
  [o.number, o.id, o.email, o.name, o.city, o.state, o.code, o.phone, o.shipTo.join(" ")].some((v) => v?.toLowerCase().includes(q));

export default async function AdminOrders({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await currentAdmin())) return <Gate />;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  // A search looks across all time; otherwise the chosen range (default 30 days).
  const range: RangeKey = isRange(sp.range) ? sp.range : q ? "all" : "30d";
  const page = Math.max(1, Number(sp.page) || 1);

  const raw = await allOrders(sp.fresh === "1");
  if (!raw) return <div className="card"><p>Stripe isn&apos;t connected.</p></div>;
  const w = windowFor(range, Date.now(), raw.orders.at(-1)?.created);
  const list = raw.orders.filter((o) => o.created >= w.from && o.created < w.to && (!q || matches(o, q)));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);
  const lines = await linesFor(shown.map((o) => o.id));
  const total = list.reduce((n, o) => n + o.total, 0);
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams({ range, ...(q ? { q } : {}), ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])) });
    return `?${p}`;
  };

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h1 className="adm-title">Orders</h1>
          <p className="muted">{count(list.length)} order{list.length === 1 ? "" : "s"} · {cents(total)} collected · {w.label}</p>
        </div>
        <nav className="adm-tabs" aria-label="Date range">
          {RANGES.map((r) => <Link key={r.key} href={`/admin/orders?range=${r.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={r.key === range ? "page" : undefined}>{r.label}</Link>)}
        </nav>
      </div>

      <form className="adm-search" action="/admin/orders">
        <input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Search order #, name, email, city, state or code" aria-label="Search orders" />
        <input type="hidden" name="range" value={sp.range ?? ""} />
        <button className="btn btn--dark btn--sm" type="submit">Search</button>
        <a className="btn btn--ghost btn--sm" href={`/api/admin/orders.csv${qs({})}`}>Download CSV</a>
      </form>

      {shown.length ? (
        <div className="card adm-card adm-scroll">
          <table className="adm-table adm-orders">
            <thead><tr><th>Order</th><th>Customer</th><th>Ship to</th><th>Items</th><th>Code</th><th className="num">Total</th><th>Status</th></tr></thead>
            <tbody>
              {shown.map((o) => {
                const link = stripeLink(o.paymentIntent, o.livemode);
                return (
                  <tr key={o.id}>
                    <td><b>{o.number}</b><span className="adm-sub">{when(o.created)}</span>{link ? <a className="adm-sub" href={link} target="_blank" rel="noreferrer">Stripe ↗</a> : null}</td>
                    <td>{o.name ?? "—"}<span className="adm-sub">{o.email}</span>{o.phone ? <span className="adm-sub">{o.phone}</span> : null}</td>
                    <td className="adm-address">{o.shipTo.length ? o.shipTo.map((l, i) => <span key={i}>{l}</span>) : <span className="muted">—</span>}</td>
                    <td><ul className="adm-items">{(lines.get(o.id) ?? []).map((l, i) => <li key={i}>{l.qty} × {l.name}</li>)}{o.giftMissing ? <li><b>+ free gift {o.gift}</b> (pack by hand)</li> : null}</ul></td>
                    <td>{o.code ?? <span className="muted">—</span>}{o.discount ? <span className="adm-sub">−{cents(o.discount)}</span> : null}</td>
                    <td className="num"><b>{cents(o.total)}</b><span className="adm-sub">{o.shipping ? `incl. ${cents(o.shipping)} ship` : "free ship"}</span></td>
                    <td><span className={`badge${o.status === "Paid" ? "" : " badge--muted"}`}>{o.status}</span>{o.refunded ? <span className="adm-sub">−{cents(o.refunded)} refunded</span> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div className="card"><p className="muted">No orders{q ? ` matching “${sp.q}”` : ""} in this range.</p></div>}

      {list.length > PAGE ? (
        <nav className="adm-pager" aria-label="Pages">
          {page > 1 ? <Link href={`/admin/orders${qs({ page: page - 1 })}`}>← Newer</Link> : <span />}
          <span className="muted">Page {page} of {Math.ceil(list.length / PAGE)}</span>
          {page * PAGE < list.length ? <Link href={`/admin/orders${qs({ page: page + 1 })}`}>Older →</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
