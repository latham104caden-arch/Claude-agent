import type { Product } from "./types";
import { SITE } from "./site";
import { displayPrice } from "./catalog";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    email: SITE.supportEmail,
    description: SITE.description,
  };
}

export function productLd(p: Product) {
  const { amount } = displayPrice(p);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.variants[0]?.sku,
    brand: { "@type": "Brand", name: SITE.name },
    url: `${SITE.url}/product/${p.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: amount,
      highPrice: Math.max(...p.variants.map((v) => v.price)),
      offerCount: p.variants.length,
      availability: p.variants.some((v) => v.inStock) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}
