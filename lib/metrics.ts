import type Stripe from "stripe";
import { getStripe } from "./stripe";
import { ADMIN_TZ } from "./admin";

/**
 * Team dashboard numbers, read straight from Stripe (the payment system of
 * record), so they can't drift from what was actually charged. All money is
 * summed in integer cents and only turned into dollars for display.
 *
 * An order = a Checkout Session with payment_status "paid". Refunds are counted
 * in the period they were issued (Stripe refunds), fees from each charge's
 * balance transaction. A reconciliation pass compares every order with its
 * charge and looks for payments in Stripe that didn't come through checkout.
 */

export type RangeKey = "today" | "7d" | "30d" | "90d" | "ytd" | "all";
export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "ytd", label: "Year to date" },
  { key: "all", label: "All time" },
];
export const isRange = (s: unknown): s is RangeKey => RANGES.some((r) => r.key === s);

export type CodeKind = "sale" | "first" | "reward" | "creator" | "bulk" | "none";

export type OrderRow = {
  id: string;
  number: string;
  created: number; // unix seconds
  email: string | null;
  name: string | null;
  state: string | null;
  city: string | null;
  /** Full ship-to lines (name, street, city/state/ZIP) for packing labels. */
  shipTo: string[];
  phone: string | null;
  /** Cents. subtotal is before discounts; total is what the card was charged. */
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  refunded: number;
  fee: number | null;
  code: string | null;
  codeKind: CodeKind;
  /** Free-gift SKU (lib/gift.ts) when the order qualified; giftMissing = it isn't a line item, so pack it by hand. */
  gift: string | null;
  giftMissing: boolean;
  status: "Paid" | "Partly refunded" | "Refunded";
  chargeId: string | null;
  chargeAmount: number | null;
  paymentIntent: string | null;
  livemode: boolean;
};

export type LineRow = { sku: string | null; name: string; qty: number; amount: number };

type Raw = { orders: OrderRow[]; fetchedAt: number; livemode: boolean | null; truncated: boolean };

const MAX_SESSIONS = 5000;
let cache: Raw | null = null;
const CACHE_MS = 60_000;

export function codeOf(m: Stripe.Metadata | null): { code: string | null; kind: CodeKind } {
  if (!m) return { code: null, kind: "none" };
  if (m.sale_code) return { code: m.sale_code, kind: "sale" };
  if (m.first_order_code) return { code: m.first_order_code, kind: "first" };
  if (m.reward_code) return { code: m.reward_code, kind: "reward" };
  if (m.adz_code) return { code: m.adz_code, kind: "creator" };
  if (m.bulk_tier) return { code: `Bulk ${m.bulk_tier}+`, kind: "bulk" };
  return { code: null, kind: "none" };
}

function toRow(s: Stripe.Checkout.Session): OrderRow {
  const pi = typeof s.payment_intent === "object" ? s.payment_intent : null;
  const charge = pi && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
  const bt = charge && typeof charge.balance_transaction === "object" ? charge.balance_transaction : null;
  const refunded = charge?.amount_refunded ?? 0;
  const total = s.amount_total ?? 0;
  const ship = s.collected_information?.shipping_details?.address ?? s.customer_details?.address ?? null;
  const { code, kind } = codeOf(s.metadata);
  return {
    id: s.id,
    number: s.id.slice(-8).toUpperCase(),
    created: s.created,
    email: s.customer_details?.email?.toLowerCase() ?? null,
    name: s.collected_information?.shipping_details?.name ?? s.customer_details?.name ?? null,
    state: ship?.state ?? null,
    city: ship?.city ?? null,
    shipTo: ship ? [
      s.collected_information?.shipping_details?.name ?? s.customer_details?.name ?? "",
      ship.line1 ?? "",
      ship.line2 ?? "",
      `${ship.city ?? ""}${ship.city && ship.state ? ", " : ""}${ship.state ?? ""} ${ship.postal_code ?? ""}`.trim(),
    ].filter(Boolean) : [],
    phone: s.customer_details?.phone ?? null,
    subtotal: s.amount_subtotal ?? 0,
    discount: s.total_details?.amount_discount ?? 0,
    shipping: s.total_details?.amount_shipping ?? 0,
    tax: s.total_details?.amount_tax ?? 0,
    total,
    refunded,
    fee: bt ? bt.fee : null,
    code,
    codeKind: kind,
    gift: s.metadata?.gift_sku || null,
    giftMissing: s.metadata?.gift_line === "missing",
    status: refunded <= 0 ? "Paid" : refunded >= total ? "Refunded" : "Partly refunded",
    chargeId: charge?.id ?? null,
    chargeAmount: charge ? charge.amount : null,
    paymentIntent: typeof s.payment_intent === "string" ? s.payment_intent : pi?.id ?? null,
    livemode: s.livemode,
  };
}

/** Every paid order, newest first (cached for a minute; `fresh` skips the cache). */
export async function allOrders(fresh = false): Promise<Raw | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  if (!fresh && cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache;
  const orders: OrderRow[] = [];
  let seen = 0;
  let truncated = false;
  let livemode: boolean | null = null;
  for await (const s of stripe.checkout.sessions.list({ limit: 100, expand: ["data.payment_intent.latest_charge.balance_transaction"] })) {
    livemode ??= s.livemode;
    if (++seen > MAX_SESSIONS) { truncated = true; break; }
    if (s.payment_status === "paid") orders.push(toRow(s));
  }
  cache = { orders, fetchedAt: Date.now(), livemode, truncated };
  return cache;
}

/** A paid order's items never change, so they're kept once fetched. */
const lineCache = new Map<string, LineRow[]>();

/** Line items for some orders (a few at a time, to stay inside Stripe's rate limits). */
export async function linesFor(orderIds: string[]): Promise<Map<string, LineRow[]>> {
  const stripe = getStripe();
  const out = new Map<string, LineRow[]>();
  if (!stripe) return out;
  const queue = orderIds.filter((oid) => {
    const hit = lineCache.get(oid);
    if (hit) out.set(oid, hit);
    return !hit;
  });
  const worker = async () => {
    for (let oid = queue.shift(); oid; oid = queue.shift()) {
      const li = await stripe.checkout.sessions.listLineItems(oid, { limit: 100, expand: ["data.price.product"] });
      const rows = li.data.map((l) => {
        const p = l.price?.product;
        const sku = p && typeof p === "object" && "metadata" in p ? p.metadata?.sku ?? null : null;
        return { sku, name: l.description ?? "Item", qty: l.quantity ?? 1, amount: l.amount_subtotal ?? 0 };
      });
      if (lineCache.size > 20_000) lineCache.clear();
      lineCache.set(oid, rows);
      out.set(oid, rows);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return out;
}

/* ── Time ranges, in the business time zone ─────────────────────────────── */

const dayKeyFmt = () => new Intl.DateTimeFormat("en-CA", { timeZone: ADMIN_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
export const dayKey = (unixSec: number) => dayKeyFmt().format(new Date(unixSec * 1000));

/** Minutes the zone is ahead of UTC at instant `ms`. */
function offsetMin(ms: number): number {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: ADMIN_TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms) / 60_000;
}

/** Unix seconds of local midnight starting day "YYYY-MM-DD". */
export function midnight(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - offsetMin(guess) * 60_000;
  t = guess - offsetMin(t) * 60_000; // second pass handles DST edges
  return Math.floor(t / 1000);
}

const addDays = (key: string, n: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export type Window = { from: number; to: number; days: string[]; label: string };

export function windowFor(range: RangeKey, now = Date.now(), firstOrder?: number): Window {
  const today = dayKey(Math.floor(now / 1000));
  const span = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 0;
  let start: string;
  if (span) start = addDays(today, -(span - 1));
  else if (range === "ytd") start = `${today.slice(0, 4)}-01-01`;
  else start = firstOrder ? dayKey(firstOrder) : today;
  const days: string[] = [];
  for (let k = start; k <= today; k = addDays(k, 1)) days.push(k);
  return { from: midnight(start), to: midnight(addDays(today, 1)), days, label: RANGES.find((r) => r.key === range)!.label };
}

/** The same-length period just before `w` (for "vs previous" comparisons). */
export function previousWindow(w: Window): Window {
  const n = w.days.length;
  const start = addDays(w.days[0], -n);
  const days = Array.from({ length: n }, (_, i) => addDays(start, i));
  return { from: midnight(start), to: w.from, days, label: "previous" };
}

/* ── Summaries ──────────────────────────────────────────────────────────── */

export type Summary = {
  orders: number;
  gross: number; // subtotal before discounts
  discounts: number;
  shipping: number;
  tax: number;
  collected: number; // charged to cards
  refunds: number; // refunds issued in the window
  fees: number | null; // Stripe fees on the window's orders (null if any is unknown)
  net: number; // collected − refunds − fees
  aov: number; // collected / orders
  customers: number;
  newCustomers: number;
  returningCustomers: number;
};

export function summarize(all: OrderRow[], w: Window, refundsIssued: number): Summary {
  const inW = all.filter((o) => o.created >= w.from && o.created < w.to);
  const firstSeen = new Map<string, number>();
  for (const o of all) if (o.email) firstSeen.set(o.email, Math.min(firstSeen.get(o.email) ?? Infinity, o.created));
  const emails = new Set(inW.map((o) => o.email).filter(Boolean) as string[]);
  let newC = 0;
  for (const e of emails) if ((firstSeen.get(e) ?? 0) >= w.from) newC++;
  const sum = (f: (o: OrderRow) => number) => inW.reduce((n, o) => n + f(o), 0);
  const collected = sum((o) => o.total);
  const feesKnown = inW.every((o) => o.fee !== null);
  const fees = feesKnown ? sum((o) => o.fee ?? 0) : null;
  return {
    orders: inW.length,
    gross: sum((o) => o.subtotal),
    discounts: sum((o) => o.discount),
    shipping: sum((o) => o.shipping),
    tax: sum((o) => o.tax),
    collected,
    refunds: refundsIssued,
    fees,
    net: collected - refundsIssued - (fees ?? 0),
    aov: inW.length ? Math.round(collected / inW.length) : 0,
    customers: emails.size,
    newCustomers: newC,
    returningCustomers: emails.size - newC,
  };
}

/** Succeeded refunds created inside the window, in cents. */
export async function refundsIn(w: Window): Promise<number> {
  const stripe = getStripe();
  if (!stripe) return 0;
  let cents = 0;
  for await (const r of stripe.refunds.list({ created: { gte: w.from, lt: w.to }, limit: 100 })) {
    if (r.status === "succeeded") cents += r.amount;
  }
  return cents;
}

export function dailySeries(all: OrderRow[], w: Window): { day: string; orders: number; collected: number }[] {
  const by = new Map(w.days.map((d) => [d, { day: d, orders: 0, collected: 0 }]));
  for (const o of all) {
    if (o.created < w.from || o.created >= w.to) continue;
    const row = by.get(dayKey(o.created));
    if (row) { row.orders++; row.collected += o.total; }
  }
  return [...by.values()];
}

export function codeBreakdown(orders: OrderRow[]) {
  const by = new Map<string, { code: string; kind: CodeKind; orders: number; discount: number; collected: number }>();
  for (const o of orders) {
    if (!o.code) continue;
    const k = o.code.toUpperCase();
    const row = by.get(k) ?? { code: o.code, kind: o.codeKind, orders: 0, discount: 0, collected: 0 };
    row.orders++; row.discount += o.discount; row.collected += o.total;
    by.set(k, row);
  }
  return [...by.values()].sort((a, b) => b.collected - a.collected);
}

export function stateBreakdown(orders: OrderRow[]) {
  const by = new Map<string, { state: string; orders: number; collected: number }>();
  for (const o of orders) {
    const s = o.state || "Unknown";
    const row = by.get(s) ?? { state: s, orders: 0, collected: 0 };
    row.orders++; row.collected += o.total;
    by.set(s, row);
  }
  return [...by.values()].sort((a, b) => b.collected - a.collected);
}

export function productBreakdown(lines: Map<string, LineRow[]>) {
  const by = new Map<string, { name: string; sku: string | null; units: number; sales: number; orders: number }>();
  for (const items of lines.values()) {
    for (const l of items) {
      const k = l.sku ?? l.name;
      const row = by.get(k) ?? { name: l.name, sku: l.sku, units: 0, sales: 0, orders: 0 };
      row.units += l.qty; row.sales += l.amount; row.orders++;
      by.set(k, row);
    }
  }
  return [...by.values()].sort((a, b) => b.sales - a.sales);
}

/* ── Accuracy checks ────────────────────────────────────────────────────── */

export type Reconciliation = {
  checked: number;
  mismatched: { number: string; order: number; charged: number }[];
  missingCharge: string[];
  outsideCheckout: { id: string; amount: number; created: number }[];
};

/**
 * Every order's total must equal what its card charge captured, and every
 * successful charge in the window should belong to a checkout order.
 */
export async function reconcile(all: OrderRow[], w: Window): Promise<Reconciliation | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  const inW = all.filter((o) => o.created >= w.from && o.created < w.to);
  const mismatched = inW.filter((o) => o.chargeAmount !== null && o.chargeAmount !== o.total).map((o) => ({ number: o.number, order: o.total, charged: o.chargeAmount! }));
  const missingCharge = inW.filter((o) => o.total > 0 && o.chargeId === null).map((o) => o.number);
  const known = new Set(all.map((o) => o.chargeId).filter(Boolean));
  const outsideCheckout: Reconciliation["outsideCheckout"] = [];
  for await (const c of stripe.charges.list({ created: { gte: w.from, lt: w.to }, limit: 100 })) {
    if (c.status === "succeeded" && c.paid && !known.has(c.id)) outsideCheckout.push({ id: c.id, amount: c.amount, created: c.created });
  }
  return { checked: inW.length, mismatched, missingCharge, outsideCheckout };
}
