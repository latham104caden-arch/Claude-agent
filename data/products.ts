/**
 * PLACEHOLDER CATALOG.
 *
 * Every price, SKU, lot number and spec below is scaffold data so the pages
 * have something real-shaped to render. Replace with the actual catalog (or
 * swap lib/catalog.ts to read from a database) before launch.
 */
import type { Category, Product } from "../lib/types";

export const CATEGORIES: Category[] = [
  { slug: "repair-immune", name: "Repair & Immune", blurb: "Tissue, skin and immune-signalling research peptides." },
  { slug: "metabolic-gh", name: "Metabolic & GH", blurb: "Growth-hormone axis and metabolic research peptides." },
  { slug: "cognitive-longevity", name: "Cognitive & Longevity", blurb: "Neuropeptide, sleep, aging and signalling research." },
  { slug: "nasal", name: "Nasal Research", blurb: "Research-grade nasal formats." },
  { slug: "bundles", name: "Bundles", blurb: "Pre-built research stacks." },
  { slug: "supplies", name: "Lab Supplies", blurb: "Diluents and lab essentials." },
];

const STD_STORAGE = ["Store lyophilized at -20°C", "Protect from light", "Refrigerate after reconstitution"];

const lyo = (formula: string, mw: string, cas: string) => [
  { label: "Form", value: "Lyophilized powder" },
  { label: "Molecular formula", value: formula, mono: true },
  { label: "Molecular weight", value: mw, mono: true },
  { label: "CAS", value: cas, mono: true },
  { label: "Purity", value: "≥ 99% (HPLC)" },
];

const BASE: Product[] = [
  {
    slug: "bpc-157",
    name: "BPC-157",
    category: "repair-immune",
    subtitle: "Recovery Research",
    description:
      "BPC-157 is a synthetic pentadecapeptide studied in laboratory models of tissue repair and angiogenesis.",
    variants: [
      { sku: "RR-BPC5", option: "5 mg", price: 49, inStock: true },
      { sku: "RR-BPC10", option: "10 mg", price: 79, inStock: true },
    ],
    popularity: 100,
    featured: true,
    badge: "Best Seller",
    specs: lyo("C62H98N16O22", "1419.5 g/mol", "137525-51-0"),
    storage: STD_STORAGE,
    sources: [
      { journal: "Journal placeholder", title: "Reference title placeholder — add real citation", year: 2020 },
    ],
    coaLot: "RR-BPC-0001",
  },
  {
    slug: "tb-500",
    name: "TB-500",
    category: "repair-immune",
    subtitle: "Recovery Research",
    description: "TB-500 is a synthetic fragment of thymosin beta-4 studied in cell-migration research.",
    variants: [
      { sku: "RR-TB5", option: "5 mg", price: 59, inStock: true },
      { sku: "RR-TB10", option: "10 mg", price: 99, inStock: true },
    ],
    popularity: 90,
    featured: true,
    specs: lyo("C38H68N10O14", "889.0 g/mol", "885340-08-9"),
    storage: STD_STORAGE,
    sources: [],
    coaLot: "RR-TB-0001",
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    category: "repair-immune",
    subtitle: "Dermal Research",
    description: "GHK-Cu is a copper-binding tripeptide studied in extracellular-matrix research.",
    variants: [
      { sku: "RR-GHK50", option: "50 mg", price: 45, inStock: true },
      { sku: "RR-GHK100", option: "100 mg", price: 75, inStock: true },
    ],
    popularity: 80,
    featured: true,
    specs: lyo("C14H22CuN6O4", "401.9 g/mol", "89030-95-5"),
    storage: STD_STORAGE,
    sources: [],
    coaLot: "RR-GHK-0001",
  },
  {
    slug: "mots-c",
    name: "MOTS-C",
    category: "metabolic-gh",
    subtitle: "Metabolic Research",
    description: "MOTS-C is a mitochondrial-derived peptide studied in cellular metabolism research.",
    variants: [
      { sku: "RR-MOT10", option: "10 mg", price: 69, inStock: true },
    ],
    popularity: 70,
    featured: true,
    specs: lyo("C101H152N28O22S2", "2174.6 g/mol", "1627580-64-6"),
    storage: STD_STORAGE,
    sources: [],
    coaLot: "RR-MOT-0001",
  },
  {
    slug: "nad-plus",
    name: "NAD+",
    category: "metabolic-gh",
    subtitle: "Cellular Research",
    description: "NAD+ is a coenzyme central to redox reactions, studied in cellular energy research.",
    variants: [
      { sku: "RR-NAD500", option: "500 mg", price: 89, inStock: true },
    ],
    popularity: 65,
    specs: lyo("C21H27N7O14P2", "663.4 g/mol", "53-84-9"),
    storage: STD_STORAGE,
    sources: [],
    coaLot: "RR-NAD-0001",
  },
  {
    slug: "epitalon",
    name: "Epitalon",
    category: "cognitive-longevity",
    subtitle: "Longevity Research",
    description: "Epitalon is a synthetic tetrapeptide studied in telomerase research.",
    variants: [
      { sku: "RR-EPI10", option: "10 mg", price: 55, inStock: true },
      { sku: "RR-EPI50", option: "50 mg", price: 139, compareAt: 165, inStock: true },
    ],
    popularity: 55,
    specs: lyo("C14H22N4O9", "390.3 g/mol", "307297-39-8"),
    storage: STD_STORAGE,
    sources: [],
    coaLot: "RR-EPI-0001",
  },
  {
    slug: "kpv",
    name: "KPV",
    category: "repair-immune",
    subtitle: "Inflammation Research",
    description: "KPV is a C-terminal tripeptide of α-MSH studied in inflammatory-pathway research.",
    variants: [{ sku: "RR-KPV10", option: "10 mg", price: 49, inStock: false }],
    popularity: 40,
    specs: lyo("C16H30N6O4", "370.4 g/mol", "67727-97-3"),
    storage: STD_STORAGE,
    sources: [],
  },
  {
    slug: "semax-nasal",
    name: "Semax",
    category: "nasal",
    subtitle: "Cognitive Research",
    description: "Semax is a synthetic heptapeptide analog of ACTH(4-10), supplied here in a research nasal format.",
    variants: [{ sku: "RR-SMX-N", option: "10 mL", price: 65, inStock: true }],
    popularity: 60,
    featured: true,
    specs: [
      { label: "Form", value: "Aqueous solution, metered spray" },
      { label: "Volume", value: "10 mL" },
      { label: "Purity", value: "≥ 99% (HPLC)" },
    ],
    storage: ["Refrigerate 2–8°C", "Protect from light"],
    sources: [],
    coaLot: "RR-SMX-0001",
  },
  {
    slug: "selank-nasal",
    name: "Selank",
    category: "nasal",
    subtitle: "Cognitive Research",
    description: "Selank is a synthetic heptapeptide analog of tuftsin, supplied in a research nasal format.",
    variants: [{ sku: "RR-SLK-N", option: "10 mL", price: 65, inStock: true }],
    popularity: 50,
    specs: [
      { label: "Form", value: "Aqueous solution, metered spray" },
      { label: "Volume", value: "10 mL" },
      { label: "Purity", value: "≥ 99% (HPLC)" },
    ],
    storage: ["Refrigerate 2–8°C", "Protect from light"],
    sources: [],
  },
  {
    slug: "recovery-stack",
    name: "Recovery Stack",
    category: "bundles",
    subtitle: "BPC-157 + TB-500",
    description: "A pre-built research stack pairing BPC-157 (10 mg) and TB-500 (10 mg).",
    variants: [{ sku: "RR-STK-REC", option: "Stack", price: 159, compareAt: 178, inStock: true }],
    popularity: 85,
    featured: true,
    badge: "Save 10%",
    includes: ["bpc-157", "tb-500"],
    specs: [{ label: "Contents", value: "BPC-157 10 mg · TB-500 10 mg" }],
    storage: STD_STORAGE,
    sources: [],
  },
  {
    slug: "bacteriostatic-water",
    name: "Bacteriostatic Water",
    category: "supplies",
    subtitle: "Lab Supplies",
    description: "Sterile water with 0.9% benzyl alcohol for reconstituting lyophilized research compounds.",
    variants: [
      { sku: "RR-BW3", option: "3 mL", price: 10, inStock: true },
      { sku: "RR-BW10", option: "10 mL", price: 15, inStock: true },
      { sku: "RR-BW30", option: "30 mL", price: 25, inStock: true },
    ],
    popularity: 30,
    specs: [{ label: "Type", value: "USP-grade sterile water + 0.9% benzyl alcohol" }],
    storage: ["Store at room temperature", "Protect from light"],
    sources: [],
  },
];

/** Basic spec block for compounds without a verified formula/CAS on file yet. */
const vialSpecs = (strength: string) => [
  { label: "Form", value: "Lyophilized powder" },
  { label: "Strength", value: strength },
  { label: "Purity", value: "≥ 99% (HPLC)" },
];

type Row = [slug: string, name: string, category: Product["category"], subtitle: string, description: string, sizes: [option: string, price: number][], popularity: number];

/** Single-vial research compounds added with the label set (design/labels). Prices are placeholders. */
const ROWS: Row[] = [
  // Repair & Immune
  ["thymosin-beta-4", "Thymosin Beta-4", "repair-immune", "Recovery Research", "Thymosin β4 is a 43-amino-acid actin-sequestering peptide studied in cell-migration and tissue-repair research.", [["5 mg", 69]], 38],
  ["ll-37", "LL-37", "repair-immune", "Immune Research", "LL-37 is the human cathelicidin antimicrobial peptide, studied in innate-immunity research.", [["5 mg", 65]], 30],
  ["thymosin-alpha-1", "Thymosin Alpha-1", "repair-immune", "Immune Research", "Thymosin α1 is a 28-amino-acid thymic peptide studied in immune-signalling research.", [["10 mg", 85]], 45],
  ["thymalin", "Thymalin", "repair-immune", "Immune Research", "Thymalin is a thymus-derived peptide complex studied in immune-regulation research.", [["10 mg", 59]], 20],
  ["vip", "VIP", "repair-immune", "Immune Research", "Vasoactive intestinal peptide is a 28-amino-acid neuropeptide studied in immune and vascular signalling research.", [["5 mg", 69]], 22],
  ["ara-290", "ARA-290", "repair-immune", "Recovery Research", "ARA-290 is a synthetic peptide derived from erythropoietin, studied in tissue-protection research.", [["10 mg", 79]], 18],
  ["bpc-157-tb-500-blend", "BPC-157 + TB-500", "repair-immune", "Recovery Blend", "A single research vial combining BPC-157 (10 mg) and TB-500 (10 mg).", [["20 mg", 119]], 75],
  ["glow-blend", "GLOW Blend", "repair-immune", "Dermal Research Blend", "A research blend of GHK-Cu (50 mg), BPC-157 (10 mg) and TB-500 (10 mg) in one vial.", [["70 mg", 139]], 62],
  ["klow-blend", "KLOW Blend", "repair-immune", "Dermal Research Blend", "A research blend of GHK-Cu (50 mg), BPC-157 (10 mg), TB-500 (10 mg) and KPV (10 mg) in one vial.", [["80 mg", 159]], 58],
  // Metabolic & GH
  ["cjc-1295-dac", "CJC-1295 DAC", "metabolic-gh", "GH Axis Research", "CJC-1295 with DAC is a long-acting GHRH analog studied in growth-hormone signalling research.", [["5 mg", 65]], 52],
  ["cjc-1295-no-dac", "CJC-1295 No DAC", "metabolic-gh", "GH Axis Research", "CJC-1295 without DAC (Mod GRF 1-29) is a GHRH analog studied in growth-hormone signalling research.", [["5 mg", 49]], 48],
  ["sermorelin", "Sermorelin", "metabolic-gh", "GH Axis Research", "Sermorelin is GHRH(1-29), studied in growth-hormone release research.", [["5 mg", 45]], 36],
  ["tesamorelin", "Tesamorelin", "metabolic-gh", "GH Axis Research", "Tesamorelin is a stabilised GHRH analog studied in growth-hormone and lipid-metabolism research.", [["10 mg", 99]], 54],
  ["ipamorelin", "Ipamorelin", "metabolic-gh", "GH Axis Research", "Ipamorelin is a selective ghrelin-receptor agonist pentapeptide studied in growth-hormone secretion research.", [["5 mg", 35], ["10 mg", 55]], 60],
  ["ghrp-2", "GHRP-2", "metabolic-gh", "GH Axis Research", "GHRP-2 is a synthetic growth-hormone-releasing hexapeptide studied in ghrelin-receptor research.", [["10 mg", 45]], 24],
  ["ghrp-6", "GHRP-6", "metabolic-gh", "GH Axis Research", "GHRP-6 is a synthetic growth-hormone-releasing hexapeptide studied in ghrelin-receptor research.", [["10 mg", 45]], 24],
  ["hexarelin", "Hexarelin", "metabolic-gh", "GH Axis Research", "Hexarelin is a synthetic hexapeptide ghrelin-receptor agonist studied in growth-hormone secretion research.", [["5 mg", 49]], 16],
  ["igf-1-lr3", "IGF-1 LR3", "metabolic-gh", "Growth Factor Research", "IGF-1 LR3 is a long-acting analog of insulin-like growth factor 1 studied in cell-proliferation research.", [["1 mg", 79]], 34],
  ["aod-9604", "AOD-9604", "metabolic-gh", "Metabolic Research", "AOD-9604 is a modified fragment of the growth-hormone C-terminus studied in lipid-metabolism research.", [["5 mg", 59]], 32],
  ["hgh-frag-176-191", "HGH Frag 176-191", "metabolic-gh", "Metabolic Research", "HGH Fragment 176-191 is the C-terminal region of growth hormone, studied in lipolysis research.", [["5 mg", 55]], 28],
  ["ss-31", "SS-31", "metabolic-gh", "Mitochondrial Research", "SS-31 (elamipretide) is a mitochondria-targeted tetrapeptide studied in mitochondrial-function research.", [["10 mg", 89]], 26],
  ["humanin", "Humanin", "metabolic-gh", "Mitochondrial Research", "Humanin is a mitochondrial-derived peptide studied in cell-survival research.", [["5 mg", 69]], 14],
  ["cjc-1295-ipamorelin-blend", "CJC-1295 + Ipamorelin", "metabolic-gh", "GH Axis Blend", "A single research vial combining CJC-1295 without DAC (5 mg) and Ipamorelin (5 mg).", [["10 mg", 89]], 68],
  // Cognitive & Longevity
  ["semax", "Semax", "cognitive-longevity", "Cognitive Research", "Semax is a synthetic heptapeptide analog of ACTH(4-10), studied in neuropeptide research.", [["10 mg", 49]], 42],
  ["selank", "Selank", "cognitive-longevity", "Cognitive Research", "Selank is a synthetic heptapeptide analog of tuftsin, studied in neuropeptide research.", [["10 mg", 49]], 40],
  ["dihexa", "Dihexa", "cognitive-longevity", "Cognitive Research", "Dihexa is a small angiotensin-IV-derived peptide studied in synaptogenesis research.", [["10 mg", 79]], 22],
  ["pinealon", "Pinealon", "cognitive-longevity", "Cognitive Research", "Pinealon is a synthetic tripeptide studied in neuronal gene-expression research.", [["10 mg", 49]], 15],
  ["dsip", "DSIP", "cognitive-longevity", "Sleep Research", "Delta sleep-inducing peptide is a nonapeptide studied in sleep-regulation research.", [["5 mg", 45]], 25],
  ["foxo4-dri", "FOXO4-DRI", "cognitive-longevity", "Longevity Research", "FOXO4-DRI is a retro-inverso peptide studied in cellular-senescence research.", [["10 mg", 149]], 19],
  ["pt-141", "PT-141", "cognitive-longevity", "Melanocortin Research", "PT-141 (bremelanotide) is a cyclic melanocortin-receptor agonist studied in melanocortin signalling research.", [["10 mg", 49]], 46],
  ["melanotan-i", "Melanotan I", "cognitive-longevity", "Melanocortin Research", "Melanotan I (afamelanotide) is a linear α-MSH analog studied in melanogenesis research.", [["10 mg", 45]], 17],
  ["melanotan-ii", "Melanotan II", "cognitive-longevity", "Melanocortin Research", "Melanotan II is a cyclic α-MSH analog studied in melanocortin-receptor research.", [["10 mg", 45]], 44],
  ["kisspeptin-10", "Kisspeptin-10", "cognitive-longevity", "Signalling Research", "Kisspeptin-10 is the active C-terminal decapeptide of kisspeptin, studied in reproductive-axis signalling research.", [["10 mg", 59]], 21],
  ["oxytocin", "Oxytocin", "cognitive-longevity", "Signalling Research", "Oxytocin is a nonapeptide neurohormone studied in neuroendocrine research.", [["2 mg", 39]], 23],
  ["gonadorelin", "Gonadorelin", "cognitive-longevity", "Signalling Research", "Gonadorelin is synthetic GnRH, studied in pituitary signalling research.", [["2 mg", 35]], 18],
];

const ADDED: Product[] = ROWS.map(([slug, name, category, subtitle, description, sizes, popularity]) => ({
  slug, name, category, subtitle, description, popularity,
  variants: sizes.map(([option, price]) => ({ sku: `RR-${slug.toUpperCase()}-${option.replace(/\s+/g, "").toUpperCase()}`, option, price, inStock: true })),
  specs: vialSpecs(sizes.map(([o]) => o).join(" / ")),
  storage: STD_STORAGE,
  sources: [],
}));

/** Vial label color per category (public/vial/vial-<tone>.webp, matches the printed labels). */
const TONE: Partial<Record<Product["category"], string>> = {
  "repair-immune": "repair",
  "metabolic-gh": "metabolic",
  "cognitive-longevity": "cognitive",
  nasal: "cognitive",
};

export const PRODUCTS: Product[] = [...BASE, ...ADDED].map((p) => ({ ...p, accent: p.accent ?? TONE[p.category] }));
