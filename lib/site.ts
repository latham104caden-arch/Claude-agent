/**
 * Single source of truth for brand-level config.
 * Anything that says "Revised Research", a nav row, or a contact address
 * should read from here so the header, footer, drawer and SEO never drift.
 */
export const SITE = {
  name: "Revised Research",
  shortName: "Revised",
  legalName: "Revised Research LLC",
  tagline: "Research compounds, verified by lot.",
  description:
    "Revised Research supplies high-purity research compounds with independent certificates of analysis published for every lot. For laboratory research use only.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://revisedresearch.com",
  // TODO: confirm real inbox before launch.
  supportEmail: "support@revisedresearch.com",
  minAge: 21,
  freeShippingThreshold: 200,
  social: [] as { label: string; href: string }[],
} as const;

export type NavItem = { href: string; label: string };

/** Desktop header nav. Account lives on its own icon button. */
export const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Compounds" },
  { href: "/coas", label: "COAs" },
  { href: "/affiliate", label: "Partner Program" },
  { href: "/membership", label: "Membership" },
  { href: "/contact", label: "Contact" },
];

/** Mobile menu = desktop nav + Account (the account icon is hidden on phones). */
export const MOBILE_NAV: NavItem[] = [...NAV, { href: "/my-account", label: "Account" }];

export const FOOTER_COLUMNS: { title: string; links: NavItem[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All Compounds" },
      { href: "/product-category/repair-immune", label: "Repair & Immune" },
      { href: "/product-category/metabolic-gh", label: "Metabolic & GH" },
      { href: "/product-category/cognitive-longevity", label: "Cognitive & Longevity" },
      { href: "/product-category/bundles", label: "Bundles" },
      { href: "/coas", label: "COAs" },
      { href: "/membership", label: "Membership" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/research", label: "Research Library" },
      { href: "/affiliate", label: "Partner Program" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
];

export const LEGAL_LINKS: NavItem[] = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export const RUO_DISCLAIMER =
  "These products are sold for research, educational, and analytical laboratory use only. They are not approved by the FDA for human or veterinary use, medical devices, or commercial purposes. By purchasing, the buyer agrees that these products are not for ingestion or any application to humans or animals and will be handled only by qualified professionals. Revised Research assumes no liability for any misuse of these products. Sold only to qualified researchers 21 years of age or older.";

export const RUO_SHORT =
  "For laboratory research use only. Not for human or veterinary use. Not intended to diagnose, treat, cure or prevent any disease.";
