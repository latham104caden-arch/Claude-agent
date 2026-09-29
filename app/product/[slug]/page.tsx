import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getCategory, getProduct, related, summarize } from "../../../lib/catalog";
import { RUO_SHORT } from "../../../lib/site";
import { JsonLd, productLd } from "../../../lib/seo";
import { Crumbs, SectionHead } from "../../../components/ui";
import { Vial } from "../../../components/Vial";
import { Icon } from "../../../components/Icon";
import { ProductCard } from "../../../components/product/ProductCard";
import { ProductPurchase } from "../../../components/product/ProductPurchase";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCatalog().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${p.subtitle}`,
    description: `${p.description} For laboratory research use only.`,
    alternates: { canonical: `/product/${p.slug}` },
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
      <div className="container" style={{ paddingTop: 24 }}>
        <Crumbs items={[{ href: "/shop", label: "Compounds" }, ...(cat ? [{ href: `/product-category/${cat.slug}`, label: cat.name }] : []), { label: p.name }]} />
      </div>

      <section className="container pdp">
        <div className="pdp-gallery">
          <Vial name={p.name} option={p.variants[0].option} accent={p.accent} />
        </div>
        <div className="pdp-info">
          <p className="pdp-sub">{p.subtitle}</p>
          <h1>{p.name}</h1>
          <div className="pdp-badges">
            <span className="badge">Research Use Only</span>
            {p.coaLot ? <span className="badge badge--dark">COA available</span> : null}
            {p.badge ? <span className="badge">{p.badge}</span> : null}
          </div>
          <p className="pdp-desc">{p.description}</p>
          <ProductPurchase product={p} />
          <div className="pdp-assure">
            <div><Icon name="shield" /> ≥99% purity target</div>
            <div><Icon name="cert" /> Third-party tested</div>
            <div><Icon name="truck" /> Ships in 1 business day</div>
          </div>
          <div className="callout pdp-ruo"><strong>Research use only.</strong> {RUO_SHORT}</div>
        </div>
      </section>

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
