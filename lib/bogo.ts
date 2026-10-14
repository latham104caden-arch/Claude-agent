/**
 * Spooky Season deal: buy 2 get 1 free, buy 3 get 2 free, buy 5 get 3 free.
 * Counts every eligible vial in the cart (any compound, any size); the free
 * vials are the cheapest ones. Only the highest tier reached applies, so 3
 * vials = 1 free, 5 vials = 2 free, 8+ vials = 3 free.
 *
 * Not automatic: the shopper taps "Get BOGO" at checkout, and it takes the
 * order's one discount slot (no stacking with codes). Every product counts,
 * reconstitution solution included, except non-marketed listings
 * (lib/marketing.ts), which don't count and are never free.
 *
 * TO TURN IT OFF early: set `endsAt` to a past time (or `on: false`).
 */
import { isMarketed } from "./marketing";

export const BOGO = {
  on: true,
  name: "Spooky Season Sale",
  /** What the checkout button applies; stored on the order as metadata.bogo_deal. */
  code: "BOGO",
  startsAt: "",
  endsAt: "2026-11-01T00:00:00-05:00", // end of Halloween (Oct 31), Central time
  tiers: [
    { buy: 2, get: 1 },
    { buy: 3, get: 2 },
    { buy: 5, get: 3 },
  ],
} as const;

export type BogoTier = (typeof BOGO.tiers)[number];

export function bogoLive(now = Date.now()): boolean {
  if (!BOGO.on) return false;
  const start = Date.parse(BOGO.startsAt), end = Date.parse(BOGO.endsAt);
  if (Number.isFinite(start) && now < start) return false;
  return !Number.isFinite(end) || now < end;
}

export const tierLabel = (t: BogoTier) => `Buy ${t.buy}, get ${t.get} free`;

type Line = { slug: string; name?: string; price: number; qty: number };

const round = (n: number) => Math.round(n * 100) / 100;

/** The deal on a set of cart lines: tier reached, the free (cheapest) vials, their total, and the next tier. */
export function bogoQuote(lines: Line[]) {
  const units = lines
    .filter((l) => isMarketed({ slug: l.slug, name: l.name ?? "" }))
    .flatMap((l) => Array.from({ length: Math.max(0, Math.floor(l.qty)) }, () => ({ slug: l.slug, name: l.name ?? l.slug, price: l.price })));
  const vials = units.length;
  const tier = [...BOGO.tiers].reverse().find((t) => vials >= t.buy + t.get) ?? null;
  const free = tier ? [...units].sort((a, b) => a.price - b.price).slice(0, tier.get) : [];
  const next = BOGO.tiers.find((t) => vials < t.buy + t.get) ?? null;
  return {
    vials,
    tier,
    free,
    amount: round(free.reduce((n, u) => n + u.price, 0)),
    next,
    /** Vials still needed for the next tier. */
    toNext: next ? next.buy + next.get - vials : 0,
  };
}
