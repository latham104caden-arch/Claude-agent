export type CategorySlug = "repair-immune" | "metabolic-gh" | "cognitive-longevity" | "nasal" | "bundles" | "supplies";

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Card subtitle, e.g. "Recovery Research". */
  blurb: string;
}

export interface Variant {
  sku: string;
  /** Human label, e.g. "10 mg". */
  option: string;
  price: number;
  /** Set when on sale: the struck-through price. */
  compareAt?: number;
  inStock: boolean;
}

export interface Spec {
  label: string;
  value: string;
  mono?: boolean;
}

export interface Source {
  journal?: string;
  title: string;
  authors?: string;
  year?: number;
  link?: string;
}

export interface Product {
  slug: string;
  name: string;
  category: CategorySlug;
  /** Short line under the title on cards, e.g. "Recovery Research". */
  subtitle: string;
  description: string;
  variants: Variant[];
  /** Higher = shown first in "Best Sellers" / default shop sort. */
  popularity: number;
  featured?: boolean;
  badge?: string;
  /** Product photo: "repair" | "metabolic" | "cognitive" | "supply" | "nasal" (see public/vial). Set from the category in data/products.ts. Unset = navy vial. */
  accent?: string;
  specs: Spec[];
  storage: string[];
  sources: Source[];
  /** Bundle contents (slugs) — only for category "bundles". */
  includes?: string[];
  /** Lot number of the current certificate; links to /coas#lot. */
  coaLot?: string;
}

export interface CartLine {
  sku: string;
  slug: string;
  name: string;
  option: string;
  price: number;
  qty: number;
}

export interface Coa {
  lot: string;
  /** Store product this lot belongs to; omit when it isn't listed. */
  productSlug?: string;
  productName: string;
  strength: string;
  purity: string;
  lab: string;
  tested: string;
  /** The lab's report number, as printed on the certificate. */
  report?: string;
  /** Path under /public or external URL of the certificate. */
  pdf?: string;
}
