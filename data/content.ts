/**
 * Editorial content: FAQ, research articles, homepage copy. COA rows live in ./coas.
 */
import { COAS, COA_COUNT, TESTED_COUNT } from "./coas";

export { COAS, COA_COUNT, TESTED_COUNT };

export const TICKER = [
  `${COA_COUNT} COAs published`,
  "≥ 99% purity",
  `${TESTED_COUNT} compounds 10x tested`,
  "2–3 day shipping",
  "Secure checkout",
  "Research use only",
];

export const QC_STATS = [
  { value: "≥99%", label: "HPLC purity target" },
  { value: String(COA_COUNT), label: "COAs published" },
  { value: String(TESTED_COUNT), label: "Compounds 10x tested" },
  { value: "2–3 days", label: "Shipping" },
];

export const QC_PILLARS = [
  { icon: "purity", label: "Purity", blurb: "Each tested lot is assayed by HPLC, with the purity on its certificate." },
  { icon: "identity", label: "Identity", blurb: "Mass spectrometry confirms the compound is what the label says." },
  { icon: "sterility", label: "Handling", blurb: "Lyophilized, sealed and stored cold until it ships." },
  { icon: "coa", label: "Transparency", blurb: "Certificates are public, by lot, with no login." },
];

export const WHY_US = [
  { icon: "flask", title: "Synthesized in the USA", body: "Compounds are synthesized in the United States." },
  { icon: "cert", title: `${TESTED_COUNT} compounds 10x tested`, body: "Tested lots go through a 10-test panel at an outside lab: identity, purity, content, endotoxin, heavy metals, solvents and more." },
  { icon: "truck", title: "2–3 day shipping", body: "Orders are picked, packed and handed to the carrier with tracking, arriving in 2–3 business days." },
  { icon: "lock", title: "Secure checkout", body: "Card fields will be hosted by the payment provider, never stored by us." },
  { icon: "mail", title: "A real person replies", body: "Email support with an order number and a person replies within one business day." },
  { icon: "book", title: `${COA_COUNT} COAs published`, body: "Certificates are published as the lab issued them, open to anyone, with more added as lots clear testing." },
];

export type FaqGroup = { id: string; title: string; items: { q: string; a: string }[] };

export const FAQ: FaqGroup[] = [
  {
    id: "general",
    title: "Product and General Questions",
    items: [
      { q: "Who can purchase from Revised Research?", a: "Qualified researchers 21 years of age or older, for laboratory research use only." },
      { q: "Are your products for human use?", a: "No. Every product is sold strictly for in-vitro laboratory research. Not for human or veterinary use." },
      { q: "How do I know what's in the vial?", a: "Tested lots have an independent certificate of analysis on our COA page, matched by lot number. Product pages show a COA badge when one is available." },
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
      { q: "When will my order arrive?", a: "Shipping takes 2–3 business days. Tracking is sent when the label is created." },
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

