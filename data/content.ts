/**
 * Editorial content: FAQ, COA table, research articles, homepage copy.
 * PLACEHOLDER — lot numbers, lab names and dates are scaffold values.
 */
import type { Coa } from "../lib/types";

export const TICKER = [
  "COAs on every batch",
  "≥ 99% purity",
  "10x tested, every product",
  "2–3 day shipping",
  "Secure checkout",
  "Research use only",
];

export const QC_STATS = [
  { value: "≥99%", label: "HPLC purity target" },
  { value: "100%", label: "Lots with a published COA" },
  { value: "10x", label: "Tests on every product" },
  { value: "2–3 days", label: "Shipping" },
];

export const QC_PILLARS = [
  { icon: "purity", label: "Purity", blurb: "Every lot is assayed by HPLC before it is listed." },
  { icon: "identity", label: "Identity", blurb: "Mass spectrometry confirms the compound is what the label says." },
  { icon: "sterility", label: "Handling", blurb: "Lyophilized, sealed and stored cold until it ships." },
  { icon: "coa", label: "Transparency", blurb: "Certificates are public, by lot, with no login." },
];

export const WHY_US = [
  { icon: "flask", title: "US-sourced materials", body: "Compounds are synthesized from US-sourced raw materials." },
  { icon: "cert", title: "10x tested", body: "Every product goes through a 10-test panel at an outside lab: identity, purity, content, endotoxin, heavy metals, solvents and more." },
  { icon: "truck", title: "2–3 day shipping", body: "Orders are picked, packed and handed to the carrier with tracking, arriving in 2–3 business days." },
  { icon: "lock", title: "Secure checkout", body: "Card fields will be hosted by the payment provider, never stored by us." },
  { icon: "mail", title: "A real person replies", body: "Email support with an order number and a person replies within one business day." },
  { icon: "book", title: "COAs on every batch", body: "Certificates are published as the lab issued them, open to anyone." },
];

export const COAS: Coa[] = [
  { lot: "BP-10-080326", productSlug: "bpc-157", productName: "BPC-157", strength: "10 mg", purity: "99.95%", lab: "RUO Eagle", tested: "2026-08-14", report: "RUO-26-8A0D59B7", pdf: "/coas/BP-10-080326.png" },
  { lot: "BP-5-080326", productSlug: "bpc-157", productName: "BPC-157", strength: "5 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-05", report: "RUO-26-20B42A67", pdf: "/coas/BP-5-080326.png" },
  { lot: "WO-20-080326", productSlug: "bpc-157-tb-500-blend", productName: "BPC-157 + TB-500", strength: "10/10 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-05", report: "RUO-26-B1E70C41", pdf: "/coas/WO-20-080326.png" },
  { lot: "WO-10-080326", productSlug: "bpc-157-tb-500-blend", productName: "BPC-157 + TB-500", strength: "5/5 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-13", report: "RUO-26-98B10E65", pdf: "/coas/WO-10-080326.png" },
  { lot: "TB-10-080326", productSlug: "tb-500", productName: "TB-500", strength: "10 mg", purity: "99.96%", lab: "RUO Eagle", tested: "2026-08-04", report: "RUO-26-84F4D7FC", pdf: "/coas/TB-10-080326.png" },
  { lot: "TB-5-080326", productSlug: "tb-500", productName: "TB-500", strength: "5 mg", purity: "99.92%", lab: "RUO Eagle", tested: "2026-08-12", report: "RUO-26-A7016082", pdf: "/coas/TB-5-080326.png" },
  { lot: "GH-50-080326", productSlug: "ghk-cu", productName: "GHK-Cu", strength: "50 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-07", report: "RUO-26-1213B63D", pdf: "/coas/GH-50-080326.png" },
  { lot: "GH-100-080326", productSlug: "ghk-cu", productName: "GHK-Cu", strength: "100 mg", purity: "99.96%", lab: "RUO Eagle", tested: "2026-08-10", report: "RUO-26-B06B9A72", pdf: "/coas/GH-100-080326.png" },
  { lot: "GW-70-080326", productSlug: "glow-blend", productName: "GLOW Blend", strength: "50/10/10 mg", purity: "99.95%", lab: "RUO Eagle", tested: "2026-08-07", report: "RUO-26-0084965E", pdf: "/coas/GW-70-080326.png" },
  { lot: "KP-5-080326", productSlug: "kpv", productName: "KPV", strength: "5 mg", purity: "99.95%", lab: "RUO Eagle", tested: "2026-08-14", report: "RUO-26-33F3A4FE", pdf: "/coas/KP-5-080326.png" },
  { lot: "MO-40-080326", productSlug: "mots-c", productName: "MOTS-C", strength: "40 mg", purity: "99.97%", lab: "RUO Eagle", tested: "2026-08-04", report: "RUO-26-FC9846C7", pdf: "/coas/MO-40-080326.png" },
  { lot: "NA-500-080326", productSlug: "nad-plus", productName: "NAD+", strength: "500 mg", purity: "99.97%", lab: "RUO Eagle", tested: "2026-08-11", report: "RUO-26-BD6D7CDD", pdf: "/coas/NA-500-080326.png" },
  { lot: "NA-1000-080326", productSlug: "nad-plus", productName: "NAD+", strength: "1000 mg", purity: "99.93%", lab: "RUO Eagle", tested: "2026-08-14", report: "RUO-26-E3B2630E", pdf: "/coas/NA-1000-080326.png" },
  { lot: "SR-10-080326", productSlug: "sermorelin", productName: "Sermorelin", strength: "10 mg", purity: "99.97%", lab: "RUO Eagle", tested: "2026-08-07", report: "RUO-26-0B5318F3", pdf: "/coas/SR-10-080326.png" },
  { lot: "SL-10-080326", productSlug: "selank", productName: "Selank", strength: "10 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-04", report: "RUO-26-117A33A2", pdf: "/coas/SL-10-080326.png" },
  { lot: "SL-5-080326", productSlug: "selank", productName: "Selank", strength: "5 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-06", report: "RUO-26-71683AA4", pdf: "/coas/SL-5-080326.png" },
  { lot: "SX-10-080326", productSlug: "semax", productName: "Semax", strength: "10 mg", purity: "99.95%", lab: "RUO Eagle", tested: "2026-08-14", report: "RUO-26-F2A5166D", pdf: "/coas/SX-10-080326.png" },
  { lot: "SX-5-080326", productSlug: "semax", productName: "Semax", strength: "5 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-11", report: "RUO-26-B423D3FA", pdf: "/coas/SX-5-080326.png" },
  { lot: "HC-5000-080326", productSlug: "hcg", productName: "HCG", strength: "5,000 IU", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-12", report: "RUO-26-B95FD469", pdf: "/coas/HC-5000-080326.png" },
  { lot: "TH-10-080326", productName: "Thymalin", strength: "10 mg", purity: "99.93%", lab: "RUO Eagle", tested: "2026-08-11", report: "RUO-26-DCD0984F", pdf: "/coas/TH-10-080326.png" },
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

export const AFFILIATE_STEPS = [
  { title: "Apply", body: "Tell us about your audience. Approval usually takes a few business days." },
  { title: "Share", body: "Get a personal code and link to share with your research community." },
  { title: "Earn", body: "Earn commission on qualifying orders placed with your code." },
];
