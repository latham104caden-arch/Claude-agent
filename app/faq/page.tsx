import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "../../data/content";
import { SITE } from "../../lib/site";
import { JsonLd } from "../../lib/seo";
import { PageHero } from "../../components/ui";
import { Icon } from "../../components/Icon";

export const metadata: Metadata = { title: "FAQ", description: "Answers about products, storage, shipping, orders and refunds.", alternates: { canonical: "/faq" } };

export default function FaqPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((g) => g.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <>
      <JsonLd data={ld} />
      <PageHero crumbs={[{ label: "FAQ" }]} eyebrow="Support" title={<>Frequently Asked <em>Questions</em></>}
        lead={<>Can&apos;t find it here? Email <a href={`mailto:${SITE.supportEmail}`} style={{ color: "var(--mint-dark)" }}>{SITE.supportEmail}</a> or use the <Link href="/contact" style={{ color: "var(--mint-dark)" }}>contact form</Link>.</>} />
      <section className="container" style={{ padding: "48px var(--gutter) var(--section-y)", maxWidth: 880 }}>
        {FAQ.map((g) => (
          <div className="faq-group" key={g.id} id={g.id}>
            <h2>{g.title}</h2>
            <div className="acc">
              {g.items.map((i) => (
                <details key={i.q}>
                  <summary>{i.q}<Icon name="plus" /></summary>
                  <div>{i.a}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
