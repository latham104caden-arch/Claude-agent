import { SKU_RENAMES } from "../data/sku-renames";

/**
 * A SKU as it is today. Old RR- codes from before a rename (saved carts, open
 * partner links, older Stripe orders, cached pages) resolve to the new code;
 * anything else passes through unchanged. Exact match, case-sensitive.
 */
export const currentSku = (sku: string): string => (Object.hasOwn(SKU_RENAMES, sku) ? SKU_RENAMES[sku] : sku);

/**
 * Everything wrong with a rename map against the catalogue's original SKUs.
 * Empty means safe. Checked when the catalogue loads, so a bad map fails the build.
 */
export function renameProblems(renames: Readonly<Record<string, string>>, originalSkus: readonly string[]): string[] {
  const problems: string[] = [];
  const originals = new Set(originalSkus);
  const finals = new Map<string, string>();
  for (const sku of originalSkus) {
    const to = Object.hasOwn(renames, sku) ? renames[sku] : sku;
    const clash = finals.get(to);
    if (clash) problems.push(`${clash} and ${sku} would both be ${to}`);
    else finals.set(to, sku);
  }
  for (const [from, to] of Object.entries(renames)) {
    if (!originals.has(from)) problems.push(`${from} isn't a SKU in the catalogue`);
    if (!to.startsWith("VSC-")) problems.push(`${from} → "${to}" doesn't start with VSC-`);
    if (/\s/.test(to)) problems.push(`${from} → "${to}" contains whitespace`);
    if (to === from) problems.push(`${from} is renamed to itself`);
  }
  return problems;
}
