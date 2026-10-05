/**
 * Bulk pricing: buy 10, 20 or 30+ compound vials in one order and the
 * compounds get 15%, 25% or 35% off, plus free shipping. Shoppers see the
 * saving in dollars, never as a percent. Shared by the cart, the checkout
 * summary and the server (app/api/checkout), so all three agree.
 *
 * Bulk pricing replaces codes: an order at a bulk tier can't also take a
 * creator or reward code (one discount per order).
 */

export const BULK_TIERS = [
  { min: 10, percent: 15 },
  { min: 20, percent: 25 },
  { min: 30, percent: 35 },
] as const;

export type BulkTier = (typeof BULK_TIERS)[number];

/** Supplies don't count toward bulk and aren't discounted. Keep in sync with the "supplies" category in data/products.ts. */
export const NON_COMPOUND_SLUGS = new Set(["reconstitution-solution"]);

const round = (n: number) => Math.round(n * 100) / 100;

type Line = { slug: string; price: number; qty: number };

export function bulkFor(lines: Line[]) {
  const compounds = lines.filter((l) => !NON_COMPOUND_SLUGS.has(l.slug));
  const units = compounds.reduce((n, l) => n + l.qty, 0);
  const value = compounds.reduce((n, l) => n + l.price * l.qty, 0);
  const tier: BulkTier | null = [...BULK_TIERS].reverse().find((t) => units >= t.min) ?? null;
  const next: BulkTier | null = BULK_TIERS.find((t) => units < t.min) ?? null;
  return {
    units,
    tier,
    next,
    /** Dollars off this order. */
    amount: tier ? round((value * tier.percent) / 100) : 0,
    /** Vials still needed for the next tier. */
    toNext: next ? next.min - units : 0,
  };
}

export const bulkLabel = (t: BulkTier) => `Bulk pricing (${t.min}+ compounds)`;

/** Message when a code is tried on a bulk order. */
export const BULK_NO_CODES = "Bulk pricing is already applied to this order, and it can't be combined with a code.";
