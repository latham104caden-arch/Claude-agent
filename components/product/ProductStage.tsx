"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "../../lib/types";
import type { ProductSummary } from "../../lib/catalog";
import { money } from "../../lib/format";
import { RUO_SHORT } from "../../lib/site";
import { useCart } from "../cart/CartProvider";
import { QtyStepper } from "../cart/QtyStepper";
import { Icon } from "../Icon";
import { Vial } from "../Vial";
import { Crumbs } from "../ui";

/**
 * Product "stage": the vial floats on a pedestal on the left (sticky on
 * desktop) while the right-hand panel holds everything you act on:
 * size tiles, quantity, add to cart, and a pick-and-add "Build your stack"
 * list (the "create an outfit" pattern, applied to compounds).
 */
export function ProductStage({
  product,
  categoryName,
  categorySlug,
  pairs,
}: {
  product: Product;
  categoryName?: string;
  categorySlug?: string;
  pairs: ProductSummary[];
}) {
  const { add, setOpen } = useCart();
  const firstInStock = product.variants.findIndex((v) => v.inStock);
  const [idx, setIdx] = useState(firstInStock === -1 ? 0 : firstInStock);
  const [qty, setQty] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const v = product.variants[idx];

  const togglePick = (slug: string) =>
    setPicked((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const stackTotal = useMemo(
    () => v.price * qty + pairs.filter((p) => picked.includes(p.slug)).reduce((n, p) => n + p.price, 0),
    [v.price, qty, pairs, picked]
  );

  const addMain = () =>
    add({ sku: v.sku, slug: product.slug, name: product.name, option: v.option, price: v.price }, qty);

  const addStack = () => {
    if (v.inStock) addMain();
    for (const p of pairs) {
      if (picked.includes(p.slug)) add({ sku: p.firstSku, slug: p.slug, name: p.name, option: p.firstOption, price: p.price });
    }
    setPicked([]);
    setOpen(true);
  };

  const skuPrefix = v.sku.replace(/\d+$/, "");

  return (
    <section className="stage">
      <div className="container stage-grid">
        {/* ── Left: floating vial ─────────────────────────────── */}
        <div className="stage-visual">
          <div className="stage-visual-inner">
            <div className="stage-meta stage-meta--tl">
              <Crumbs items={[{ href: "/shop", label: "Compounds" }, ...(categorySlug ? [{ href: `/product-category/${categorySlug}`, label: categoryName ?? "" }] : []), { label: product.name }]} />
            </div>
            <div className="stage-float">
              <Vial key={v.sku} name={product.name} option={v.option} accent={product.accent} className="vial stage-vial" />
            </div>
            <div className="stage-pedestal" aria-hidden="true" />
            <div className="stage-meta stage-meta--bl mono">
              {product.coaLot ? <>LOT {product.coaLot}<br /></> : null}
              {v.sku} · {v.option.toUpperCase()}
            </div>
            <div className="stage-meta stage-meta--br mono" aria-hidden="true">
              {String(idx + 1).padStart(2, "0")} <span className="stage-rule" /> {String(product.variants.length).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* ── Right: the panel ────────────────────────────────── */}
        <div className="stage-panel glass">
          <div className="panel-top mono">
            <span>{skuPrefix} · {product.subtitle.toUpperCase()}</span>
            <span>RESEARCH USE ONLY</span>
          </div>

          <h1 className="panel-title">{product.name}</h1>
          <div className="pdp-badges">
            {product.coaLot ? <Link href={`/coas#${product.coaLot}`} className="badge badge--dark"><Icon name="coa" /> COA available</Link> : null}
            {product.badge ? <span className="badge">{product.badge}</span> : null}
            <span className="badge badge--muted">≥99% HPLC</span>
          </div>
          <p className="pdp-price">
            {money(v.price)}
            {v.compareAt ? <s>{money(v.compareAt)}</s> : null}
          </p>
          <p className="pdp-desc">{product.description}</p>

          {/* Size tiles */}
          <div className="panel-block">
            <div className="panel-label mono"><span>Select size</span><span>{product.variants.length} option{product.variants.length > 1 ? "s" : ""}</span></div>
            <div className="size-grid" role="radiogroup" aria-label="Size">
              {product.variants.map((o, i) => (
                <button
                  key={o.sku}
                  type="button"
                  role="radio"
                  aria-checked={i === idx}
                  className="size-tile"
                  disabled={!o.inStock}
                  onClick={() => setIdx(i)}
                >
                  <Vial name={product.name} accent={product.accent} className="tile-vial" />
                  <span className="size-tile-opt">{o.option}</span>
                  <span className="size-tile-price">{o.inStock ? money(o.price) : "Sold out"}</span>
                  <span className="tile-check" aria-hidden="true"><Icon name="check" strokeWidth={2.6} /></span>
                </button>
              ))}
            </div>
          </div>

          <div className="pdp-buy">
            <QtyStepper value={qty} onChange={setQty} min={1} label={product.name} large />
            <button type="button" className="btn btn--dark" disabled={!v.inStock} onClick={addMain}>
              {v.inStock ? <>Add to Cart · {money(v.price * qty)}</> : "Sold Out"}
            </button>
          </div>
          <p className={"pdp-stock" + (v.inStock ? "" : " out")}>
            {v.inStock ? "In stock — ships in one business day" : "Currently out of stock"}
          </p>

          {/* Build your stack */}
          {pairs.length ? (
            <div className="panel-block">
              <div className="panel-label mono"><span>Build your stack</span><span>{picked.length} selected</span></div>
              <div className="pair-grid">
                {pairs.map((p) => {
                  const on = picked.includes(p.slug);
                  return (
                    <button key={p.slug} type="button" className="pair-tile" aria-pressed={on} onClick={() => togglePick(p.slug)}>
                      <span className="pair-art"><Vial name={p.name} accent={p.accent} className="tile-vial" /></span>
                      <span className="pair-name">{p.name}</span>
                      <span className="pair-sub">{p.firstOption} · {money(p.price)}</span>
                      <span className="tile-check" aria-hidden="true"><Icon name="check" strokeWidth={2.6} /></span>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="btn btn--ghost btn--block stack-btn" disabled={picked.length === 0} onClick={addStack}>
                <Icon name="bag" />
                {picked.length ? `Add ${product.name} + ${picked.length} selected · ${money(stackTotal)}` : "Select items to add"}
              </button>
            </div>
          ) : null}

          <div className="pdp-assure">
            <div><Icon name="shield" /> ≥99% purity target</div>
            <div><Icon name="cert" /> Third-party tested</div>
            <div><Icon name="truck" /> Ships in 1 business day</div>
          </div>
          <p className="panel-ruo">{RUO_SHORT}</p>
        </div>
      </div>
    </section>
  );
}
