import type { MetadataRoute } from "next";
import { getCatalog, getCategories } from "../lib/catalog";
import { ARTICLES } from "../data/content";
import { SITE } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const pages = ["", "/shop", "/coas", "/about", "/faq", "/contact", "/membership", "/affiliate", "/research",
    "/privacy-policy", "/shipping-policy", "/refund-policy", "/terms", "/disclaimer"];
  return [
    ...pages.map((p) => ({ url: base + p })),
    ...getCategories().map((c) => ({ url: `${base}/product-category/${c.slug}` })),
    ...getCatalog().map((p) => ({ url: `${base}/product/${p.slug}` })),
    ...ARTICLES.map((a) => ({ url: `${base}/research/${a.slug}`, lastModified: a.date })),
  ];
}
