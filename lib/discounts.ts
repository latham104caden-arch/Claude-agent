import { validateCode } from "@adz/next";
import { REWARD_VALUE, isRewardCode, rewardPromotionFor } from "./rewards";
import { hasPaidOrder } from "./account";
import { SALE, saleState } from "./sale";

/** First-order code from the drop-alerts offer (components/offer). */
export const FIRST_ORDER = { code: "RR25", percent: 25, minimum: 100 } as const;

/** What a code is worth on this cart. One per order (no stacking). Shared by the preview and the real charge. */
export type Discount =
  | { kind: "reward"; code: string; label: string; amount: number; promotionCode: string }
  | { kind: "creator"; code: string; label: string; amount: number; percent: number }
  | { kind: "first"; code: string; label: string; amount: number; percent: number }
  | { kind: "sale"; code: string; label: string; amount: number; percent: number };

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Resolves a typed (or creator-link) code against the cart subtotal.
 * `explicit` = the shopper typed it, so a bad code is an error; a stale link
 * code is just ignored (null).
 */
export async function resolveDiscount(raw: string, opts: { subtotal: number; account: string | null; explicit: boolean }): Promise<Discount | { error: string } | null> {
  const code = raw.trim().toUpperCase();
  if (!code) return null;

  if (isRewardCode(code)) {
    if (!opts.account) return { error: "Sign in to use a reward code. It only works for the account that earned it." };
    if (opts.subtotal < REWARD_VALUE) return { error: `Reward codes work on orders of $${REWARD_VALUE} or more.` };
    const r = await rewardPromotionFor(opts.account, code);
    if ("error" in r) return { error: r.error };
    return { kind: "reward", code, label: `$${REWARD_VALUE} reward`, amount: REWARD_VALUE, promotionCode: r.id };
  }

  if (code === SALE.code) {
    const state = saleState();
    if (state !== "active") return { error: state === "upcoming" ? `${SALE.code} isn't live yet.` : `The ${SALE.name} has ended, so ${SALE.code} no longer works.` };
    return { kind: "sale", code, label: `${SALE.percent}% off · ${SALE.name}`, amount: round((opts.subtotal * SALE.percent) / 100), percent: SALE.percent };
  }

  if (code === FIRST_ORDER.code) {
    if (!opts.account) return { error: `Sign in to use ${FIRST_ORDER.code}. It's for a first order, so we check your order history.` };
    if (opts.subtotal < FIRST_ORDER.minimum) return { error: `${FIRST_ORDER.code} works on orders of $${FIRST_ORDER.minimum} or more.` };
    let ordered: boolean | null = null;
    try { ordered = await hasPaidOrder(opts.account); } catch (err) { console.error("[discounts] order history check failed", err); }
    if (ordered === null) return { error: "We couldn't check your order history right now. Try again in a minute." };
    if (ordered) return { error: `${FIRST_ORDER.code} is for a first order, and this account already has one.` };
    return { kind: "first", code, label: `${FIRST_ORDER.percent}% off your first order`, amount: round((opts.subtotal * FIRST_ORDER.percent) / 100), percent: FIRST_ORDER.percent };
  }

  let check: Awaited<ReturnType<typeof validateCode>> | null = null;
  try { check = await validateCode(code); } catch (err) { console.error("[discounts] adz code check failed", err); }
  if (check?.valid && check.discount_pct && check.discount_pct > 0) {
    const pct = check.discount_pct;
    return { kind: "creator", code: (check.code ?? code).toUpperCase(), label: `${pct}% off`, amount: round((opts.subtotal * pct) / 100), percent: pct };
  }
  if (!opts.explicit) return null;
  return { error: check ? `The code “${code}” isn't valid.` : "We couldn't check that code right now. Try again, or check out without it." };
}
