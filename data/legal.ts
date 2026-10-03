/**
 * DRAFT LEGAL COPY — placeholder structure only.
 * Every policy here must be replaced with counsel-reviewed text before launch.
 */
export type LegalDoc = {
  slug: string;
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
};

const DRAFT = "Draft placeholder — replace with counsel-reviewed language before launch.";

export const LEGAL: Record<string, LegalDoc> = {
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    updated: "2026-09-28",
    sections: [
      { heading: "Information we collect", body: [DRAFT] },
      { heading: "How we use information", body: [DRAFT] },
      { heading: "Cookies and analytics", body: [DRAFT] },
      { heading: "Sharing with service providers", body: [DRAFT] },
      { heading: "Your choices", body: [DRAFT] },
      { heading: "Contact", body: ["Questions about this policy can be sent to our support email."] },
    ],
  },
  "shipping-policy": {
    slug: "shipping-policy",
    title: "Shipping Policy",
    updated: "2026-09-28",
    sections: [
      { heading: "Delivery time", body: ["Shipping takes 2–3 business days. Tracking is sent when the label is created.", DRAFT] },
      { heading: "Shipping methods and rates", body: [DRAFT] },
      { heading: "Lost or damaged packages", body: [DRAFT] },
    ],
  },
  "refund-policy": {
    slug: "refund-policy",
    title: "Refund Policy",
    updated: "2026-09-28",
    sections: [
      { heading: "Eligibility", body: [DRAFT] },
      { heading: "How to request a refund", body: [DRAFT] },
      { heading: "Damaged or incorrect items", body: [DRAFT] },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    updated: "2026-09-28",
    sections: [
      { heading: "Research use only", body: ["All products are sold for laboratory research use only.", DRAFT] },
      { heading: "Eligibility", body: ["You must be at least 21 years old and a qualified researcher to purchase.", DRAFT] },
      { heading: "Orders and pricing", body: [DRAFT] },
      { heading: "Limitation of liability", body: [DRAFT] },
      { heading: "Governing law", body: [DRAFT] },
    ],
  },
  disclaimer: {
    slug: "disclaimer",
    title: "Disclaimer",
    updated: "2026-09-28",
    sections: [
      { heading: "Research use only", body: ["__RUO__"] },
      { heading: "No medical claims", body: ["Nothing on this site is medical advice. Statements have not been evaluated by the FDA.", DRAFT] },
    ],
  },
};
