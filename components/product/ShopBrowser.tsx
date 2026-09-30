"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ProductSummary } from "../../lib/catalog";
import type { Category } from "../../lib/types";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { Icon } from "../Icon";
import { Vial } from "../Vial";
import { ProductCard } from "./ProductCard";

type Sort = "popular" | "price-asc" | "price-desc" | "name";

export type BundleInfo = {
  summary: ProductSummary;
  includes: ProductSummary[];
  price: number;
  /** What the contents would cost bought separately (null if unknown). */
  separately: number | null;
  description: string;
};

const SORTERS: Record<Sort, (a: ProductSummary, b: ProductSummary) => number> = {
  popular: (a, b) => Number(b.inStock) - Number(a.inStock) || b.popularity - a.popularity,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" }),
};

/**
 * Shop grid. "All" is every product in one grid, A–Z by default; a category
 * tab filters it (bundles show as feature cards there). ?tab= is read after
 * mount so the page server-renders fully (no Suspense fallback swap).
 */
export function ShopBrowser({ items, categories, bundles }: { items: ProductSummary[]; categories: Category[]; bundles: BundleInfo[] }) {
  const [tab, setTabState] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("name");

  useEffect(() => {
    const read = () => {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t && categories.some((c) => c.slug === t)) setTabState(t);
    };
    read();
    // Category index links (#cat-<slug>) open that category's tab and scroll to the grid.
    const onHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#cat-")) return;
      const slug = hash.slice(5);
      if (!categories.some((c) => c.slug === slug)) return;
      setTabState(slug);
      setQ("");
      const url = new URL(window.location.href);
      url.searchParams.set("tab", slug);
      url.hash = "";
      window.history.replaceState(null, "", url.pathname + url.search);
      document.getElementById("shop-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [categories]);

  const setTab = (t: string) => {
    setTabState(t);
    const url = new URL(window.location.href);
    url.hash = "";
    if (t === "all") url.searchParams.delete("tab"); else url.searchParams.set("tab", t);
    window.history.replaceState(null, "", url.pathname + url.search);
  };

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of items) m[p.category] = (m[p.category] ?? 0) + 1;
    return m;
  }, [items]);

  const query = q.trim().toLowerCase();
  const filtered = tab !== "all" || !!query;

  const results = useMemo(() => {
    const out = items.filter(
      (p) => (tab === "all" || p.category === tab) && (!query || (p.name + " " + p.subtitle).toLowerCase().includes(query))
    );
    return out.sort(SORTERS[sort]);
  }, [items, tab, query, sort]);

  const bundleFor = (slug: string) => bundles.find((b) => b.summary.slug === slug);

  const renderList = (list: ProductSummary[]) => {
    // Bundles get the feature card only on their own tab; in "All" they sit in the A–Z grid.
    const bundleItems = tab === "bundles" ? list.filter((p) => bundleFor(p.slug)) : [];
    const rest = list.filter((p) => !bundleItems.includes(p));
    return (
      <>
        {bundleItems.map((p) => <BundleFeature key={p.slug} b={bundleFor(p.slug)!} />)}
        {rest.length ? (
          <div className="grid-products">
            {rest.map((p, i) => <ProductCard key={p.slug} p={p} delay={(i % 4) * 60} />)}
          </div>
        ) : null}
      </>
    );
  };

  return (
    <>
      <div className="shop-toolbar">
        <div className="container shop-toolbar-inner">
          <div className="tabs" role="group" aria-label="Filter by category">
            <button type="button" className="tab" aria-pressed={tab === "all"} onClick={() => setTab("all")}>
              All <span className="tab-count">{items.length}</span>
            </button>
            {categories.map((c) => (
              <button key={c.slug} type="button" className="tab" aria-pressed={tab === c.slug} onClick={() => setTab(c.slug)}>
                {c.name} <span className="tab-count">{counts[c.slug] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="shop-tools">
            <label className="shop-search-sm">
              <Icon name="search" />
              <span className="sr-only">Search compounds</span>
              <input type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
              <option value="popular">Most popular</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="container shop-body">
        <section id="shop-results" className="shop-section">
          <header className="shop-results-head">
            <p className="mono">
              {results.length} {results.length === 1 ? "product" : "products"}
              {query ? <> for “{q.trim()}”</> : null}
              {tab !== "all" ? <> in {categories.find((c) => c.slug === tab)?.name}</> : null}
              {sort === "name" ? " · A–Z" : null}
            </p>
            {filtered ? <button type="button" className="shop-clear" onClick={() => { setQ(""); setTab("all"); }}>Clear filters</button> : null}
          </header>
          {results.length ? renderList(results) : <p className="shop-empty">No compounds match your filters.</p>}
        </section>
      </div>
    </>
  );
}

function BundleFeature({ b }: { b: BundleInfo }) {
  const { add } = useCart();
  const p = b.summary;
  const save = b.separately ? b.separately - b.price : 0;
  return (
    <article className="bundle-feature section--dark" data-reveal="">
      <div className="bundle-art" aria-hidden="true">
        {b.includes.map((i, n) => (
          <Vial key={i.slug} name={i.name} option={i.options[i.options.length - 1]} accent={i.accent} className={"vial bundle-vial bundle-vial--" + n} />
        ))}
        <div className="bundle-pedestal" />
      </div>
      <div className="bundle-copy">
        <p className="eyebrow">Research Stack{save > 0 ? ` · Save ${money(save)}` : ""}</p>
        <h3>{p.name}</h3>
        <p className="bundle-desc">{b.description}</p>
        <ul className="bundle-list">
          {b.includes.map((i) => (
            <li key={i.slug}>
              <Icon name="check" strokeWidth={2.4} />
              <Link href={`/product/${i.slug}`}>{i.name}</Link>
              <span className="mono">{i.options[i.options.length - 1]}</span>
            </li>
          ))}
        </ul>
        <div className="bundle-buy">
          <p className="bundle-price">
            {money(b.price)}
            {b.separately ? <s>{money(b.separately)}</s> : null}
          </p>
          <div className="bundle-ctas">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!p.inStock}
              onClick={() => add({ sku: p.firstSku, slug: p.slug, name: p.name, option: p.firstOption, price: p.firstPrice })}
            >
              {p.inStock ? <>Add Stack to Cart <Icon name="arrow" /></> : "Sold Out"}
            </button>
            <Link href={`/product/${p.slug}`} className="btn btn--ghost">Details</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
