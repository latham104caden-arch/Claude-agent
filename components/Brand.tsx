import Link from "next/link";
import { SITE } from "../lib/site";

/** The "R" monogram: a navy tile with a mint re-direction arc ("revised"). */
export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="var(--navy)" />
      <path d="M13 29V11h8.2a5.6 5.6 0 0 1 0 11.2H13" fill="none" stroke="var(--bg)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 22.2 27.5 29" fill="none" stroke="var(--mint)" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="brand" aria-label={`${SITE.name} — home`} onClick={onClick}>
      <BrandMark />
      <span className="brand-word">
        <b>Revised</b>
        <span>Research</span>
      </span>
    </Link>
  );
}
