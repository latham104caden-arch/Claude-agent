/** Small shared presentational pieces used across pages. */
import Link from "next/link";
import { Icon } from "./Icon";

export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  crumbs?: { href?: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        {crumbs ? <Crumbs items={crumbs} /> : null}
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="h2">{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  const all = [{ href: "/", label: "Home" }, ...items];
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {all.map((c, i) => (
        <span key={i} style={{ display: "contents" }}>
          {i > 0 ? <span aria-hidden="true">/</span> : null}
          {c.href && i < all.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === all.length - 1 ? "page" : undefined}>{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow" data-reveal="">{eyebrow}</p>
        <h2 className="h2" data-reveal="" data-reveal-delay="60">{title}</h2>
        {lead ? <p className="lead" data-reveal="" data-reveal-delay="100">{lead}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="btn btn--ghost" data-reveal="">
          {action.label} <Icon name="arrow" />
        </Link>
      ) : null}
    </div>
  );
}

export function StubNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice-stub" role="note">
      <Icon name="info" className="stub-ic" />
      <div>{children}</div>
    </div>
  );
}
