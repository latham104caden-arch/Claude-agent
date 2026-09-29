import type { Metadata } from "next";
import Link from "next/link";
import { QC_PILLARS, WHY_US } from "../../data/content";
import { SITE } from "../../lib/site";
import { PageHero, SectionHead } from "../../components/ui";
import { Icon } from "../../components/Icon";

export const metadata: Metadata = { title: "About", description: `The standards behind ${SITE.name}.`, alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <>
      <PageHero crumbs={[{ label: "About" }]} eyebrow="About" title={<>Research, <em>revised.</em></>}
        lead={`${SITE.name} was built on one idea: a research supplier should show its work. Every lot is tested by an independent lab, and every certificate is public.`} />
      <section className="section">
        <div className="container two-col">
          <div>
            <p className="eyebrow">Our standard</p>
            <h2 className="h2">Proof before <em>purchase.</em></h2>
          </div>
          <div className="prose">
            <p>Placeholder brand story. Replace with who you are, why Revised Research exists, and what makes the sourcing and testing different.</p>
            <p>Every compound we list has a lot number, and every lot number has a certificate you can read before you buy.</p>
            <p style={{ marginTop: 24 }}><Link href="/coas" className="btn btn--dark">See the certificates <Icon name="arrow" /></Link></p>
          </div>
        </div>
      </section>
      <section className="section section--alt">
        <div className="container">
          <SectionHead eyebrow="Quality" title="How every lot is checked" />
          <div className="card-grid">
            {QC_PILLARS.map((p) => (
              <div className="card" key={p.label}><span className="ic-tile"><Icon name={p.icon} /></span><h3>{p.label}</h3><p>{p.blurb}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Commitments" title="What you can count on" />
          <div className="card-grid">
            {WHY_US.map((w) => (
              <div className="card" key={w.title}><span className="ic-tile"><Icon name={w.icon} /></span><h3>{w.title}</h3><p>{w.body}</p></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
