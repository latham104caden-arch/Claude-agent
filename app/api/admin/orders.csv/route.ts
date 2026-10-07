import { currentAdmin } from "../../../../lib/admin";
import { allOrders, isRange, windowFor, type RangeKey } from "../../../../lib/metrics";
import { dayKey } from "../../../../lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const usd = (c: number | null) => (c === null ? "" : (c / 100).toFixed(2));

/** Team-only CSV of orders for a range (and optional search), for bookkeeping. */
export async function GET(req: Request) {
  if (!(await currentAdmin())) return new Response("Not authorized.", { status: 401 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const r = url.searchParams.get("range");
  const range: RangeKey = isRange(r) ? r : q ? "all" : "30d";
  const raw = await allOrders();
  if (!raw) return new Response("Stripe isn't connected.", { status: 503 });
  const w = windowFor(range, Date.now(), raw.orders.at(-1)?.created);
  const rows = raw.orders.filter((o) => o.created >= w.from && o.created < w.to &&
    (!q || [o.number, o.id, o.email, o.name, o.city, o.state, o.code].some((v) => v?.toLowerCase().includes(q))));

  const head = ["order", "date", "created_utc", "name", "email", "phone", "ship_to", "city", "state", "code", "subtotal", "discount", "shipping", "tax", "total", "refunded", "stripe_fee", "status", "checkout_session", "payment_intent", "mode"];
  const body = rows.map((o) => [
    o.number, dayKey(o.created), new Date(o.created * 1000).toISOString(), o.name, o.email, o.phone, o.shipTo.join(", "), o.city, o.state, o.code,
    usd(o.subtotal), usd(o.discount), usd(o.shipping), usd(o.tax), usd(o.total), usd(o.refunded), usd(o.fee), o.status, o.id, o.paymentIntent, o.livemode ? "live" : "test",
  ].map(cell).join(","));
  return new Response([head.join(","), ...body].join("\n") + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="revised-orders-${range}-${dayKey(Math.floor(Date.now() / 1000))}.csv"`,
      "cache-control": "no-store",
    },
  });
}
