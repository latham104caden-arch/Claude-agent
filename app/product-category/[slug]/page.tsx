import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { byCategory, getCategories, getCategory, summarize } from "../../../lib/catalog";
import { PageHero } from "../../../components/ui";
import { ProductCard } from "../../../components/product/ProductCard";
import type { CategorySlug } from "../../../lib/types";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCategory((await params).slug);
  if (!c) return {};
  return { title: c.name, description: c.blurb, alternates: { canonical: `/product-category/${c.slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const c = getCategory((await params).slug);
  if (!c) notFound();
  const items = byCategory(c.slug as CategorySlug).map(summarize);
  return (
    <>
      <PageHero crumbs={[{ href: "/shop", label: "Compounds" }, { label: c.name }]} eyebrow="Category" title={c.name} lead={c.blurb} />
      <section className="container" style={{ padding: "32px var(--gutter) var(--section-y)" }}>
        <p className="shop-count">{items.length} {items.length === 1 ? "compound" : "compounds"}</p>
        {items.length ? (
          <div className="grid-products">
            {items.map((p, i) => <ProductCard key={p.slug} p={p} delay={(i % 4) * 60} />)}
          </div>
        ) : (
          <p className="shop-empty">Nothing here yet — check back soon.</p>
        )}
      </section>
    </>
  );
}
