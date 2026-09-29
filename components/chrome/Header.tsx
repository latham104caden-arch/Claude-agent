"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, MOBILE_NAV, SITE } from "../../lib/site";
import type { ProductSummary } from "../../lib/catalog";
import { Brand } from "../Brand";
import { Icon } from "../Icon";
import { useCart } from "../cart/CartProvider";
import { SearchOverlay } from "./SearchOverlay";

/**
 * Site header + full-screen mobile menu + search.
 * Same shape as the Ventra header: burger (mobile) · brand · nav · search/account/cart.
 * React is the only owner of the open/closed state — no DOM class toggling.
 */
export function Header({ products }: { products: ProductSummary[] }) {
  const pathname = usePathname();
  const { count, ready, setOpen: setCartOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // One scroll lock for both panels.
  useEffect(() => {
    document.body.style.overflow = menu || search ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menu, search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMenu(false); setSearch(false); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the menu on navigation.
  useEffect(() => { setMenu(false); }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className={"site-header" + (scrolled ? " is-scrolled" : "")}>
        <div className="container">
          <button type="button" className="icon-btn menu-btn" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
            <Icon name="menu" />
          </button>
          <Brand />
          <nav className="hdr-nav" aria-label="Primary">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hdr-right">
            <button type="button" className="icon-btn" aria-label="Search compounds" onClick={() => setSearch(true)}>
              <Icon name="search" />
            </button>
            <Link className="icon-btn acct-btn" href="/my-account" aria-label="Account">
              <Icon name="user" />
            </Link>
            <button type="button" className="icon-btn" aria-label={`Cart, ${count} items`} onClick={() => setCartOpen(true)}>
              <Icon name="bag" />
              {ready && count > 0 ? <span className="cart-count">{count}</span> : null}
            </button>
            <Link href="/shop" className="btn btn--dark hdr-cta">
              Shop Now <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </header>

      <div className={"mnav" + (menu ? " is-open" : "")} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!menu}>
        <div className="mnav-head">
          <Brand onClick={() => setMenu(false)} />
          <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setMenu(false)}>
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label="Mobile">
          {MOBILE_NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMenu(false)}>
              {n.label}
              <Icon name="chevron" />
            </Link>
          ))}
        </nav>
        <div className="mnav-foot">
          <Link className="btn btn--dark btn--block" href="/my-account" onClick={() => setMenu(false)}>
            <Icon name="user" /> Sign in
          </Link>
          <a className="muted" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
        </div>
      </div>

      {search ? <SearchOverlay items={products} onClose={() => setSearch(false)} /> : null}
    </>
  );
}
