import { Hero, Ticker, Categories, CoaBand, BestSellers, QualityControl, Reviews, WhyUs } from "../components/home/Sections";
import { Newsletter } from "../components/forms/Newsletter";
import { JsonLd, organizationLd } from "../lib/seo";

/**
 * Homepage — same section order as the Ventra storefront:
 * Hero → Ticker → Categories → COA band → Best Sellers → Quality Control
 * → Reviews → Why Us → Newsletter. Everything is server-rendered.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationLd()} />
      <Hero />
      <Ticker />
      <Categories />
      <CoaBand />
      <BestSellers />
      <QualityControl />
      <Reviews />
      <WhyUs />
      <Newsletter />
    </>
  );
}
