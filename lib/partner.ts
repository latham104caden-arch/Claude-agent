/**
 * Research Partner Program: lab pricing by the vial. Buying 10, 20 or 30+ of
 * the SAME vial (same compound and size, i.e. the same SKU) takes 40%, 45% or
 * 50% off that vial; 15 of one vial is still 40%. Different vials never add
 * up toward a tier. It is NOT applied automatically: labs build a kit on
 * /partner and send it to the team, who confirm lots and set up the pricing.
 * Anyone can still check out at regular prices.
 *
 * Used by the /partner page (kit builder, examples), the cart/summary nudges
 * and the request route, which re-prices every request from the catalog.
 */

export const PARTNER = { name: "Research Partner Program", path: "/partner" } as const;

/** `kit` = how many of the same vial unlock the tier. */
export const PARTNER_TIERS = [
  { kit: 10, percent: 40 },
  { kit: 20, percent: 45 },
  { kit: 30, percent: 50 },
] as const;

export type PartnerTier = (typeof PARTNER_TIERS)[number];

/** Supplies don't count and aren't discounted. Keep in sync with the "supplies" category in data/products.ts. */
export const NON_COMPOUND_SLUGS = new Set(["reconstitution-solution"]);

const round = (n: number) => Math.round(n * 100) / 100;

export const tierFor = (qty: number): PartnerTier | null => [...PARTNER_TIERS].reverse().find((t) => qty >= t.kit) ?? null;
const nextFor = (qty: number): PartnerTier | null => PARTNER_TIERS.find((t) => qty < t.kit) ?? null;

type Line = { sku: string; slug: string; price: number; qty: number };
export type QuotedLine = Line & {
  /** False for supplies (never discounted). */
  compound: boolean;
  tier: PartnerTier | null;
  next: PartnerTier | null;
  /** More of this same vial needed for the next tier. */
  toNext: number;
  savings: number;
};

/** Partner pricing for a set of lines, tier by tier per vial (SKU). Dollars rounded to cents. */
export function partnerQuote(input: Line[]) {
  const merged = new Map<string, Line>();
  for (const l of input) {
    const same = merged.get(l.sku);
    merged.set(l.sku, same ? { ...same, qty: same.qty + l.qty } : { ...l });
  }
  const lines: QuotedLine[] = [...merged.values()].map((l) => {
    const compound = !NON_COMPOUND_SLUGS.has(l.slug);
    const tier = compound ? tierFor(l.qty) : null;
    const next = compound ? nextFor(l.qty) : null;
    return { ...l, compound, tier, next, toNext: next ? next.kit - l.qty : 0, savings: tier ? round((l.price * l.qty * tier.percent) / 100) : 0 };
  });
  const regular = round(lines.reduce((n, l) => n + l.price * l.qty, 0));
  const savings = round(lines.reduce((n, l) => n + l.savings, 0));
  const qualifying = lines.filter((l) => l.tier);
  // The compound vial closest to its first tier, for "add N more" nudges.
  const closest = lines.filter((l) => l.compound && !l.tier).sort((a, b) => b.qty - a.qty)[0] ?? null;
  return {
    lines,
    /** Vials (lines) at a tier, and how many vials those lines hold. */
    qualifying: qualifying.length,
    qualifyingVials: qualifying.reduce((n, l) => n + l.qty, 0),
    vials: lines.filter((l) => l.compound).reduce((n, l) => n + l.qty, 0),
    /** Highest tier reached by any vial. */
    bestTier: qualifying.reduce<PartnerTier | null>((b, l) => (!b || l.tier!.percent > b.percent ? l.tier : b), null),
    closest,
    regular,
    savings,
    partner: round(regular - savings),
    /** Savings as a share of the whole kit. */
    percentOff: regular ? Math.round((savings / regular) * 1000) / 10 : 0,
  };
}
