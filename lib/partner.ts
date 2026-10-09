/**
 * Research Partner Program: lab pricing on kits of 10, 20 or 30+ compound
 * vials (40%, 45% or 50% off the compounds). It is NOT applied automatically:
 * labs build a kit on /partner and send it to the team, who confirm lots and
 * set up the pricing. Anyone can still check out at regular prices.
 *
 * Used by the /partner page (kit builder, examples) and the request route,
 * which re-prices every request from the catalog.
 */

export const PARTNER = { name: "Research Partner Program", path: "/partner" } as const;

export const PARTNER_TIERS = [
  { kit: 10, percent: 40 },
  { kit: 20, percent: 45 },
  { kit: 30, percent: 50 },
] as const;

export type PartnerTier = (typeof PARTNER_TIERS)[number];

/** Supplies don't count toward a kit and aren't discounted. Keep in sync with the "supplies" category in data/products.ts. */
export const NON_COMPOUND_SLUGS = new Set(["reconstitution-solution"]);

const round = (n: number) => Math.round(n * 100) / 100;

type Line = { slug: string; price: number; qty: number };

/** What a kit costs at partner pricing. Dollars are rounded to cents; `percentOff` is of the whole kit. */
export function partnerQuote(lines: Line[]) {
  const compounds = lines.filter((l) => !NON_COMPOUND_SLUGS.has(l.slug));
  const vials = compounds.reduce((n, l) => n + l.qty, 0);
  const compoundValue = round(compounds.reduce((n, l) => n + l.price * l.qty, 0));
  const otherValue = round(lines.filter((l) => NON_COMPOUND_SLUGS.has(l.slug)).reduce((n, l) => n + l.price * l.qty, 0));
  const tier: PartnerTier | null = [...PARTNER_TIERS].reverse().find((t) => vials >= t.kit) ?? null;
  const next: PartnerTier | null = PARTNER_TIERS.find((t) => vials < t.kit) ?? null;
  const savings = tier ? round((compoundValue * tier.percent) / 100) : 0;
  const regular = round(compoundValue + otherValue);
  return {
    vials,
    tier,
    next,
    /** Vials still needed for the next kit size. */
    toNext: next ? next.kit - vials : 0,
    regular,
    savings,
    partner: round(regular - savings),
    /** Savings as a share of the whole kit (equals the tier % unless supplies are included). */
    percentOff: regular ? Math.round((savings / regular) * 1000) / 10 : 0,
  };
}
