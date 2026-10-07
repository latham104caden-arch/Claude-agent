import { ADMIN_TZ } from "./admin";

/** Dashboard formatting: money arrives in cents, times in unix seconds. */
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const cents = (c: number) => usd.format(c / 100);
export const count = (n: number) => n.toLocaleString("en-US");

export const when = (unixSec: number) =>
  new Intl.DateTimeFormat("en-US", { timeZone: ADMIN_TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(unixSec * 1000));

export const dayLabel = (key: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(`${key}T00:00:00Z`));

export const tzName = () =>
  new Intl.DateTimeFormat("en-US", { timeZone: ADMIN_TZ, timeZoneName: "short" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value ?? ADMIN_TZ;

/** "+12%" vs a previous period; null when there's nothing to compare against. */
export function change(now: number, before: number): string | null {
  if (!before) return now ? "new" : null;
  const pct = ((now - before) / before) * 100;
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`;
}

export const stripeLink = (paymentIntent: string | null, live: boolean) =>
  paymentIntent ? `https://dashboard.stripe.com/${live ? "" : "test/"}payments/${paymentIntent}` : null;
