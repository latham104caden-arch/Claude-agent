/**
 * Published certificates of analysis, one row per tested lot, as issued by the lab.
 * Counts shown across the site are derived from this list, so they stay accurate.
 */
import type { Coa } from "../lib/types";

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
  { lot: "LL-5-080326", productSlug: "ll-37", productName: "LL-37", strength: "5 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-05", report: "RUO-26-BA001EDC", pdf: "/coas/LL-5-080326.png" },
  { lot: "KW-80-080326", productSlug: "klow-blend", productName: "KLOW Blend", strength: "50/10/10/10 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-10", report: "RUO-26-AC1C19FB", pdf: "/coas/KW-80-080326.png" },
  { lot: "KP-10-080326", productSlug: "kpv", productName: "KPV", strength: "10 mg", purity: "99.96%", lab: "RUO Eagle", tested: "2026-08-10", report: "RUO-26-02728052", pdf: "/coas/KP-10-080326.png" },
  { lot: "KP-5-080326", productSlug: "kpv", productName: "KPV", strength: "5 mg", purity: "99.95%", lab: "RUO Eagle", tested: "2026-08-14", report: "RUO-26-33F3A4FE", pdf: "/coas/KP-5-080326.png" },
  { lot: "IG-1-080326", productSlug: "igf-1-lr3", productName: "IGF-1 LR3", strength: "1 mg", purity: "99.92%", lab: "RUO Eagle", tested: "2026-08-13", report: "RUO-26-525ABE74", pdf: "/coas/IG-1-080326.png" },
  { lot: "MO-10-080326", productSlug: "mots-c", productName: "MOTS-C", strength: "10 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-12", report: "RUO-26-25B95DD7", pdf: "/coas/MO-10-080326.png" },
  { lot: "MO-40-080326", productSlug: "mots-c", productName: "MOTS-C", strength: "40 mg", purity: "99.97%", lab: "RUO Eagle", tested: "2026-08-04", report: "RUO-26-FC9846C7", pdf: "/coas/MO-40-080326.png" },
  { lot: "AO-5-080326", productSlug: "aod-9604", productName: "AOD-9604", strength: "5 mg", purity: "99.91%", lab: "RUO Eagle", tested: "2026-08-12", report: "RUO-26-7C972016", pdf: "/coas/AO-5-080326.png" },
  { lot: "CI-10-080326", productSlug: "cjc-1295-ipamorelin-blend", productName: "CJC-1295 + Ipamorelin", strength: "5/5 mg", purity: "99.95%", lab: "RUO Eagle", tested: "2026-08-14", report: "RUO-26-6A9A2737", pdf: "/coas/CI-10-080326.png" },
  { lot: "NA-500-080326", productSlug: "nad-plus", productName: "NAD+", strength: "500 mg", purity: "99.97%", lab: "RUO Eagle", tested: "2026-08-11", report: "RUO-26-BD6D7CDD", pdf: "/coas/NA-500-080326.png" },
  { lot: "NA-1000-080326", productSlug: "nad-plus", productName: "NAD+", strength: "1000 mg", purity: "99.93%", lab: "RUO Eagle", tested: "2026-08-14", report: "RUO-26-E3B2630E", pdf: "/coas/NA-1000-080326.png" },
  { lot: "SR-10-080326", productSlug: "sermorelin", productName: "Sermorelin", strength: "10 mg", purity: "99.97%", lab: "RUO Eagle", tested: "2026-08-07", report: "RUO-26-0B5318F3", pdf: "/coas/SR-10-080326.png" },
  { lot: "SL-10-080326", productSlug: "selank", productName: "Selank", strength: "10 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-04", report: "RUO-26-117A33A2", pdf: "/coas/SL-10-080326.png" },
  { lot: "SL-5-080326", productSlug: "selank", productName: "Selank", strength: "5 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-06", report: "RUO-26-71683AA4", pdf: "/coas/SL-5-080326.png" },
  { lot: "SX-10-080326", productSlug: "semax", productName: "Semax", strength: "10 mg", purity: "99.95%", lab: "RUO Eagle", tested: "2026-08-14", report: "RUO-26-F2A5166D", pdf: "/coas/SX-10-080326.png" },
  { lot: "SX-5-080326", productSlug: "semax", productName: "Semax", strength: "5 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-11", report: "RUO-26-B423D3FA", pdf: "/coas/SX-5-080326.png" },
  { lot: "EP-50-080326", productSlug: "epitalon", productName: "Epitalon", strength: "50 mg", purity: "99.93%", lab: "RUO Eagle", tested: "2026-08-13", report: "RUO-26-98A9C6FE", pdf: "/coas/EP-50-080326.png" },
  { lot: "CA-10-080326", productSlug: "cagrilintide", productName: "Cagrilintide", strength: "10 mg", purity: "99.96%", lab: "RUO Eagle", tested: "2026-08-06", report: "RUO-26-848549C7", pdf: "/coas/CA-10-080326.png" },
  { lot: "CA-5-080326", productSlug: "cagrilintide", productName: "Cagrilintide", strength: "5 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-10", report: "RUO-26-1407E3A7", pdf: "/coas/CA-5-080326.png" },
  { lot: "SS-10-080326", productSlug: "ss-31", productName: "SS-31", strength: "10 mg", purity: "99.96%", lab: "RUO Eagle", tested: "2026-08-13", report: "RUO-26-D2306479", pdf: "/coas/SS-10-080326.png" },
  { lot: "SS-50-080326", productSlug: "ss-31", productName: "SS-31", strength: "50 mg", purity: "99.92%", lab: "RUO Eagle", tested: "2026-08-05", report: "RUO-26-C5019530", pdf: "/coas/SS-50-080326.png" },
  { lot: "TS-10-080326", productSlug: "tesamorelin", productName: "Tesamorelin", strength: "10 mg", purity: "99.93%", lab: "RUO Eagle", tested: "2026-08-06", report: "RUO-26-B3BE07DE", pdf: "/coas/TS-10-080326.png" },
  { lot: "CD-10-080326", productSlug: "cjc-1295-no-dac", productName: "CJC-1295 No DAC", strength: "10 mg", purity: "99.97%", lab: "RUO Eagle", tested: "2026-08-04", report: "RUO-26-391829DA", pdf: "/coas/CD-10-080326.png" },
  { lot: "CD-5-080326", productSlug: "cjc-1295-no-dac", productName: "CJC-1295 No DAC", strength: "5 mg", purity: "99.97%", lab: "RUO Eagle", tested: "2026-08-11", report: "RUO-26-6BEC7C10", pdf: "/coas/CD-5-080326.png" },
  { lot: "M1-10-080326", productSlug: "melanotan-i", productName: "Melanotan I", strength: "10 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-13", report: "RUO-26-C1130BF4", pdf: "/coas/M1-10-080326.png" },
  { lot: "M2-10-080326", productSlug: "melanotan-ii", productName: "Melanotan II", strength: "10 mg", purity: "99.93%", lab: "RUO Eagle", tested: "2026-08-06", report: "RUO-26-A2CFE0F0", pdf: "/coas/M2-10-080326.png" },
  { lot: "AM-50-080326", productSlug: "5-amino-1mq", productName: "5-Amino-1MQ", strength: "50 mg", purity: "99.95%", lab: "RUO Eagle", tested: "2026-08-07", report: "RUO-26-F44C5B66", pdf: "/coas/AM-50-080326.png" },
  { lot: "GL-1500-080326", productSlug: "glutathione", productName: "Glutathione", strength: "1500 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-05", report: "RUO-26-7B5188C2", pdf: "/coas/GL-1500-080326.png" },
  { lot: "IP-10-080326", productSlug: "ipamorelin", productName: "Ipamorelin", strength: "10 mg", purity: "99.92%", lab: "RUO Eagle", tested: "2026-08-11", report: "RUO-26-71F09B8F", pdf: "/coas/IP-10-080326.png" },
  { lot: "IP-5-080326", productSlug: "ipamorelin", productName: "Ipamorelin", strength: "5 mg", purity: "99.96%", lab: "RUO Eagle", tested: "2026-08-04", report: "RUO-26-24C212ED", pdf: "/coas/IP-5-080326.png" },
  { lot: "KI-5-080326", productSlug: "kisspeptin-10", productName: "Kisspeptin-10", strength: "5 mg", purity: "99.93%", lab: "RUO Eagle", tested: "2026-08-07", report: "RUO-26-717F2186", pdf: "/coas/KI-5-080326.png" },
  { lot: "HC-10000-080326", productSlug: "hcg", productName: "HCG", strength: "10,000 IU", purity: "99.93%", lab: "RUO Eagle", tested: "2026-08-06", report: "RUO-26-37399ECC", pdf: "/coas/HC-10000-080326.png" },
  { lot: "HC-5000-080326", productSlug: "hcg", productName: "HCG", strength: "5,000 IU", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-12", report: "RUO-26-B95FD469", pdf: "/coas/HC-5000-080326.png" },
  { lot: "GR-5-080326", productName: "GHRP-6", strength: "5 mg", purity: "99.94%", lab: "RUO Eagle", tested: "2026-08-14", report: "RUO-26-D9C89634", pdf: "/coas/GR-5-080326.png" },
  { lot: "TH-10-080326", productName: "Thymalin", strength: "10 mg", purity: "99.93%", lab: "RUO Eagle", tested: "2026-08-11", report: "RUO-26-DCD0984F", pdf: "/coas/TH-10-080326.png" },
];

/** Certificates published. */
export const COA_COUNT = COAS.length;

/** Distinct compounds (including blends) with at least one published certificate. */
export const TESTED_COUNT = new Set(COAS.map((c) => c.productName)).size;
