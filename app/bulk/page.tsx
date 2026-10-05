import type { Metadata } from "next";
import Link from "next/link";
import { getProduct } from "../../lib/catalog";
import { BULK_TIERS, bulkFor } from "../../lib/bulk";
import { money } from "../../lib/format";
import { Icon } from "../../components/Icon";
import { PageHero, SectionHead } from "../../components/ui";

export const metadata: Metadata = {
  title: "Bulk Pricing",
  description: "Buy 10, 20 or 30+ research compounds in one order and save, with free shipping on every bulk order.",
  alternates: { canonical: "/bulk" },
};

/** Worked example priced from the live catalog, so the dollar figures stay true. */
const EXAMPLE_SLUG = "bpc-157";

export default function BulkPage() {
  const ex = getProduct(EXAMPLE_SLUG);
  const v = ex?.variants[0];
  return (
    <>
      <PageHero
        crumbs={[{ label: "Bulk Pricing" }]}
        eyebrow="Bulk Pricing"
        title={<>Buy more, <em>pay less.</em></>}
        lead="Put 10, 20 or 30+ compounds in one order and the discount comes off at checkout automatically, with free shipping on every bulk order. Mix any compounds and sizes."
      />
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Tiers" title="What you save" lead={ex && v ? `Shown on ${ex.name} ${v.option} at ${money(v.price)} a vial. Any mix of compounds counts.` : undefined} />
          <div className="card-grid">
            {BULK_TIERS.map((t, i) => {
              const save = ex && v ? bulkFor([{ slug: ex.slug, price: v.price, qty: t.min }]).amount : 0;
              return (
                <div className="card bulk-tier" key={t.min}>
                  <span className="step-num">{i + 1}</span>
                  <h3>{t.min}+ compounds</h3>
                  {v ? <p className="bulk-save">Save {money(save)}</p> : null}
                  {v ? <p>{t.min} vials: <s>{money(v.price * t.min)}</s> <b>{money(v.price * t.min - save)}</b></p> : null}
                  <p className="bulk-ship"><Icon name="truck" /> Free shipping</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section section--alt">
        <div className="container two-col">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="h2">No code <em>needed.</em></h2>
          </div>
          <ul className="bulk-rules">
            <li>Add compounds to your cart. Every vial counts toward the tier, in any mix of products and sizes.</li>
            <li>At 10, 20 or 30 vials, your cart and checkout show exactly how many dollars you save.</li>
            <li>Bulk orders ship free. Reconstitution solution doesn&apos;t count toward a tier and isn&apos;t discounted.</li>
            <li>Bulk pricing replaces discount codes. A bulk order can&apos;t also use a creator or reward code.</li>
          </ul>
        </div>
        <div className="container" style={{ marginTop: 32 }}>
          <Link href="/shop" className="btn btn--primary">Shop Compounds <Icon name="arrow" /></Link>
        </div>
      </section>
    </>
  );
}
