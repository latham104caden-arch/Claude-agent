"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "../../lib/types";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { QtyStepper } from "../cart/QtyStepper";
import { Icon } from "../Icon";

/** PDP buy box: size picker, price, quantity, add to cart. */
export function ProductPurchase({ product }: { product: Product }) {
  const { add } = useCart();
  const first = product.variants.findIndex((v) => v.inStock);
  const [idx, setIdx] = useState(first === -1 ? 0 : first);
  const [qty, setQty] = useState(1);
  const v = product.variants[idx];

  return (
    <div>
      <p className="pdp-price">
        {money(v.price)}
        {v.compareAt ? <s>{money(v.compareAt)}</s> : null}
      </p>

      {product.variants.length > 1 ? (
        <div className="pdp-opts">
          <p className="pdp-opts-label">Size: <span className="muted">{v.option}</span></p>
          <div className="opt-row">
            {product.variants.map((o, i) => (
              <button
                key={o.sku}
                type="button"
                className="opt"
                aria-pressed={i === idx}
                disabled={!o.inStock}
                onClick={() => setIdx(i)}
              >
                {o.option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="pdp-buy">
        <QtyStepper value={qty} onChange={setQty} min={1} label={product.name} large />
        <button
          type="button"
          className="btn btn--primary"
          disabled={!v.inStock}
          onClick={() => add({ sku: v.sku, slug: product.slug, name: product.name, option: v.option, price: v.price }, qty)}
        >
          {v.inStock ? <>Add to Cart <Icon name="arrow" /></> : "Sold Out"}
        </button>
      </div>

      <p className={"pdp-stock" + (v.inStock ? "" : " out")}>
        {v.inStock ? "In stock — ships in one business day" : "Currently out of stock"}
      </p>
      <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        SKU <span className="mono">{v.sku}</span>
        {product.coaLot ? <> · <Link href={`/coas#${product.coaLot}`} style={{ color: "var(--accent-ink)", fontWeight: 600 }}>View COA ({product.coaLot})</Link></> : null}
      </p>
    </div>
  );
}
