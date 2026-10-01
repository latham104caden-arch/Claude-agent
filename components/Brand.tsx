import Link from "next/link";
import { SITE } from "../lib/site";

/**
 * The helix mark (public/brand/, built from the owner's logo artwork). `light`
 * swaps the navy strands for white, for dark backgrounds like the footer.
 */
export function BrandMark({ className = "brand-mark", light = false }: { className?: string; light?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={light ? "/brand/logo-light.webp" : "/brand/logo.webp"} alt="" width={313} height={600} aria-hidden="true" draggable={false} />
  );
}

export function Brand({ onClick, light = false }: { onClick?: () => void; light?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label={`${SITE.name} — home`} onClick={onClick}>
      <BrandMark light={light} />
      <span className="brand-word">
        <b>Revised</b>
        <span>Research</span>
      </span>
    </Link>
  );
}
