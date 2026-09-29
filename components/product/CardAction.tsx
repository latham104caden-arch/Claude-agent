"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductSummary } from "../../lib/catalog";
import { useCart } from "../cart/CartProvider";
import { Icon } from "../Icon";

/**
 * Card call-to-action. Every state uses the same soft slate button so the
 * grid reads evenly; it turns the darker slate on hover/tap (see .card-btn).
 * Single-variant products add straight from the card and briefly confirm;
 * multi-variant ones go to the PDP to pick a size.
 */
export function CardAction({ p }: { p: ProductSummary }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  if (!p.inStock) {
    return <Link className="btn card-btn" href={`/product/${p.slug}`}>View Details</Link>;
  }
  if (!p.singleVariant) {
    return <Link className="btn card-btn" href={`/product/${p.slug}`}>Select Size</Link>;
  }
  return (
    <button
      type="button"
      className={"btn card-btn" + (added ? " is-done" : "")}
      onClick={() => {
        add({ sku: p.firstSku, slug: p.slug, name: p.name, option: p.firstOption, price: p.firstPrice });
        setAdded(true);
      }}
    >
      {added ? <>Added <Icon name="check" strokeWidth={2.4} /></> : "Add to Cart"}
    </button>
  );
}
