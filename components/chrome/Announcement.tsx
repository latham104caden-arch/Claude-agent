import { SITE } from "../../lib/site";
import { COA_COUNT, TESTED_COUNT } from "../../data/coas";
import { giftOffer } from "../../lib/gift";
import { money } from "../../lib/format";
import { AnnounceBar } from "./AnnounceBar";

const BASE = [
  `${COA_COUNT} COAs published`,
  `${TESTED_COUNT} compounds 10x tested`,
  "Lyophilized & sealed for stability",
  "2–3 day shipping",
];
const SHIPPING = `Free shipping on orders $${SITE.freeShippingThreshold}+`;
const RUO = "For laboratory research use only";

/** "Sunday" for an end time of Sunday-into-Monday midnight, in the store's (Central) time. */
const endDay = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "America/Chicago" }).format(new Date(Date.parse(iso) - 1));

/**
 * Sitewide scrolling announcement bar. While the free-gift deal (lib/gift.ts)
 * runs, the bar turns teal and leads with the deal; it switches back to the
 * normal bar by itself when the deal ends.
 */
export function Announcement() {
  const gift = giftOffer();
  const normal = [...BASE, SHIPPING, RUO];
  if (!gift) return <AnnounceBar items={normal} />;
  const min = money(gift.minimum).replace(/\.00$/, "");
  const dealItems = [
    `Free ${gift.product.name} ${gift.variant.option} + free shipping on orders ${min}+`,
    `Limited time · ends ${endDay(gift.endsAt)} at midnight`,
  ];
  return <AnnounceBar items={normal} deal={{ items: [...dealItems, ...BASE, RUO], endsAt: gift.endsAt }} />;
}
