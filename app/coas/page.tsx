import type { Metadata } from "next";
import Link from "next/link";
import { COAS, NEW_COAS_AT } from "../../data/content";
import { CoaCountdown } from "../../components/CoaCountdown";
import { PageHero } from "../../components/ui";

export const metadata: Metadata = {
  title: "Certificates of Analysis",
  description: "Independent lab certificates of analysis for every Revised Research lot, published in full.",
  alternates: { canonical: "/coas" },
};

export default function CoasPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "COAs" }]}
        eyebrow="Certificate of Analysis"
        title={<>COAs on every <em>batch.</em></>}
        lead="Match the lot number on your vial to the certificate below. Every certificate opens in full, with no login and no request form."
      />
      <section className="container" style={{ padding: "40px var(--gutter) var(--section-y)" }}>
        <CoaCountdown at={NEW_COAS_AT} />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Compound</th><th>Lot</th><th>Strength</th><th>Purity (HPLC)</th><th>Lab</th><th>Tested</th><th>Certificate</th></tr>
            </thead>
            <tbody>
              {COAS.map((c) => (
                <tr key={c.lot} id={c.lot}>
                  <td><Link href={`/product/${c.productSlug}`}>{c.productName}</Link></td>
                  <td className="mono">{c.lot}</td>
                  <td>{c.strength}</td>
                  <td><span className="badge">{c.purity}</span></td>
                  <td>{c.lab}</td>
                  <td>{c.tested}</td>
                  <td>{c.pdf ? <a href={c.pdf} target="_blank" rel="noopener">View PDF</a> : <span className="muted">PDF pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
