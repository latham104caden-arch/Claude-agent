/**
 * CATALOG.
 *
 * The product line-up, sizes and prices mirror the compounds currently listed
 * on ventrasciences.com (WooCommerce snapshot in the Ventra repo, synced
 * 2026-09-28), minus anything the RUO guard blocks (data/ruo-banned.json) and
 * minus HGH. Single-size strengths come from Ventra's SKUs (e.g. VSC-KPV10 =
 * 10 mg). SKUs and COA lots here are Revised's own placeholders; descriptions
 * are ours. Prices are Ventra's current prices until Revised sets its own.
 */
import type { Category, Product } from "../lib/types";

export const CATEGORIES: Category[] = [
  { slug: "repair-immune", name: "Repair & Immune", blurb: "Tissue, skin and immune-signalling research peptides." },
  { slug: "metabolic-gh", name: "Metabolic & GH", blurb: "Growth-hormone axis and metabolic research compounds." },
  { slug: "cognitive-longevity", name: "Cognitive & Longevity", blurb: "Neuropeptide, sleep, aging and signalling research." },
  { slug: "nasal", name: "Nasal Research", blurb: "Research-grade nasal formats." },
  { slug: "supplies", name: "Lab Supplies", blurb: "Diluents and lab essentials." },
];

const STD_STORAGE = ["Store lyophilized at -20°C", "Protect from light", "Refrigerate after reconstitution"];
const SOLUTION_STORAGE = ["Refrigerate 2–8°C", "Protect from light"];

/** Formula / weight / CAS for compounds where we have them on file. */
const CHEM: Record<string, [formula: string, mw: string, cas: string]> = {
  "bpc-157": ["C62H98N16O22", "1419.5 g/mol", "137525-51-0"],
  "tb-500": ["C38H68N10O14", "889.0 g/mol", "885340-08-9"],
  "ghk-cu": ["C14H22CuN6O4", "401.9 g/mol", "89030-95-5"],
  "mots-c": ["C101H152N28O22S2", "2174.6 g/mol", "1627580-64-6"],
  "nad-plus": ["C21H27N7O14P2", "663.4 g/mol", "53-84-9"],
  epitalon: ["C14H22N4O9", "390.3 g/mol", "307297-39-8"],
  kpv: ["C16H30N6O4", "370.4 g/mol", "67727-97-3"],
};

type Form = "lyo" | "nasal" | "solution";
/** [option, price, compareAt?] — compareAt is the struck-through "was" price when on sale. */
type Size = [option: string, price: number, compareAt?: number];
type Row = {
  slug: string;
  name: string;
  category: Product["category"];
  subtitle: string;
  description: string;
  sizes: Size[];
  /** Higher = earlier in "Best Sellers" (from Ventra's current popularity order). */
  popularity: number;
  form?: Form;
  badge?: string;
  featured?: boolean;
  coaLot?: string;
};

const ROWS: Row[] = [
  // ── Repair & Immune ─────────────────────────────────────────
  { slug: "bpc-157", name: "BPC-157", category: "repair-immune", subtitle: "Recovery Research", description: "BPC-157 is a synthetic pentadecapeptide studied in laboratory models of tissue repair and angiogenesis.", sizes: [["10 mg", 65]], popularity: 88, badge: "Best Seller", featured: true, coaLot: "BP-10-080326" },
  { slug: "tb-500", name: "TB-500", category: "repair-immune", subtitle: "Recovery Research", description: "TB-500 is a synthetic fragment of thymosin beta-4 studied in cell-migration research.", sizes: [["10 mg", 60]], popularity: 50, featured: true, coaLot: "TB-10-080326" },
  { slug: "bpc-157-tb-500-blend", name: "BPC-157 + TB-500", category: "repair-immune", subtitle: "Recovery Blend", description: "A single research vial combining BPC-157 and TB-500.", sizes: [["10/10 mg", 120, 135]], popularity: 87, coaLot: "WO-20-080326" },
  { slug: "ghk-cu", name: "GHK-Cu", category: "repair-immune", subtitle: "Dermal Research", description: "GHK-Cu is a copper-binding tripeptide studied in extracellular-matrix research.", sizes: [["50 mg", 50], ["100 mg", 85]], popularity: 95, featured: true, coaLot: "GH-50-080326" },
  { slug: "glow-blend", name: "GLOW Blend", category: "repair-immune", subtitle: "Dermal Research Blend", description: "A research blend of GHK-Cu, BPC-157 and TB-500 in one vial.", sizes: [["50/10/10 mg", 100, 119], ["70/10/10 mg", 125, 155]], popularity: 82, coaLot: "GW-70-080326" },
  { slug: "klow-blend", name: "KLOW Blend", category: "repair-immune", subtitle: "Dermal Research Blend", description: "A research blend of GHK-Cu, BPC-157, TB-500 and KPV in one vial.", sizes: [["50/10/10/10 mg", 100, 139]], popularity: 98, coaLot: "KW-80-080326" },
  { slug: "kpv", name: "KPV", category: "repair-immune", subtitle: "Inflammation Research", description: "KPV is a C-terminal tripeptide of α-MSH studied in inflammatory-pathway research.", sizes: [["10 mg", 50, 60]], popularity: 84, coaLot: "KP-10-080326" },
  { slug: "ll-37", name: "LL-37", category: "repair-immune", subtitle: "Immune Research", description: "LL-37 is the human cathelicidin antimicrobial peptide, studied in innate-immunity research.", sizes: [["5 mg", 75]], popularity: 59, coaLot: "LL-5-080326" },
  { slug: "ara-290", name: "ARA-290", category: "repair-immune", subtitle: "Recovery Research", description: "ARA-290 is a synthetic peptide derived from erythropoietin, studied in tissue-protection research.", sizes: [["10 mg", 65], ["15 mg", 85, 90]], popularity: 67 },
  { slug: "thymosin-alpha-1", name: "Thymosin Alpha-1", category: "repair-immune", subtitle: "Immune Research", description: "Thymosin α1 is a 28-amino-acid thymic peptide studied in immune-signalling research.", sizes: [["5 mg", 75], ["10 mg", 100, 115]], popularity: 49 },
  { slug: "snap-8", name: "SNAP-8", category: "repair-immune", subtitle: "Dermal Research", description: "SNAP-8 (acetyl octapeptide-3) is a synthetic peptide studied in SNARE-complex research.", sizes: [["10 mg", 50]], popularity: 51 },
  { slug: "glutathione", name: "Glutathione", category: "repair-immune", subtitle: "Antioxidant Research", description: "Glutathione is a tripeptide antioxidant studied in cellular redox research.", sizes: [["500 mg", 60], ["1500 mg", 80, 100]], popularity: 80, form: "solution", coaLot: "GL-1500-080326" },

  // ── Metabolic & GH ─────────────────────────────────────────
 { slug: "rt-3", name: "RT-3", category: "metabolic-gh", subtitle: "Metabolic Research", description: "RT-3 is a long-acting amylin analog studied in appetite-signalling research.", sizes: [["10 mg", 69.99], ["20 mg", 119.99, 120], ["30 mg", 149.99]], popularity: 99 },
  { slug: "tz-2", name: "TZ-2", category: "metabolic-gh", subtitle: "Metabolic Research", description: "TZ-2 is a long-acting amylin analog studied in appetite-signalling research.", sizes: [["10 mg", 54.99], ["20 mg", 74.99, 120], ["30 mg", 124.99]], popularity: 95 },
  { slug: "sm-1", name: "SM-1", category: "metabolic-gh", subtitle: "Metabolic Research", description: "SM-1 is a long-acting amylin analog studied in appetite-signalling research.", sizes: [["10 mg", 84.99], ["20 mg", 134.99, 135]], popularity: 82 },
  { slug: "5-amino-1mq", name: "5-Amino-1MQ", category: "metabolic-gh", subtitle: "Metabolic Research", description: "5-Amino-1MQ is a small-molecule NNMT inhibitor studied in cellular metabolism research.", sizes: [["10 mg", 55, 75]], popularity: 77 },
  { slug: "aod-9604", name: "AOD-9604", category: "metabolic-gh", subtitle: "Metabolic Research", description: "AOD-9604 is a modified fragment of the growth-hormone C-terminus studied in lipid-metabolism research.", sizes: [["10 mg", 85, 100]], popularity: 68 },
  { slug: "cagrilintide", name: "Cagrilintide", category: "metabolic-gh", subtitle: "Metabolic Research", description: "Cagrilintide is a long-acting amylin analog studied in appetite-signalling research.", sizes: [["5 mg", 65], ["10 mg", 110, 115]], popularity: 85, coaLot: "CA-5-080326" }, 
  { slug: "slu-pp-332", name: "SLU-PP-332", category: "metabolic-gh", subtitle: "Metabolic Research", description: "SLU-PP-332 is a small-molecule ERR agonist studied in mitochondrial and metabolic research.", sizes: [["5 mg", 65], ["10 mg", 100]], popularity: 52 },  
  { slug: "mots-c", name: "MOTS-C", category: "metabolic-gh", subtitle: "Metabolic Research", description: "MOTS-C is a mitochondrial-derived peptide studied in cellular metabolism research.", sizes: [["10 mg", 55], ["20 mg", 90], ["40 mg", 150]], popularity: 94, featured: true, coaLot: "MO-40-080326" },
  { slug: "nad-plus", name: "NAD+", category: "metabolic-gh", subtitle: "Cellular Research", description: "NAD+ is a coenzyme central to redox reactions, studied in cellular energy research.", sizes: [["500 mg", 70, 95], ["1000 mg", 110, 140]], popularity: 86, coaLot: "NA-500-080326" },
  { slug: "ss-31", name: "SS-31", category: "metabolic-gh", subtitle: "Mitochondrial Research", description: "SS-31 (elamipretide) is a mitochondria-targeted tetrapeptide studied in mitochondrial-function research.", sizes: [["10 mg", 70], ["50 mg", 170, 195]], popularity: 69, coaLot: "SS-10-080326" },
  { slug: "lipo-c-b12", name: "Lipo-C with B12", category: "metabolic-gh", subtitle: "Metabolic Research", description: "A research solution of L-methionine, inositol, choline and cyanocobalamin, studied in methyl-donor metabolism research.", sizes: [["10 mL", 85]], popularity: 60, form: "solution" },
  { slug: "cjc-1295-dac", name: "CJC-1295 DAC", category: "metabolic-gh", subtitle: "GH Axis Research", description: "CJC-1295 with DAC is a long-acting GHRH analog studied in growth-hormone signalling research.", sizes: [["5 mg", 65]], popularity: 92 },
  { slug: "cjc-1295-no-dac", name: "CJC-1295 No DAC", category: "metabolic-gh", subtitle: "GH Axis Research", description: "CJC-1295 without DAC (Mod GRF 1-29) is a GHRH analog studied in growth-hormone signalling research.", sizes: [["10 mg", 65, 95]], popularity: 75, coaLot: "CD-10-080326" },
  { slug: "cjc-1295-ipamorelin-blend", name: "CJC-1295 + Ipamorelin", category: "metabolic-gh", subtitle: "GH Axis Blend", description: "A single research vial combining CJC-1295 without DAC and Ipamorelin.", sizes: [["5/5 mg", 75]], popularity: 96, coaLot: "CI-10-080326" },
  { slug: "ipamorelin", name: "Ipamorelin", category: "metabolic-gh", subtitle: "GH Axis Research", description: "Ipamorelin is a selective ghrelin-receptor agonist pentapeptide studied in growth-hormone secretion research.", sizes: [["5 mg", 40], ["10 mg", 65]], popularity: 91, coaLot: "IP-5-080326" },
  { slug: "sermorelin", name: "Sermorelin", category: "metabolic-gh", subtitle: "GH Axis Research", description: "Sermorelin is GHRH(1-29), studied in growth-hormone release research.", sizes: [["10 mg", 80, 90]], popularity: 70, coaLot: "SR-10-080326" },
  { slug: "tesamorelin", name: "Tesamorelin", category: "metabolic-gh", subtitle: "GH Axis Research", description: "Tesamorelin is a stabilised GHRH analog studied in growth-hormone and lipid-metabolism research.", sizes: [["10 mg", 75, 89]], popularity: 97, coaLot: "TS-10-080326" },
  { slug: "tesamorelin-ipamorelin-blend", name: "Tesamorelin + Ipamorelin", category: "metabolic-gh", subtitle: "GH Axis Blend", description: "A single research vial combining Tesamorelin and Ipamorelin.", sizes: [["10/5 mg", 130]], popularity: 81 },
  { slug: "igf-1-lr3", name: "IGF-1 LR3", category: "metabolic-gh", subtitle: "Growth Factor Research", description: "IGF-1 LR3 is a long-acting analog of insulin-like growth factor 1 studied in cell-proliferation research.", sizes: [["1 mg", 80, 129]], popularity: 89, coaLot: "IG-1-080326" },
  { slug: "peg-mgf", name: "PEG-MGF", category: "metabolic-gh", subtitle: "Growth Factor Research", description: "PEG-MGF is a PEGylated mechano growth factor peptide studied in myogenic-signalling research.", sizes: [["5 mg", 120]], popularity: 56 },

  // ── Cognitive & Longevity ───────────────────────────────────
  { slug: "selank", name: "Selank", category: "cognitive-longevity", subtitle: "Cognitive Research", description: "Selank is a synthetic heptapeptide analog of tuftsin, studied in neuropeptide research.", sizes: [["10 mg", 66]], popularity: 73, coaLot: "SL-10-080326" },
  { slug: "semax", name: "Semax", category: "cognitive-longevity", subtitle: "Cognitive Research", description: "Semax is a synthetic heptapeptide analog of ACTH(4-10), studied in neuropeptide research.", sizes: [["10 mg", 65]], popularity: 78, coaLot: "SX-10-080326" },
  { slug: "selank-semax-blend", name: "Selank + Semax", category: "cognitive-longevity", subtitle: "Cognitive Research Blend", description: "A single research vial combining Selank and Semax.", sizes: [["10 mg", 80]], popularity: 53 },
  { slug: "dihexa", name: "Dihexa", category: "cognitive-longevity", subtitle: "Cognitive Research", description: "Dihexa is a small angiotensin-IV-derived peptide studied in synaptogenesis research.", sizes: [["10 mg", 70], ["20 mg", 80]], popularity: 65 },
  { slug: "pinealon", name: "Pinealon", category: "cognitive-longevity", subtitle: "Cognitive Research", description: "Pinealon is a synthetic tripeptide studied in neuronal gene-expression research.", sizes: [["10 mg", 60], ["20 mg", 70]], popularity: 55 },
  { slug: "dsip", name: "DSIP", category: "cognitive-longevity", subtitle: "Sleep Research", description: "Delta sleep-inducing peptide is a nonapeptide studied in sleep-regulation research.", sizes: [["5 mg", 50]], popularity: 64 },
  { slug: "epitalon", name: "Epitalon", category: "cognitive-longevity", subtitle: "Longevity Research", description: "Epitalon is a synthetic tetrapeptide studied in telomerase research.", sizes: [["10 mg", 45], ["50 mg", 110]], popularity: 63, coaLot: "EP-50-080326" },
  { slug: "cartalax", name: "Cartalax", category: "cognitive-longevity", subtitle: "Longevity Research", description: "Cartalax is a short synthetic bioregulator peptide studied in cartilage-tissue research.", sizes: [["10 mg", 85], ["20 mg", 100]], popularity: 66 },
  { slug: "pt-141", name: "PT-141", category: "cognitive-longevity", subtitle: "Melanocortin Research", description: "PT-141 (bremelanotide) is a cyclic melanocortin-receptor agonist studied in melanocortin signalling research.", sizes: [["10 mg", 55]], popularity: 54 },
  { slug: "melanotan-i", name: "Melanotan I", category: "cognitive-longevity", subtitle: "Melanocortin Research", description: "Melanotan I (afamelanotide) is a linear α-MSH analog studied in melanogenesis research.", sizes: [["10 mg", 45, 60]], popularity: 83, coaLot: "M1-10-080326" },
  { slug: "melanotan-ii", name: "Melanotan II", category: "cognitive-longevity", subtitle: "Melanocortin Research", description: "Melanotan II is a cyclic α-MSH analog studied in melanocortin-receptor research.", sizes: [["10 mg", 40]], popularity: 93, coaLot: "M2-10-080326" },
  { slug: "kisspeptin-10", name: "Kisspeptin-10", category: "cognitive-longevity", subtitle: "Signalling Research", description: "Kisspeptin-10 is the active C-terminal decapeptide of kisspeptin, studied in reproductive-axis signalling research.", sizes: [["10 mg", 55]], popularity: 61 },
  { slug: "oxytocin", name: "Oxytocin", category: "cognitive-longevity", subtitle: "Signalling Research", description: "Oxytocin is a nonapeptide neurohormone studied in neuroendocrine research.", sizes: [["10 mg", 55]], popularity: 57 },
  { slug: "hcg", name: "HCG", category: "cognitive-longevity", subtitle: "Signalling Research", description: "Human chorionic gonadotropin is a glycoprotein hormone studied in LHCGR receptor-signalling research.", sizes: [["5000 IU", 75]], popularity: 47, coaLot: "HC-5000-080326" },

  // ── Nasal ───────────────────────────────────────────────────
  { slug: "semax-nasal", name: "Semax Nasal Spray", category: "nasal", subtitle: "Cognitive Research", description: "Semax, a synthetic ACTH(4-10) analog, supplied in a research nasal format.", sizes: [["10 mL", 100]], popularity: 71, form: "nasal", coaLot: "SX-10-080326" },
  { slug: "selank-nasal", name: "Selank Nasal Spray", category: "nasal", subtitle: "Cognitive Research", description: "Selank, a synthetic tuftsin analog, supplied in a research nasal format.", sizes: [["10 mL", 100]], popularity: 72, form: "nasal", coaLot: "SL-10-080326" },
  { slug: "selank-semax-nasal", name: "Selank + Semax Nasal Spray", category: "nasal", subtitle: "Cognitive Research", description: "Selank and Semax combined in a research nasal format.", sizes: [["10 mL", 120]], popularity: 79, form: "nasal" },
  { slug: "ghk-cu-nasal", name: "GHK-Cu Nasal Spray", category: "nasal", subtitle: "Dermal Research", description: "GHK-Cu, a copper-binding tripeptide, supplied in a research nasal format.", sizes: [["10 mL", 90]], popularity: 62, form: "nasal", coaLot: "GH-50-080326" },
  { slug: "nad-plus-nasal", name: "NAD+ Nasal Spray", category: "nasal", subtitle: "Cellular Research", description: "NAD+ supplied in a research nasal format.", sizes: [["10 mL", 120]], popularity: 58, form: "nasal", coaLot: "NA-500-080326" },

  // ── Lab Supplies ────────────────────────────────────────────
  { slug: "reconstitution-solution", name: "Reconstitution Solution", category: "supplies", subtitle: "Lab Supplies", description: "Bacteriostatic water (sterile water with 0.9% benzyl alcohol) for reconstituting lyophilized research compounds.", sizes: [["3 mL", 10], ["10 mL", 15], ["30 mL", 30]], popularity: 99 },
];

function specsFor(r: Row) {
  const strength = r.sizes.map(([o]) => o).join(" / ");
  if (r.category === "supplies") return [{ label: "Type", value: "USP-grade sterile water + 0.9% benzyl alcohol" }, { label: "Volume", value: strength }];
  if (r.form === "nasal") return [{ label: "Form", value: "Aqueous solution, metered spray" }, { label: "Volume", value: strength }, { label: "Purity", value: "≥ 99% (HPLC)" }];
  if (r.form === "solution") return [{ label: "Form", value: "Sterile solution" }, { label: "Size", value: strength }];
  const chem = CHEM[r.slug];
  return [
    { label: "Form", value: "Lyophilized powder" },
    { label: "Strength", value: strength },
    ...(chem ? [
      { label: "Molecular formula", value: chem[0], mono: true },
      { label: "Molecular weight", value: chem[1], mono: true },
      { label: "CAS", value: chem[2], mono: true },
    ] : []),
    { label: "Purity", value: "≥ 99% (HPLC)" },
  ];
}

/** Product photo per category (public/vial/vial-<tone>.webp; label colors match the printed labels). */
const TONE: Partial<Record<Product["category"], string>> = {
  "repair-immune": "repair",
  "metabolic-gh": "metabolic",
  "cognitive-longevity": "cognitive",
  nasal: "nasal",
  supplies: "supply",
};

const sku = (slug: string, option: string) => `RR-${slug.toUpperCase()}-${option.replace(/[\s/]+/g, "").toUpperCase()}`;

/**
 * Whole-dollar list prices end in .99, .89 or .45 (1¢, 11¢ or 55¢ under).
 * Which one is fixed per SKU (a hash, not Math.random), so a price never
 * changes between deploys or between the cart and the server. Prices that
 * already have cents are left alone.
 */
const CENTS_OFF = [1, 11, 55];
function listPrice(skuId: string, dollars: number): number {
  if (!Number.isInteger(dollars)) return dollars;
  let h = 2166136261;
  for (const ch of skuId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (dollars * 100 - CENTS_OFF[(h >>> 0) % CENTS_OFF.length]) / 100;
}

export const PRODUCTS: Product[] = ROWS.map((r) => ({
  slug: r.slug,
  name: r.name,
  category: r.category,
  subtitle: r.subtitle,
  description: r.description,
  variants: r.sizes.map(([option, price, compareAt]) => ({ sku: sku(r.slug, option), option, price: listPrice(sku(r.slug, option), price), ...(compareAt ? { compareAt } : {}), inStock: true })),
  popularity: r.popularity,
  ...(r.featured ? { featured: true } : {}),
  ...(r.badge ? { badge: r.badge } : {}),
  accent: TONE[r.category],
  specs: specsFor(r),
  storage: r.category === "supplies" ? ["Store at room temperature", "Protect from light"] : r.form ? SOLUTION_STORAGE : STD_STORAGE,
  sources: [],
  ...(r.coaLot ? { coaLot: r.coaLot } : {}),
}));
