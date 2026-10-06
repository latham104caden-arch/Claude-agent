import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { displayPrice, getCatalog, getCategory, getProduct, related, summarize } from "../../../lib/catalog";
import { JsonLd, productImage, productLd } from "../../../lib/seo";
import { SITE } from "../../../lib/site";
import { SectionHead } from "../../../components/ui";
import { ProductCard } from "../../../components/product/ProductCard";
import { ProductStage } from "../../../components/product/ProductStage";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCatalog().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const description = `${p.description} For laboratory research use only.`;
  const image = productImage(p);
  return {
    title: `${p.name} — ${p.subtitle}`,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    // Open Graph basics here; product price tags are rendered in the page body (hoisted to <head>).
    openGraph: { siteName: SITE.name, url: `${SITE.url}/product/${p.slug}`, title: `${p.name} — ${p.subtitle}`, description, images: [{ url: image, width: 360, height: 360, alt: `${p.name} vial` }] },
    twitter: { card: "summary", title: p.name, description, images: [image] },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const cat = getCategory(p.category);
  const includes = (p.includes ?? []).map((s) => getProduct(s)).filter(Boolean);

  return (
    <>
      <JsonLd data={productLd(p)} />
      {/* Product Open Graph tags (React hoists these into <head>): Omnisend's product picker and link previews read them. */}
      <meta property="og:type" content="product" />
      <meta property="product:price:amount" content={displayPrice(p).amount.toFixed(2)} />
      <meta property="product:price:currency" content="USD" />
      <meta property="og:price:amount" content={displayPrice(p).amount.toFixed(2)} />
      <meta property="og:price:currency" content="USD" />
      <meta property="product:availability" content={p.variants.some((v) => v.inStock) ? "in stock" : "out of stock"} />
      <ProductStage
        product={p}
        categoryName={cat?.name}
        categorySlug={cat?.slug}
        pairs={related(p, 4).map(summarize).filter((r) => r.inStock)}
      />

      <section className="section section--alt">
        <div className="container">
          <SectionHead eyebrow="Compound Information" title={<>About <em>{p.name}</em></>} />
          <div className="info-grid">
            <div className="info-card">
              <h3>{includes.length ? "What's included" : "Specifications"}</h3>
              <dl className="specs">
                {p.specs.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd className={s.mono ? "mono" : undefined}>{s.value}</dd>
                  </div>
                ))}
              </dl>
              {includes.length ? (
                <p style={{ marginTop: 14, fontSize: 14 }}>
                  {includes.map((i, n) => (
                    <span key={i!.slug}>{n ? " · " : ""}<Link href={`/product/${i!.slug}`} style={{ color: "var(--accent-ink)", fontWeight: 600 }}>{i!.name}</Link></span>
                  ))}
                </p>
              ) : null}
            </div>
            <div className="info-card">
              <h3>Stability &amp; Storage</h3>
              <div className="pills">
                {p.storage.map((s) => <span className="pill" key={s}>{s}</span>)}
              </div>
              <p className="muted" style={{ fontSize: 14, marginTop: 16 }}>
                Handling guidance for laboratory settings. See our <Link href="/research/storing-research-compounds" style={{ color: "var(--accent-ink)" }}>storage guide</Link>.
              </p>
            </div>
          </div>

          <h3 className="h3" style={{ margin: "40px 0 16px" }}>Sources &amp; References</h3>
          {p.sources.length ? (
            <div className="sources">
              {p.sources.map((s, i) => (
                <article className="source" key={i}>
                  {s.journal ? <small>{s.journal}{s.year ? ` · ${s.year}` : ""}</small> : null}
                  <b>{s.title}</b>
                  {s.authors ? <p className="muted">{s.authors}</p> : null}
                  {s.link ? <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-ink)" }}>View source</a> : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">References for this compound will be added.</p>
          )}
          <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>Cited literature describes laboratory research only and is not a claim about any product&apos;s use.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Keep exploring" title="Related Compounds" action={{ href: "/shop", label: "Shop All" }} />
          <div className="grid-products">
            {related(p).map(summarize).map((r, i) => <ProductCard key={r.slug} p={r} delay={i * 60} />)}
          </div>
        </div>
      </section>
    </>
  );
}
