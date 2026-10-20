/**
 * Revised SKU → warehouse SKU. Ikonik (our 3PL) picks by the VSC- SKUs, so
 * every Revised variant that is the same compound at the same size takes that
 * exact string. Filled from the parity audit's revised-to-ventra-sku-map.csv,
 * MATCH rows only: never a size mismatch, never an unconfirmed SKU.
 *
 * Left side: the variant's original RR- SKU (built in data/products.ts).
 * Right side: the VSC- SKU, character for character as in the Ventra master.
 * Variants not listed keep their RR- SKU. lib/catalog.ts applies this and
 * refuses to build if an entry is malformed or two variants would share a SKU;
 * lib/sku.ts keeps old RR- codes working (saved carts, links, past orders).
 * Prices don't change: they're keyed on the original SKU.
 */
export const SKU_RENAMES: Readonly<Record<string, string>> = {};
