import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES } from "../../../data/content";
import { RUO_SHORT } from "../../../lib/site";
import { PageHero } from "../../../components/ui";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  return a ? { title: a.title, description: a.excerpt, alternates: { canonical: `/research/${a.slug}` } } : {};
}

export default async function Article({ params }: Props) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <>
      <PageHero crumbs={[{ href: "/research", label: "Research Library" }, { label: a.title }]} eyebrow={a.date} title={a.title} lead={a.excerpt} />
      <article className="container prose" style={{ padding: "48px var(--gutter) var(--section-y)" }}>
        {a.body.map((p, i) => <p key={i}>{p}</p>)}
        <p className="callout" style={{ marginTop: 32 }}>{RUO_SHORT}</p>
      </article>
    </>
  );
}
