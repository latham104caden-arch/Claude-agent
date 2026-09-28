import type { Metadata } from "next";
import { AFFILIATE_STEPS } from "../../data/content";
import { PageHero, SectionHead } from "../../components/ui";
import { AffiliateForm } from "../../components/forms/AffiliateForm";

export const metadata: Metadata = { title: "Partner Program", description: "Earn commission by sharing Revised Research with your research community.", alternates: { canonical: "/affiliate" } };

export default function AffiliatePage() {
  return (
    <>
      <PageHero crumbs={[{ label: "Partner Program" }]} eyebrow="Partner Program" title={<>Share research. <em>Earn.</em></>}
        lead="Partners get a personal code and link, and earn commission on qualifying orders." />
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="How it works" title="Three steps" />
          <div className="card-grid">
            {AFFILIATE_STEPS.map((s, i) => <div className="card" key={s.title}><span className="step-num">{i + 1}</span><h3>{s.title}</h3><p>{s.body}</p></div>)}
          </div>
        </div>
      </section>
      <section className="section section--alt">
        <div className="container two-col">
          <div>
            <p className="eyebrow">Apply</p>
            <h2 className="h2">Become a <em>partner.</em></h2>
            <p className="lead">Tell us about your audience. Commission rates and terms will be shared on approval.</p>
          </div>
          <div className="card"><AffiliateForm /></div>
        </div>
      </section>
    </>
  );
}
