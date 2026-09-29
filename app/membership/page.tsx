import type { Metadata } from "next";
import { MEMBERSHIP_PERKS } from "../../data/content";
import { PageHero, SectionHead, StubNotice } from "../../components/ui";
import { Icon } from "../../components/Icon";

export const metadata: Metadata = { title: "Membership", description: "Member pricing, free shipping and early access for researchers who order regularly.", alternates: { canonical: "/membership" } };

export default function MembershipPage() {
  return (
    <>
      <PageHero crumbs={[{ label: "Membership" }]} eyebrow="Membership" title={<>Research more, <em>spend less.</em></>}
        lead="For labs that order regularly: standing member pricing, free shipping and first access to new compounds." />
      <section className="section">
        <div className="container">
          <div className="card plan">
            <span className="badge badge--dark">Revised Member</span>
            <p className="plan-price">$—<small> / month</small></p>
            <p className="muted">Pricing to be announced.</p>
            <ul>
              {MEMBERSHIP_PERKS.map((p) => <li key={p.title}><Icon name="check" /><span><b>{p.title}.</b> {p.body}</span></li>)}
            </ul>
            <button type="button" className="btn btn--primary btn--block" disabled>Join — Coming Soon</button>
          </div>
          <div style={{ maxWidth: 440, margin: "20px auto 0" }}>
            <StubNotice>Subscriptions are not connected. Billing will be wired to the payment provider later.</StubNotice>
          </div>
        </div>
      </section>
      <section className="section section--alt">
        <div className="container">
          <SectionHead eyebrow="Perks" title="What members get" />
          <div className="card-grid">
            {MEMBERSHIP_PERKS.map((p) => <div className="card" key={p.title}><span className="ic-tile"><Icon name="check" /></span><h3>{p.title}</h3><p>{p.body}</p></div>)}
          </div>
        </div>
      </section>
    </>
  );
}
