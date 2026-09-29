import type { Metadata, Viewport } from "next";
import { SITE } from "../lib/site";
import { getCatalog, summarize } from "../lib/catalog";
import { CartProvider } from "../components/cart/CartProvider";
import { CartDrawer } from "../components/cart/CartDrawer";
import { Header } from "../components/chrome/Header";
import { Footer } from "../components/chrome/Footer";
import { EntryGate } from "../components/chrome/EntryGate";
import { Reveal } from "../components/chrome/Reveal";
import { Announcement } from "../components/chrome/Announcement";

import "@fontsource-variable/inter";
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/newsreader/opsz-italic.css";
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/chrome.css";
import "../styles/home.css";
import "../styles/shop.css";
import "../styles/pages.css";

// Fonts are self-hosted via Fontsource (no build-time network fetch).

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, url: SITE.url, title: SITE.name, description: SITE.description },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const searchIndex = getCatalog().map(summarize);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Opt into scroll-reveal only when JS runs, so no-JS visitors and crawlers see everything. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <CartProvider>
          <Announcement />
          <Header products={searchIndex} />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
          <EntryGate />
          <Reveal />
        </CartProvider>
      </body>
    </html>
  );
}
