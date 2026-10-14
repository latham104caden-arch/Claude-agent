import type { Product } from "./types";

/**
 * Every listing is marketed: nothing is kept out of the Omnisend catalog
 * (lib/omnisend-catalog.ts), email discount codes (MAIL25), BOGO or partner
 * pricing on these grounds. Kept as a single hook so an exclusion can be
 * reintroduced here without touching the call sites.
 */
export const isMarketed = (_p: Pick<Product, "slug" | "name">) => true;
