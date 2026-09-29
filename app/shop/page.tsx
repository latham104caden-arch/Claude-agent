import type { Metadata } from "next";
import { getCatalog, getCategories, summarize } from "../../lib/catalog";
import { ShopStage } from "../../components/product/ShopStage";

export const metadata: Metadata = {
  title: "Shop Research Compounds",
  description: "Browse high-purity research compounds, nasal research formats, bundles and lab supplies. COAs published for every lot.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return <ShopStage items={getCatalog().map(summarize)} categories={getCategories()} />;
}
