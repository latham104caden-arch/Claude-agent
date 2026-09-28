"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductSummary } from "../../lib/catalog";
import type { Category } from "../../lib/types";
import { ProductCard } from "./ProductCard";

type Sort = "popular" | "price-asc" | "price-desc" | "name";

/**
 * Client-side filtering over a server-rendered list. The initial HTML already
 * contains every card (good for SEO + no-JS); this only narrows it.
 * Tab state lives in the URL (?tab=) so category links are shareable.
 */
export function ShopBrowser({ items, categories }: { items: ProductSummary[]; categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") ?? "all";
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("popular");

  const setTab = (t: string) => {
    const sp = new URLSearchParams(params.toString());
    if (t === "all") sp.delete("tab"); else sp.set("tab", t);
    router.replace(`/shop${sp.size ? "?" + sp.toString() : ""}`, { scroll: false });
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

  return (
    <>
      <div className="shop-bar">
        <div className="tabs" role="group" aria-label="Filter by category">
          <button type="button" className="tab" aria-pressed={tab === "all"} onClick={() => setTab("all")}>All</button>
          {categories.map((c) => (
            <button key={c.slug} type="button" className="tab" aria-pressed={tab === c.slug} onClick={() => setTab(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="shop-tools">
          <input className="input" type="search" placeholder="Search compounds" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search compounds" />
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
            <option value="popular">Most popular</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>
      <p className="shop-count">{list.length} {list.length === 1 ? "compound" : "compounds"}</p>
      {list.length === 0 ? (
        <p className="shop-empty">No compounds match your filters.</p>
      ) : (
        <div className="grid-products">
          {list.map((p, i) => <ProductCard key={p.slug} p={p} delay={(i % 4) * 60} />)}
        </div>
      )}
    </>
  );
}
