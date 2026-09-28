/**
 * Catalog access. Every page reads products through here, never from
 * data/products.ts directly, so the backing store (static file today, a
 * database later) can change in one place.
 */
import { CATEGORIES, PRODUCTS } from "../data/products";
import { enforceRuo } from "./ruo";
import { priceRange } from "./format";
import type { Category, CategorySlug, Product } from "./types";

const CATALOG: Product[] = enforceRuo(PRODUCTS);

export function getCatalog(): Product[] {
  return CATALOG;
}

export function getProduct(slug: string): Product | undefined {
  return CATALOG.find((p) => p.slug === slug);
}

export function getCategories(): Category[] {
  return CATEGORIES;
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function byCategory(slug: CategorySlug): Product[] {
  return CATALOG.filter((p) => p.category === slug);
}

export function bestSellers(limit = 8): Product[] {
  return [...CATALOG].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

export function related(product: Product, limit = 4): Product[] {
  return CATALOG.filter((p) => p.slug !== product.slug && p.category === product.category)
    .concat(CATALOG.filter((p) => p.slug !== product.slug && p.category !== product.category))
    .slice(0, limit);
}

export function displayPrice(p: Product) {
  return priceRange(p.variants.map((v) => v.price));
}

export function isInStock(p: Product) {
  return p.variants.some((v) => v.inStock);
}

/** Lightweight shape handed to client components (search, shop filters). */
export type ProductSummary = {
  slug: string;
  name: string;
  subtitle: string;
  category: CategorySlug;
  from: boolean;
  price: number;
  compareAt?: number;
  popularity: number;
  inStock: boolean;
  badge?: string;
  accent?: string;
  firstSku: string;
  firstOption: string;
  singleVariant: boolean;
};

export function summarize(p: Product): ProductSummary {
  const { from, amount } = displayPrice(p);
  const first = p.variants.find((v) => v.inStock) ?? p.variants[0];
  return {
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    category: p.category,
    from,
    price: amount,
    compareAt: p.variants.length === 1 ? p.variants[0].compareAt : undefined,
    popularity: p.popularity,
    inStock: isInStock(p),
    badge: p.badge,
    accent: p.accent,
    firstSku: first.sku,
    firstOption: first.option,
    singleVariant: p.variants.length === 1,
  };
}
