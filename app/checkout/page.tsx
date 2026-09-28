import type { Metadata } from "next";
import { PageHero } from "../../components/ui";
import { CheckoutForm } from "../../components/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <PageHero crumbs={[{ href: "/cart", label: "Cart" }, { label: "Checkout" }]} title="Checkout" />
      <div className="container"><CheckoutForm /></div>
    </>
  );
}
