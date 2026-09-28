import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "../../data/content";
import { PageHero } from "../../components/ui";

export const metadata: Metadata = { title: "Research Library", description: "Guides on COAs, purity and handling research compounds.", alternates: { canonical: "/research" } };

export default function ResearchIndex() {
  return (
    <>
      <PageHero crumbs={[{ label: "Research Library" }]} eyebrow="Research Library" title={<>Lab <em>notes.</em></>} lead="Plain-language guides to testing, purity and handling." />
      <section className="section">
        <div className="container card-grid">
          {ARTICLES.map((a) => (
            <Link key={a.slug} href={`/research/${a.slug}`} className="card article-card">
              <time dateTime={a.date}>{a.date}</time>
              <h2>{a.title}</h2>
              <p>{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
