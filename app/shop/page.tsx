import type { Metadata } from "next";
import { byCategory, getCatalog, getCategories, getProduct, summarize } from "../../lib/catalog";
import type { ProductSummary } from "../../lib/catalog";
import { Crumbs } from "../../components/ui";
import { COA_COUNT } from "../../data/coas";
import { Icon } from "../../components/Icon";
import { Vial } from "../../components/Vial";
import { ShopBrowser, type BundleInfo } from "../../components/product/ShopBrowser";

export const metadata: Metadata = {
  title: "Shop Research Compounds",
  description: "Browse high-purity research compounds, nasal research formats and lab supplies. Independent COAs published by lot.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const catalog = getCatalog();
  const items = catalog.map(summarize);
  const categories = getCategories();

  // Bundle feature data: what's inside and what it would cost separately.
  const bundles: BundleInfo[] = catalog
    .filter((p) => p.category === "bundles")
    .map((p) => {
      const includes = (p.includes ?? [])
        .map((s) => getProduct(s))
        .filter(Boolean)
        .map((i) => summarize(i!));
      const v = p.variants[0];
      return { summary: summarize(p), includes, price: v.price, separately: v.compareAt ?? null, description: p.description };
    });

  return (
    <>
      <section className="shop-hero">
        <div className="container shop-hero-grid">
          <div>
            <Crumbs items={[{ label: "Compounds" }]} />
            <p className="eyebrow">Catalog 001 · {items.length} compounds</p>
            <h1 className="h1 shop-hero-title">Research <em>Compounds</em></h1>
            <p className="lead">
              Every compound ships with a lot number that matches a published, third-party certificate of analysis.
            </p>
            <div className="hero-chips">
              <span className="chip"><Icon name="shield" /> ≥99% HPLC purity</span>
              <span className="chip"><Icon name="coa" /> {COA_COUNT} COAs published</span>
              <span className="chip"><Icon name="truck" /> 2–3 day shipping</span>
            </div>
          </div>
          <nav className="cat-index" aria-label="Jump to category">
            {categories.map((c, i) => {
              const list: ProductSummary[] = byCategory(c.slug).map(summarize);
              const lead = list[0];
              return (
                /* Plain <a>, not <Link>: a native hash jump fires `hashchange`,
                   which ShopBrowser uses to open this category's tab. */
                <a key={c.slug} href={`#cat-${c.slug}`} className="cat-index-item">
                  <span className="cat-index-num mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="cat-index-art">{lead ? <Vial name={lead.name} accent={lead.accent} className="tile-vial" /> : null}</span>
                  <span className="cat-index-text">
                    <b>{c.name}</b>
                    <small>{list.length} {list.length === 1 ? "item" : "items"}</small>
                  </span>
                  <Icon name="arrow" />
                </a>
              );
            })}
          </nav>
        </div>
      </section>

      <ShopBrowser items={items} categories={categories} bundles={bundles} />
    </>
  );
}
