import { Hero, Ticker, Categories, CoaBand, BestSellers, QualityControl, Reviews, WhyUs } from "../components/home/Sections";
import { Newsletter } from "../components/forms/Newsletter";
import { JsonLd, organizationLd } from "../lib/seo";

/**
 * Homepage: Hero → Ticker → Best Sellers → COA band → Categories →
 * Quality Control → Reviews → Why Us → Newsletter. Best Sellers sits right
 * under the hero so "Shop All" is reached first. Everything is server-rendered.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationLd()} />
      <Hero />
      <Ticker />
      <BestSellers />
      <CoaBand />
      <Categories />
      <QualityControl />
      <Reviews />
      <WhyUs />
      <Newsletter />
    </>
  );
}
