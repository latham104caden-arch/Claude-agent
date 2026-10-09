import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog, getProduct } from "../../lib/catalog";
import { NON_COMPOUND_SLUGS, PARTNER, PARTNER_TIERS, partnerQuote } from "../../lib/partner";
import { money } from "../../lib/format";
import { SITE } from "../../lib/site";
import { Icon } from "../../components/Icon";
import { PageHero, SectionHead } from "../../components/ui";
import { KitBuilder, type KitProduct } from "../../components/partner/KitBuilder";

export const metadata: Metadata = {
  title: PARTNER.name,
  description: "Bulk pricing for research labs: kits of 10, 20 or 30 vials at 40%, 45% or 50% off. Build your kit, see your savings, and send it to our team.",
  alternates: { canonical: PARTNER.path },
};

/** Worked example priced from the live catalog, so the dollar figures stay true. */
const EXAMPLE_SLUG = "bpc-157";

export default function BulkPage() {
  const ex = getProduct(EXAMPLE_SLUG);
  const v = ex?.variants.find((x) => x.inStock) ?? ex?.variants[0];
  const products: KitProduct[] = getCatalog()
    .filter((p) => p.category !== "supplies" && !NON_COMPOUND_SLUGS.has(p.slug))
    .map((p) => ({ slug: p.slug, name: p.name, variants: p.variants.filter((x) => x.inStock).map((x) => ({ sku: x.sku, option: x.option, price: x.price })) }))
    .filter((p) => p.variants.length)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHero
        crumbs={[{ label: PARTNER.name }]}
        eyebrow={PARTNER.name}
        title={<>Stock your lab, <em>save up to {PARTNER_TIERS[PARTNER_TIERS.length - 1].percent}%.</em></>}
        lead="Pricing for labs that order in kits of 10, 20 or 30 vials. Build your kit, see exactly what you save in dollars, and send it to our team. We confirm lots and set up your bulk pricing, usually within one business day."
      >
        <div className="partner-hero-ctas">
          <a href="#build" className="btn btn--dark">Build your kit <Icon name="arrow" /></a>
          <a href={`mailto:${SITE.supportEmail}?subject=${encodeURIComponent("Bulk pricing")}`} className="btn btn--ghost">Email us first</a>
        </div>
      </PageHero>

      <section className="section partner-tiers-section">
        <div className="container">
          <SectionHead eyebrow="Kit pricing" title={<>The more you stock, <em>the more you save.</em></>} lead={ex && v ? `Every example is ${ex.name} ${v.option} at ${money(v.price)} a vial. Mix any compounds and sizes; every vial counts toward your kit.` : "Mix any compounds and sizes; every vial counts toward your kit."} />
          <div className="partner-tiers">
            {PARTNER_TIERS.map((t, i) => {
              const q = ex && v ? partnerQuote([{ slug: ex.slug, price: v.price, qty: t.kit }]) : null;
              const top = i === PARTNER_TIERS.length - 1;
              return (
                <div className={"card partner-tier" + (top ? " is-top" : "")} key={t.kit}>
                  {top ? <span className="partner-tier-flag">Best value</span> : null}
                  <p className="partner-tier-kit">Kit of {t.kit}{top ? "+" : ""} vials</p>
                  <p className="partner-tier-pct">{t.percent}% <small>off</small></p>
                  {q ? (
                    <>
                      <p className="partner-tier-save">Save {money(q.savings)}</p>
                      <p className="partner-tier-math"><s>{money(q.regular)}</s> <b>{money(q.partner)}</b> <small>for {t.kit} vials</small></p>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section--alt partner-build-section" id="build">
        <div className="container">
          <SectionHead eyebrow="Kit builder" title={<>Build your kit, <em>see your savings.</em></>} lead="Add compounds and quantities. Your regular price, bulk price and saving update as you go." />
          <KitBuilder products={products} />
        </div>
      </section>

      <section className="section">
        <div className="container two-col">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="h2">Talk to us, <em>then stock up.</em></h2>
            <p className="lead">Bulk pricing isn&apos;t applied at checkout. Our team confirms lot availability and certificates for your kit first, then sets up your pricing.</p>
          </div>
          <ol className="partner-steps">
            <li><span className="step-num">1</span><div><b>Build your kit.</b> Mix any compounds and sizes. Kits start at 10 vials.</div></li>
            <li><span className="step-num">2</span><div><b>Send it to us.</b> We reply within one business day with lot numbers and your bulk pricing.</div></li>
            <li><span className="step-num">3</span><div><b>Confirm and ship.</b> Pay through the secure link we send, and your kit ships with its certificates.</div></li>
          </ol>
        </div>
        <div className="container partner-fine">
          <ul>
            <li>Bulk pricing covers research compounds. Reconstitution solution isn&apos;t discounted and doesn&apos;t count toward a kit.</li>
            <li>Bulk pricing can&apos;t be combined with other codes or offers.</li>
            <li>Rather order now? You can always <Link href="/shop">check out at regular prices</Link>.</li>
            <li>All products are sold for laboratory research use only. Not for human or veterinary use.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
