import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "../../../../components/ui";
import { PartnerPay } from "../../../../components/partner/PartnerPay";
import { approvalState, getApproval, priceApproval } from "../../../../lib/partner-approvals";
import { money } from "../../../../lib/format";
import { PARTNER } from "../../../../lib/partner";
import { SITE } from "../../../../lib/site";

export const metadata: Metadata = { title: "Partner checkout", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Private checkout for an approved Research Partner kit (link emailed to the lab). */
export default async function PartnerCheckoutPage({ params }: { params: Promise<{ token: string }> }) {
  const a = await getApproval((await params).token);
  const state = a ? approvalState(a) : null;
  const priced = a && state === "open" ? priceApproval(a) : null;

  const closed = (title: string, lead: string) => (
    <PageHero eyebrow={PARTNER.name} title={title} lead={lead}>
      <div className="partner-hero-ctas">
        <a href={`mailto:${SITE.supportEmail}?subject=${encodeURIComponent("Research Partner link")}`} className="btn btn--primary">Email us</a>
        <Link href={PARTNER.path} className="btn btn--ghost">Partner pricing</Link>
      </div>
    </PageHero>
  );
  if (!a) return closed("This link isn't valid.", "Partner checkout links are private and come from our team by email. Check the link, or contact us and we'll help.");
  if (state === "paid") return closed("This kit is already paid for.", "Thanks for your order. Your receipt went to your email. Need another kit? Send it to us from the partner page.");
  if (state === "expired") return closed("This link has expired.", "Partner links are good for 14 days. Reply to your approval email or contact us and we'll send a new one.");
  if (!priced || !priced.ok) return closed("We can't price this kit right now.", `${priced && !priced.ok ? priced.message : ""} Contact us and we'll sort it out.`);

  const until = new Date(a.expiresAt).toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric" });
  return (
    <>
      <PageHero eyebrow={PARTNER.name} title={<>Your approved kit, <em>at partner pricing.</em></>} lead={`For ${a.contact.name}${a.contact.organization ? ` · ${a.contact.organization}` : ""}. This private link works once and is good until ${until}.`} />
      <section className="section">
        <div className="container checkout-grid">
          <div className="card summary">
            <h2 className="h3" style={{ marginBottom: 12 }}>Your kit</h2>
            {priced.lines.map((l) => (
              <div className="summary-row" key={l.sku}>
                <span>{l.qty} × {l.name} ({l.option}){l.tier ? <><br /><small className="muted">{l.tier.percent}% off · {money(l.unit)} each <s>{money(l.price)}</s></small></> : null}</span>
                <span>{money(l.unit * l.qty)}</span>
              </div>
            ))}
          </div>
          <aside className="card summary">
            <h2 className="h3" style={{ marginBottom: 12 }}>Order Summary</h2>
            <div className="summary-row"><span>Regular price</span><span>{money(priced.regular)}</span></div>
            <div className="summary-row summary-discount"><span>Partner pricing</span><span>−{money(priced.savings)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{priced.shipping ? money(priced.shipping) : "Free"}</span></div>
            <div className="summary-row total"><span>Total</span><span>{money(priced.partner + priced.shipping)}</span></div>
            <div style={{ marginTop: 16 }}>
              <PartnerPay token={a.token} total={money(priced.partner + priced.shipping)} />
            </div>
            <p className="drawer-note">Questions first? Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. For laboratory research use only.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
