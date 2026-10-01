/**
 * Editorial content: FAQ, COA table, research articles, homepage copy.
 * PLACEHOLDER — lot numbers, lab names and dates are scaffold values.
 */
import type { Coa } from "../lib/types";

export const TICKER = [
  "COAs on every batch",
  "≥ 99% purity",
  "Third-party tested",
  "Ships in one business day",
  "Secure checkout",
  "Research use only",
];

export const QC_STATS = [
  { value: "≥99%", label: "HPLC purity target" },
  { value: "100%", label: "Lots with a published COA" },
  { value: "1 day", label: "Order to carrier" },
];

export const QC_PILLARS = [
  { icon: "purity", label: "Purity", blurb: "Every lot is assayed by HPLC before it is listed." },
  { icon: "identity", label: "Identity", blurb: "Mass spectrometry confirms the compound is what the label says." },
  { icon: "sterility", label: "Handling", blurb: "Lyophilized, sealed and stored cold until it ships." },
  { icon: "coa", label: "Transparency", blurb: "Certificates are public, by lot, with no login." },
];

export const WHY_US = [
  { icon: "flask", title: "US-sourced materials", body: "Compounds are synthesized from US-sourced raw materials." },
  { icon: "cert", title: "Third-party tested", body: "Testing is done by an outside lab, so results are not self-reported." },
  { icon: "truck", title: "Ships in one business day", body: "Orders are picked, packed and handed to the carrier with tracking." },
  { icon: "lock", title: "Secure checkout", body: "Card fields will be hosted by the payment provider, never stored by us." },
  { icon: "mail", title: "A real person replies", body: "Email support with an order number and a person replies within one business day." },
  { icon: "book", title: "COAs on every batch", body: "Certificates are published as the lab issued them, open to anyone." },
];

export const COAS: Coa[] = [
  { lot: "RR-BPC-0001", productSlug: "bpc-157", productName: "BPC-157", strength: "10 mg", purity: "99.4%", lab: "Independent lab (TBD)", tested: "2026-09-01" },
  { lot: "RR-TB-0001", productSlug: "tb-500", productName: "TB-500", strength: "10 mg", purity: "99.2%", lab: "Independent lab (TBD)", tested: "2026-09-01" },
  { lot: "RR-GHK-0001", productSlug: "ghk-cu", productName: "GHK-Cu", strength: "50 mg", purity: "99.6%", lab: "Independent lab (TBD)", tested: "2026-09-03" },
  { lot: "RR-MOT-0001", productSlug: "mots-c", productName: "MOTS-C", strength: "10 mg", purity: "99.1%", lab: "Independent lab (TBD)", tested: "2026-09-05" },
  { lot: "RR-NAD-0001", productSlug: "nad-plus", productName: "NAD+", strength: "500 mg", purity: "99.3%", lab: "Independent lab (TBD)", tested: "2026-09-05" },
  { lot: "RR-EPI-0001", productSlug: "epitalon", productName: "Epitalon", strength: "10 mg", purity: "99.5%", lab: "Independent lab (TBD)", tested: "2026-09-08" },
  { lot: "RR-SMX-0001", productSlug: "semax-nasal", productName: "Semax", strength: "10 mL", purity: "99.0%", lab: "Independent lab (TBD)", tested: "2026-09-10" },
];

export type FaqGroup = { id: string; title: string; items: { q: string; a: string }[] };

export const FAQ: FaqGroup[] = [
  {
    id: "general",
    title: "Product and General Questions",
    items: [
      { q: "Who can purchase from Revised Research?", a: "Qualified researchers 21 years of age or older, for laboratory research use only." },
      { q: "Are your products for human use?", a: "No. Every product is sold strictly for in-vitro laboratory research. Not for human or veterinary use." },
      { q: "How do I know what's in the vial?", a: "Each lot has an independent certificate of analysis published on our COA page, matched by lot number." },
    ],
  },
  {
    id: "storage",
    title: "About Compounds and Storage",
    items: [
      { q: "How should lyophilized compounds be stored?", a: "Sealed and frozen at -20°C, protected from light. Refrigerate after reconstitution." },
      { q: "Do you sell diluent?", a: "Yes — bacteriostatic water is listed as Reconstitution Solution under Lab Supplies." },
    ],
  },
  {
    id: "shipping",
    title: "Shipping Questions",
    items: [
      { q: "When will my order ship?", a: "Orders placed on business days ship within one business day. Tracking is sent when the label is created." },
      { q: "Do you ship internationally?", a: "Not yet. We currently ship to US addresses only." },
    ],
  },
  {
    id: "orders",
    title: "Order and Payment Questions",
    items: [
      { q: "What payment methods do you accept?", a: "Payment options will be listed here once checkout is live." },
      { q: "Can I change my order after placing it?", a: "Email support as soon as possible with your order number; we can edit orders that have not shipped." },
    ],
  },
  {
    id: "returns",
    title: "Returns and Refunds",
    items: [
      { q: "What is your refund policy?", a: "See our Refund Policy page for the full terms." },
    ],
  },
];

export type Article = { slug: string; title: string; excerpt: string; date: string; body: string[] };

export const ARTICLES: Article[] = [
  {
    slug: "how-to-read-a-coa",
    title: "How to Read a Certificate of Analysis",
    excerpt: "What each section of a COA tells you, and what to check before you trust one.",
    date: "2026-09-01",
    body: [
      "A certificate of analysis (COA) is the lab's record of what it found when it tested a specific lot.",
      "Placeholder article body — replace with the full piece.",
    ],
  },
  {
    slug: "what-purity-means",
    title: "What Purity Actually Means",
    excerpt: "HPLC purity, identity by mass spec, and why a percentage alone is not the whole story.",
    date: "2026-09-08",
    body: ["Placeholder article body — replace with the full piece."],
  },
  {
    slug: "storing-research-compounds",
    title: "Storing Research Compounds",
    excerpt: "Temperature, light and reconstitution: the handling basics for lyophilized compounds.",
    date: "2026-09-15",
    body: ["Placeholder article body — replace with the full piece."],
  },
];

export const AFFILIATE_STEPS = [
  { title: "Apply", body: "Tell us about your audience. Approval usually takes a few business days." },
  { title: "Share", body: "Get a personal code and link to share with your research community." },
  { title: "Earn", body: "Earn commission on qualifying orders placed with your code." },
];
