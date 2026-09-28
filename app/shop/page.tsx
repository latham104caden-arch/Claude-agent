import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalog, getCategories, summarize } from "../../lib/catalog";
import { PageHero } from "../../components/ui";
import { ShopBrowser } from "../../components/product/ShopBrowser";
import { ProductCard } from "../../components/product/ProductCard";

export const metadata: Metadata = {
  title: "Shop Research Compounds",
  description: "Browse high-purity research compounds, nasal research formats, bundles and lab supplies. COAs published for every lot.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const items = getCatalog().map(summarize);
  const categories = getCategories();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Compounds" }]}
        eyebrow="Shop"
        title={<>Research <em>Compounds</em></>}
        lead="Every compound ships with a lot number that matches a published certificate of analysis."
      />
      <section className="container" style={{ paddingBottom: "var(--section-y)" }}>
        {/* The fallback is the full server-rendered grid, so crawlers and no-JS visitors see every product. */}
        <Suspense
          fallback={
            <div className="grid-products" style={{ paddingTop: 24 }}>
              {items.map((p) => <ProductCard key={p.slug} p={p} />)}
            </div>
          }
        >
          <ShopBrowser items={items} categories={categories} />
        </Suspense>
      </section>
    </>
  );
}
