import { cents, count, dayLabel } from "../../lib/admin-format";

type Day = { day: string; orders: number; collected: number };

/**
 * Daily sales, one series (no legend: the heading names it). Bars are anchored
 * to the baseline with rounded tops; each has a hover/focus tooltip, and the
 * same numbers are in a table underneath.
 */
export function SalesChart({ days }: { days: Day[] }) {
  const max = Math.max(...days.map((d) => d.collected), 0);
  const top = niceCeil(max);
  const ticks = top ? [top, top / 2, 0] : [0];
  const labelEvery = Math.max(1, Math.ceil(days.length / 5));
  return (
    <figure className="adm-chart">
      <div className="adm-chart-plot" role="img" aria-label={`Daily sales over ${days.length} days, peak ${cents(max)}`}>
        <div className="adm-chart-axis" aria-hidden>
          {ticks.map((t) => <span key={t}>{cents(t).replace(/\.00$/, "")}</span>)}
        </div>
        <div className="adm-chart-bars" style={{ ["--n" as string]: days.length }}>
          {days.map((d, i) => (
            <div key={d.day} className="adm-chart-col" tabIndex={0}>
              <i style={{ height: top ? `${(d.collected / top) * 100}%` : 0 }} />
              <span className="adm-tip" role="tooltip"><b>{dayLabel(d.day)}</b>{cents(d.collected)} · {count(d.orders)} order{d.orders === 1 ? "" : "s"}</span>
              {i % labelEvery === 0 ? <em aria-hidden>{dayLabel(d.day)}</em> : null}
            </div>
          ))}
        </div>
      </div>
      <details className="adm-chart-table">
        <summary>Show as table</summary>
        <table className="adm-table">
          <thead><tr><th>Day</th><th className="num">Orders</th><th className="num">Sales</th></tr></thead>
          <tbody>{[...days].reverse().map((d) => <tr key={d.day}><td>{dayLabel(d.day)}</td><td className="num">{count(d.orders)}</td><td className="num">{cents(d.collected)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

/** Rounds a cents amount up to a clean axis maximum (1, 2, 2.5 or 5 × 10ⁿ dollars). */
function niceCeil(c: number): number {
  if (c <= 0) return 0;
  const dollars = c / 100;
  const p = 10 ** Math.floor(Math.log10(dollars));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * p >= dollars)!;
  return step * p * 100;
}
