/**
 * Time-limited sitewide sale code (owner's campaigns). The window comes from
 * env so it can open exactly when the campaign sends:
 *   FALL32_STARTS_AT (optional, ISO time) and FALL32_ENDS_AT (ISO time).
 * Without FALL32_ENDS_AT, or after it, the code is off.
 * One discount per order: on a bulk order the shopper gets whichever saves
 * more, the sale or bulk pricing (app/api/checkout).
 */
/** freeShippingOver: with this code, shipping is free from this pre-discount subtotal (normally $245). */
export const SALE = { code: "FALL32", percent: 32, name: "Fall Sale", freeShippingOver: 195 } as const;

export function saleState(now = Date.now()): "active" | "upcoming" | "ended" {
  const end = Date.parse(process.env.FALL32_ENDS_AT ?? "");
  const start = Date.parse(process.env.FALL32_STARTS_AT ?? "");
  if (!Number.isFinite(end) || now >= end) return "ended";
  if (Number.isFinite(start) && now < start) return "upcoming";
  return "active";
}
