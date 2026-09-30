import Link from "next/link";
import { getCatalog, getCategories, bestSellers, summarize } from "../../lib/catalog";
import { COAS, QC_PILLARS, QC_STATS, TICKER, WHY_US } from "../../data/content";
import { REVIEWS, REVIEWS_SOURCE } from "../../data/reviews";
import { RUO_SHORT } from "../../lib/site";
import { Icon } from "../Icon";
import { Vial } from "../Vial";
import { SectionHead } from "../ui";
import { ProductCard } from "../product/ProductCard";
import { WavingFlag } from "./WavingFlag";

/**
 * Poster-style hero: headline on the left; on the right a giant blurred
 * "REVISED" wordmark behind one floating hero vial, two small glass callouts
 * and two out-of-focus vials for depth. Deliberately sparse — on phones only
 * the wordmark and vial remain.
 */
export function Hero() {
  const catalog = getCatalog();
  const star = catalog.find((p) => p.slug === "bpc-157") ?? catalog[0];
  const starOption = star.variants[star.variants.length - 1].option;
  const back = catalog.find((p) => p.slug === "tb-500") ?? catalog[1] ?? star;
  const back2 = catalog.find((p) => p.slug === "ghk-cu") ?? catalog[2] ?? star;
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow" data-reveal="">Third-party tested · COA every lot</p>
          <h1 className="h1" data-reveal="" data-reveal-delay="60">
            The research market<br />
            <em className="underline-accent">like you&apos;ve never seen.</em>
          </h1>
          <p className="lead" data-reveal="" data-reveal-delay="120">
            Independently tested compounds, with the certificate published before every lot ships.
          </p>
          <div className="hero-ctas" data-reveal="" data-reveal-delay="180">
            <Link href="/shop" className="btn btn--dark">Shop Compounds <Icon name="arrow" /></Link>
            <Link href="/coas" className="btn btn--ghost">View COAs</Link>
          </div>
        </div>

        <div className="hero-show" aria-hidden="true">
          <span className="hero-word">REVISED</span>
          <span className="hero-ghost hero-ghost--a"><Vial name={back.name} option={back.variants[0].option} accent={back.accent} /></span>
          <span className="hero-ghost hero-ghost--b"><Vial name={back2.name} option={back2.variants[0].option} accent={back2.accent} /></span>
          <Link href={`/product/${star.slug}`} className="hero-star" tabIndex={-1}>
            <Vial name={star.name} option={starOption} accent={star.accent} className="vial hero-star-vial" />
          </Link>
          <span className="hero-floor" />
          <span className="hero-callout hero-callout--a"><i />≥99% HPLC purity</span>
          <span className="hero-callout hero-callout--b"><i />COA on every lot</span>
        </div>
      </div>
    </section>
  );
}

export function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <section className="ticker" aria-label="Revised Research at a glance">
      <p className="sr-only">{TICKER.join(" · ")}</p>
      <div className="ticker-track" aria-hidden="true">
        {items.map((t, i) => (
          <span className="ticker-item" key={i}>
            <span className="ticker-dot"><Icon name="check" strokeWidth={2.6} /></span>{t}
          </span>
        ))}
      </div>
    </section>
  );
}

export function Categories() {
  const cats = getCategories();
  const catalog = getCatalog();
  return (
    <section className="section">
      <div className="container cats">
        <div className="cats-intro">
          <p className="eyebrow" data-reveal="">Explore Research Categories</p>
          <h2 className="h2" data-reveal="" data-reveal-delay="60">Explore.<br />Research.<br /><em>Advance.</em></h2>
          <p className="lead" data-reveal="" data-reveal-delay="100">Clean, premium research compounds at ≥99% purity.</p>
          <Link href="/shop" className="btn btn--dark" data-reveal="" data-reveal-delay="140">Browse All Compounds <Icon name="arrow" /></Link>
        </div>
        <div className="cats-grid">
          {cats.map((c, i) => {
            const sample = catalog.find((p) => p.category === c.slug);
            return (
              <Link key={c.slug} href={`/product-category/${c.slug}`} className="cat-card" data-reveal="" data-reveal-delay={String(i * 70)}>
                <span className="cat-art">
                  <Vial name={sample?.name ?? c.name} accent={sample?.accent} />
                </span>
                <span>
                  <h3>{c.name}</h3>
                  <p>{c.blurb}</p>
                  <span className="cat-go">View {c.name.split(" ")[0]} <Icon name="arrow" /></span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CoaBand() {
  const c = COAS[0];
  return (
    <section className="section section--dark coa-band">
      {/* Background layer: blurred waving flag, behind all content */}
      <WavingFlag />
      <div className="container coa-band-grid">
        <div>
          <p className="eyebrow" data-reveal="">Certificate of Analysis</p>
          <h2 className="h2" data-reveal="" data-reveal-delay="60">COAs on every <em>batch.</em></h2>
          <p className="lead" data-reveal="" data-reveal-delay="100">Independent laboratory results, published by lot. Open in full — no login, no request form.</p>
          <p style={{ marginTop: 28 }} data-reveal="" data-reveal-delay="140">
            <Link href="/coas" className="btn btn--primary">View COAs <Icon name="arrow" /></Link>
          </p>
        </div>
        <div className="coa-doc" data-reveal="" data-reveal-delay="120" aria-hidden="true">
          <div className="coa-doc-head">
            <b>Certificate of Analysis</b>
            <span className="badge">Pass</span>
          </div>
          <dl>
            <dt>Compound</dt><dd>{c.productName}</dd>
            <dt>Lot</dt><dd className="mono">{c.lot}</dd>
            <dt>Strength</dt><dd>{c.strength}</dd>
            <dt>Purity (HPLC)</dt><dd>{c.purity}</dd>
            <dt>Identity (MS)</dt><dd>Confirmed</dd>
          </dl>
          <div className="coa-doc-bar">
            <svg viewBox="0 0 300 70" preserveAspectRatio="none">
              <path d="M0 66 L60 65 L90 63 L110 60 L125 8 L140 58 L170 63 L220 64 L240 60 L250 52 L260 61 L300 65" fill="none" stroke="var(--accent-ink)" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BestSellers() {
  const list = bestSellers(8).map(summarize);
  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow="Shop Best Sellers" title={<>Chosen by over 10k <em>Researchers.</em></>} action={{ href: "/shop", label: "Shop All" }} />
        <div className="grid-products">
          {list.map((p, i) => <ProductCard key={p.slug} p={p} delay={(i % 4) * 60} />)}
        </div>
      </div>
    </section>
  );
}

export function QualityControl() {
  return (
    <section className="section section--alt">
      <div className="container">
        <SectionHead
          eyebrow="Quality Control"
          title={<>Every lot, <em>tested.</em></>}
          lead="What happens to a batch between synthesis and your bench."
        />
        <div className="qc-stats">
          {QC_STATS.map((s, i) => (
            <div className="qc-stat" key={s.label} data-reveal="" data-reveal-delay={String(i * 70)}>
              <b>{s.value}</b><span>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="qc-pillars">
          {QC_PILLARS.map((p, i) => (
            <div className="qc-pillar" key={p.label} data-reveal="" data-reveal-delay={String(i * 70)}>
              <span className="ic-tile"><Icon name={p.icon} /></span>
              <h3>{p.label}</h3>
              <p>{p.blurb}</p>
            </div>
          ))}
        </div>
        <div className="qc-cta" data-reveal="">
          <p><small>Proof on demand</small>Read the certificate before you buy, not after.</p>
          <Link href="/coas" className="btn btn--primary">View COAs <Icon name="arrow" /></Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Reviews: verbatim customer emails (see data/reviews.ts for the rules).
 * A swipeable row; no star ratings because none were given.
 */
export function Reviews() {
  const initials = (n: string) => n.replace(/^(Dr|Prof)\.\s+/, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow="Reviews" title={<>Real Researchers, Real <em>Reviews.</em></>} lead="In their own words, as they wrote to us." />
      </div>
      <div className="reviews-row" role="list" aria-label="Customer reviews">
        {REVIEWS.map((r) => (
          <figure className="review-card" role="listitem" key={r.name}>
            <span className="review-mark" aria-hidden="true">&ldquo;</span>
            <blockquote>{r.quote}</blockquote>
            <figcaption>
              <span className="review-avatar" aria-hidden="true">{initials(r.name)}</span>
              {r.name}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="container">
        <p className="reviews-source">{REVIEWS_SOURCE}</p>
      </div>
    </section>
  );
}

export function WhyUs() {
  return (
    <section className="section section--alt">
      <div className="container">
        <SectionHead
          eyebrow="Why Revised"
          title={<>Built in Labs.<br />Backed by <em>Science.</em></>}
          lead="The standards behind every order, in plain terms."
          action={{ href: "/about", label: "Our Standards" }}
        />
        <div className="why-grid">
          {WHY_US.map((w) => (
            <div className="why-item" key={w.title}>
              <span className="ic-tile"><Icon name={w.icon} /></span>
              <h3>{w.title}</h3>
              <p>{w.body}</p>
            </div>
          ))}
        </div>
        <p className="ruo-line">{RUO_SHORT}</p>
      </div>
    </section>
  );
}
