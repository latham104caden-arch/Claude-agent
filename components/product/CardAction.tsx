"use client";

import Link from "next/link";
import type { ProductSummary } from "../../lib/catalog";
import { useCart } from "../cart/CartProvider";

/** Single-variant products add straight from the card; multi-variant ones go to the PDP to pick a size. */
export function CardAction({ p }: { p: ProductSummary }) {
  const { add } = useCart();
  if (!p.inStock) {
    return <Link className="btn btn--ghost" href={`/product/${p.slug}`}>View Details</Link>;
  }
  if (!p.singleVariant) {
    return <Link className="btn btn--ghost" href={`/product/${p.slug}`}>Select Size</Link>;
  }
  return (
    <button
      type="button"
      className="btn btn--dark"
      onClick={() => add({ sku: p.firstSku, slug: p.slug, name: p.name, option: p.firstOption, price: p.price })}
    >
      Add to Cart
    </button>
  );
}
