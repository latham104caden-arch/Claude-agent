"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ProductSummary } from "../../lib/catalog";
import type { Category } from "../../lib/types";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { Icon } from "../Icon";
import { Vial } from "../Vial";
import { Crumbs } from "../ui";

type Sort = "popular" | "price-asc" | "price-desc" | "name";

/**
 * Shop as a "stage": the focused compound floats on a pedestal on the left
 * (sticky on desktop); the catalog panel on the right has search, category
 * tabs, sort and a tile grid. Clicking a tile previews it on the stage; the
 * check on each tile adds it to a selection that can be added to the cart in
 * one go (the "create an outfit → buy selected items" pattern).
 */
export function ShopStage({ items, categories }: { items: ProductSummary[]; categories: Category[] }) {
  // Category tab lives in ?tab= so links like /shop?tab=nasal work. Read after
  // mount (not via useSearchParams) so the stage server-renders without a
  // Suspense fallback flash.
  const [tab, setTabState] = useState("all");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && categories.some((c) => c.slug === t)) setTabState(t);
  }, [categories]);
  const { add, setOpen } = useCart();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("popular");
  const [focus, setFocus] = useState<string>(() => [...items].sort((a, b) => b.popularity - a.popularity)[0]?.slug ?? "");
  const [picked, setPicked] = useState<string[]>([]);

  const setTab = (t: string) => {
    setTabState(t);
    const url = new URL(window.location.href);
    if (t === "all") url.searchParams.delete("tab"); else url.searchParams.set("tab", t);
    window.history.replaceState(null, "", url.pathname + url.search);
  };

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    const out = items.filter(
      (p) => (tab === "all" || p.category === tab) && (!n || (p.name + " " + p.subtitle).toLowerCase().includes(n))
    );
    const by: Record<Sort, (a: ProductSummary, b: ProductSummary) => number> = {
      popular: (a, b) => Number(b.inStock) - Number(a.inStock) || b.popularity - a.popularity,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return out.sort(by[sort]);
  }, [items, tab, q, sort]);

  const current = items.find((p) => p.slug === focus) ?? list[0] ?? items[0];
  const pickedItems = items.filter((p) => picked.includes(p.slug));
  const pickedTotal = pickedItems.reduce((n, p) => n + p.firstPrice, 0);
  const position = Math.max(0, list.findIndex((p) => p.slug === current?.slug)) + 1;

  const toggle = (p: ProductSummary) => {
    if (!p.inStock) return;
    setPicked((cur) => (cur.includes(p.slug) ? cur.filter((s) => s !== p.slug) : [...cur, p.slug]));
  };

  const addPicked = () => {
    for (const p of pickedItems) add({ sku: p.firstSku, slug: p.slug, name: p.name, option: p.firstOption, price: p.firstPrice });
    setPicked([]);
    setOpen(true);
  };

  const quickAdd = (p: ProductSummary) =>
    add({ sku: p.firstSku, slug: p.slug, name: p.name, option: p.firstOption, price: p.firstPrice });

  return (
    <section className="stage stage--shop">
      <div className="container stage-grid">
        {/* ── Left: the focused compound on the stage ──────────── */}
        <div className="stage-visual">
          {current ? (
            <div className="stage-visual-inner">
              <div className="stage-meta stage-meta--tl">
                <Crumbs items={[{ label: "Compounds" }]} />
              </div>
              <div className="stage-caption" aria-live="polite">
                <p className="mono">{current.subtitle.toUpperCase()}</p>
                <h2>{current.name}</h2>
                <p className="stage-caption-price">
                  {current.from ? <small>From </small> : null}{money(current.price)}
                  {current.compareAt ? <s>{money(current.compareAt)}</s> : null}
                </p>
                <div className="stage-caption-opts">
                  {current.options.map((o) => <span key={o} className="chip">{o}</span>)}
                </div>
                <div className="stage-caption-ctas">
                  <Link href={`/product/${current.slug}`} className="btn btn--dark btn--sm">View details <Icon name="arrow" /></Link>
                  {current.inStock && current.singleVariant ? (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => quickAdd(current)}>Quick add</button>
                  ) : null}
                </div>
              </div>
              <div className="stage-float">
                <Vial key={current.slug} name={current.name} option={current.firstOption} accent={current.accent} className="vial stage-vial" />
              </div>
              <div className="stage-pedestal" aria-hidden="true" />
              <div className="stage-meta stage-meta--bl mono">
                {current.coaLot ? <>LOT {current.coaLot}<br /></> : null}
                {current.inStock ? "IN STOCK" : "SOLD OUT"} · {current.options.length} SIZE{current.options.length > 1 ? "S" : ""}
              </div>
              <div className="stage-meta stage-meta--br mono" aria-hidden="true">
                {String(position).padStart(2, "0")} <span className="stage-rule" /> {String(list.length).padStart(2, "0")}
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Right: catalog panel ───────────────────────────── */}
        <div className="stage-panel glass shop-panel">
          <div className="panel-top mono">
            <span>CATALOG 001 · {items.length} COMPOUNDS</span>
            <span>RESEARCH USE ONLY</span>
          </div>
          <h1 className="panel-title">Research <em>Compounds</em></h1>

          <label className="shop-search">
            <Icon name="search" />
            <span className="sr-only">Search compounds</span>
            <input type="search" placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>

          <div className="shop-filters">
            <div className="tabs" role="group" aria-label="Filter by category">
              <button type="button" className="tab" aria-pressed={tab === "all"} onClick={() => setTab("all")}>All</button>
              {categories.map((c) => (
                <button key={c.slug} type="button" className="tab" aria-pressed={tab === c.slug} onClick={() => setTab(c.slug)}>
                  {c.name}
                </button>
              ))}
            </div>
            <select className="select shop-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
              <option value="popular">Most popular</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          <div className="panel-label mono"><span>{list.length} {list.length === 1 ? "item" : "items"}</span><span>{picked.length} selected</span></div>

          {list.length === 0 ? (
            <p className="shop-empty">No compounds match your filters.</p>
          ) : (
            <div className="item-grid">
              {list.map((p) => {
                const on = picked.includes(p.slug);
                return (
                  <div key={p.slug} className={"item-tile" + (current?.slug === p.slug ? " is-focus" : "") + (on ? " is-picked" : "") + (p.inStock ? "" : " is-out")}>
                    <button type="button" className="item-main" onClick={() => setFocus(p.slug)} onMouseEnter={() => setFocus(p.slug)} aria-label={`Preview ${p.name}`}>
                      <span className="item-art"><Vial name={p.name} accent={p.accent} className="tile-vial" /></span>
                      <span className="item-name">{p.name}</span>
                      <span className="item-sub">{p.from ? "From " : ""}{money(p.price)}{p.inStock ? "" : " · Sold out"}</span>
                    </button>
                    {p.badge ? <span className="item-badge">{p.badge}</span> : null}
                    <button
                      type="button"
                      className="tile-check item-check"
                      aria-pressed={on}
                      aria-label={on ? `Remove ${p.name} from selection` : `Select ${p.name}`}
                      disabled={!p.inStock}
                      onClick={() => toggle(p)}
                    >
                      <Icon name="check" strokeWidth={2.6} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className={"select-bar" + (picked.length ? "" : " is-empty")}>
            <button type="button" className="btn btn--ghost" disabled={picked.length === 0} onClick={() => setPicked([])}>Clear</button>
            <button type="button" className="btn btn--dark" disabled={picked.length === 0} onClick={addPicked}>
              <Icon name="bag" />
              {picked.length ? `Add ${picked.length} selected · ${money(pickedTotal)}` : "Select items to add"}
            </button>
          </div>
          {/* Plain links to every product for crawlers and screen readers (tiles are preview buttons). */}
          <nav className="sr-only" aria-label="All compounds">
            {items.map((p) => <Link key={p.slug} href={`/product/${p.slug}`}>{p.name}</Link>)}
          </nav>
          <p className="panel-ruo">Tick items to build an order in one step. Multi-size compounds add their first in-stock size — pick a different size on the product page.</p>
        </div>
      </div>
    </section>
  );
}
