import { getCatalog } from "./catalog";
import type { Product, Variant } from "./types";

/**
 * Free gift with purchase: "Spend $245, get a free ___ + free shipping".
 *
 * TO TURN IT ON: set `sku` to the variant you're giving away (the SKU is in
 * data/products.ts and on the product page, e.g. "RR-BPC-157-10MG").
 * TO TURN IT OFF: set `sku` back to "".
 * Nothing shows anywhere while it's off, or if that SKU is missing or sold out.
 *
 * `minimum` is the cart subtotal (before discounts, the same number the cart
 * shows) that unlocks the gift. One gift per order.
 * `endsAt` switches it off on its own (site, cart and checkout); the homepage
 * banner counts down to it. `startsAt` ("" = live as soon as the SKU is set).
 */
export const GIFT = {
  sku: "",
  /** Small line above the title on the homepage box. */
  label: "Limited time only",
  minimum: 245,
  startsAt: "",
  endsAt: "2026-10-12T00:00:00-05:00", // end of Sunday Oct 11, Central time
} as const;

/** Is the deal inside its time window? */
export function giftLive(now = Date.now()): boolean {
  const start = Date.parse(GIFT.startsAt), end = Date.parse(GIFT.endsAt);
  if (Number.isFinite(start) && now < start) return false;
  return !Number.isFinite(end) || now < end;
}

export type GiftOffer = { product: Product; variant: Variant; minimum: number; value: number; endsAt: string };

/** The live offer, or null when the deal is off. */
export function giftOffer(now = Date.now()): GiftOffer | null {
  if (!GIFT.sku || !giftLive(now)) return null;
  for (const product of getCatalog()) {
    const variant = product.variants.find((v) => v.sku === GIFT.sku);
    if (variant) return variant.inStock ? { product, variant, minimum: GIFT.minimum, value: variant.price, endsAt: GIFT.endsAt } : null;
  }
  return null;
}

/** Where a cart stands: unlocked, or how much more to spend. Null when the deal is off. */
export function giftFor(subtotal: number): (GiftOffer & { unlocked: boolean; toGo: number }) | null {
  const offer = giftOffer();
  if (!offer) return null;
  const toGo = Math.max(0, Math.round((offer.minimum - subtotal) * 100) / 100);
  return { ...offer, unlocked: toGo === 0, toGo };
}
