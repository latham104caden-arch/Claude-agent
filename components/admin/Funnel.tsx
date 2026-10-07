import { count, dayLabel } from "../../lib/admin-format";
import type { FunnelReport } from "../../lib/funnel";

type Props = {
  report: FunnelReport;
  /** Paid orders per day from Stripe, aligned to report.days. */
  ordersByDay: number[];
  orders: number;
  /** Units bought per product slug (Stripe). */
  bought: Map<string, number>;
  names: Map<string, string>;
};

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(n / d < 0.1 ? 1 : 0)}%` : "—");

/**
 * Shopper funnel: sessions reaching each step (each counted once), paid orders
 * from Stripe at the end, step-to-step conversion, then per day and per product.
 */
export function Funnel({ report, ordersByDay, orders, bought, names }: Props) {
  const s = report.sessions;
  const steps = [
    { label: "Visits", n: s.visit, note: `${count(report.pageViews)} page views` },
    { label: "Viewed a product", n: s.view },
    { label: "Added to cart", n: s.add },
    { label: "Started checkout", n: s.checkout },
    { label: "Purchased", n: orders, note: "paid orders, from Stripe" },
  ];
  const top = Math.max(s.visit, 1);
  const products = [...new Set([...report.products.keys(), ...bought.keys()])]
    .map((slug) => ({ slug, ...(report.products.get(slug) ?? { views: 0, adds: 0, checkouts: 0 }), bought: bought.get(slug) ?? 0 }))
    .sort((a, b) => b.views - a.views || b.adds - a.adds)
    .slice(0, 15);

  return (
    <>
      <div className="adm-kpis adm-kpis--funnel">
        <Rate label="Conversion rate" value={pct(orders, s.visit)} note="visits → paid order" />
        <Rate label="Add-to-cart rate" value={pct(s.add, s.visit)} note="visits that added to cart" />
        <Rate label="Cart → checkout" value={pct(s.checkout, s.add)} note="carts that started checkout" />
        <Rate label="Checkout → purchase" value={pct(orders, s.checkout)} note="checkouts that paid" />
        <Rate label="Checkout abandonment" value={s.checkout ? pct(Math.max(0, s.checkout - orders), s.checkout) : "—"} note="started checkout, didn't pay" />
      </div>

      <div className="adm-funnel" role="list" aria-label="Shopper funnel">
        {steps.map((st, i) => (
          <div key={st.label} className="adm-funnel-row" role="listitem">
            <span className="adm-funnel-label">{st.label}{st.note ? <span className="adm-sub">{st.note}</span> : null}</span>
            <span className="adm-funnel-bar"><i style={{ width: `${Math.min(100, (st.n / top) * 100)}%` }} /></span>
            <b className="adm-funnel-n">{count(st.n)}</b>
            <span className="adm-funnel-step muted">{i ? `${pct(st.n, steps[i - 1].n)} of previous` : ""}</span>
          </div>
        ))}
      </div>

      <div className="adm-grid">
        <div className="adm-scroll">
          <h3 className="adm-h5">By day</h3>
          <table className="adm-table">
            <thead><tr><th>Day</th><th className="num">Visits</th><th className="num">Product views</th><th className="num">Carts</th><th className="num">Checkouts</th><th className="num">Orders</th><th className="num">Conv.</th></tr></thead>
            <tbody>{report.days.map((d, i) => ({ d, o: ordersByDay[i] ?? 0 })).filter(({ d }) => !report.since || d.day >= report.since).reverse().map(({ d, o }) => (
              <tr key={d.day}>
                <td>{dayLabel(d.day)}</td><td className="num">{count(d.sessions.visit)}</td><td className="num">{count(d.sessions.view)}</td>
                <td className="num">{count(d.sessions.add)}</td><td className="num">{count(d.sessions.checkout)}</td><td className="num">{count(o)}</td>
                <td className="num">{pct(o, d.sessions.visit)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="adm-scroll">
          <h3 className="adm-h5">By product</h3>
          {products.length ? (
            <table className="adm-table">
              <thead><tr><th>Product</th><th className="num">Views</th><th className="num">Added</th><th className="num">In checkout</th><th className="num">Bought</th></tr></thead>
              <tbody>{products.map((p) => (
                <tr key={p.slug}>
                  <td>{names.get(p.slug) ?? p.slug}</td><td className="num">{count(p.views)}</td><td className="num">{count(p.adds)}</td>
                  <td className="num">{count(p.checkouts)}</td><td className="num">{count(p.bought)}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="muted">No product activity in this range yet.</p>}
          <p className="adm-fine muted">Added, in checkout and bought are units. Views count each product page view.</p>
        </div>
      </div>
    </>
  );
}

function Rate({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="card adm-kpi">
      <span className="adm-kpi-label">{label}</span>
      <b className="adm-kpi-value">{value}</b>
      <span className="adm-kpi-note muted">{note}</span>
    </div>
  );
}
