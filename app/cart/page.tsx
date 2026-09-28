import type { Metadata } from "next";
import { PageHero } from "../../components/ui";
import { CartView } from "../../components/checkout/CartView";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHero crumbs={[{ label: "Cart" }]} title="Your Cart" />
      <div className="container"><CartView /></div>
    </>
  );
}
