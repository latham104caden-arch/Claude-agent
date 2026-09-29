import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "../../lib/site";
import { PageHero } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { ContactForm } from "../../components/forms/ContactForm";

export const metadata: Metadata = { title: "Contact", description: `Contact ${SITE.name} support.`, alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <>
      <PageHero crumbs={[{ label: "Contact" }]} eyebrow="Contact" title={<>Talk to a <em>real person.</em></>}
        lead="Include your order number if you have one. A person replies within one business day." />
      <section className="section">
        <div className="container two-col">
          <div className="stack">
            <div className="card">
              <span className="ic-tile"><Icon name="mail" /></span>
              <h3 className="h3" style={{ margin: "14px 0 6px" }}>Email</h3>
              <a href={`mailto:${SITE.supportEmail}`} style={{ color: "var(--accent-ink)", fontWeight: 600 }}>{SITE.supportEmail}</a>
            </div>
            <div className="card">
              <span className="ic-tile"><Icon name="book" /></span>
              <h3 className="h3" style={{ margin: "14px 0 6px" }}>Quick answers</h3>
              <p className="muted">Shipping, storage, and order questions are covered in the <Link href="/faq" style={{ color: "var(--accent-ink)" }}>FAQ</Link>.</p>
            </div>
          </div>
          <div className="card"><ContactForm /></div>
        </div>
      </section>
    </>
  );
}
