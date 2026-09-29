import Link from "next/link";
import { FOOTER_COLUMNS, LEGAL_LINKS, RUO_DISCLAIMER, SITE } from "../../lib/site";
import { Brand } from "../Brand";
import { Icon } from "../Icon";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <h2>Research with <em>proof</em> on every vial.</h2>
          <Link href="/shop" className="btn btn--primary">Shop Compounds <Icon name="arrow" /></Link>
        </div>
        <div className="footer-grid">
          <div>
            <Brand />
            <p className="footer-desc">Independent laboratory certificates, published lot by lot, before the batch ships.</p>
            <a className="footer-mail" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <div className="footer-links">
                {col.links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-disclaimer">
          <p><strong>Disclaimer:</strong> {RUO_DISCLAIMER}</p>
        </div>

        <div className="footer-bottom">
          <p>&copy; {year} {SITE.legalName}. All rights reserved.</p>
          <nav aria-label="Legal">
            {LEGAL_LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </nav>
        </div>
      </div>
    </footer>
  );
}
