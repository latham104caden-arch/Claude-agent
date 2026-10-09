import type { Product } from "./types";

/**
 * GLP-class listings are never marketed: kept out of the Omnisend catalog
 * (lib/omnisend-catalog.ts) and out of email discount codes (MAIL25).
 */
const NOT_MARKETED = /^glp-/i;

export const isMarketed = (p: Pick<Product, "slug" | "name">) => !NOT_MARKETED.test(p.slug) && !NOT_MARKETED.test(p.name);
