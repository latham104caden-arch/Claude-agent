import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL } from "../../data/legal";
import { RUO_DISCLAIMER } from "../../lib/site";
import { PageHero } from "../ui";

const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function legalMetadata(slug: string): Metadata {
  const doc = LEGAL[slug];
  return doc ? { title: doc.title, alternates: { canonical: `/${slug}` } } : {};
}

export function LegalPage({ slug }: { slug: string }) {
  const doc = LEGAL[slug];
  if (!doc) notFound();
  return (
    <>
      <PageHero crumbs={[{ label: doc.title }]} eyebrow="Legal" title={doc.title} />
      <div className="container legal">
        <nav className="legal-toc" aria-label="On this page">
          <b>On this page</b>
          {doc.sections.map((s) => <a key={s.heading} href={`#${anchor(s.heading)}`}>{s.heading}</a>)}
        </nav>
        <article className="prose">
          <p className="legal-updated">Last updated {doc.updated}</p>
          {doc.sections.map((s) => (
            <section key={s.heading} id={anchor(s.heading)}>
              <h2>{s.heading}</h2>
              {s.body.map((b, i) => <p key={i}>{b === "__RUO__" ? RUO_DISCLAIMER : b}</p>)}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
