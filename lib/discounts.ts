import { validateCode } from "@adz/next";
import { REWARD_VALUE, isRewardCode, rewardPromotionFor } from "./rewards";

/** What a code is worth on this cart. One per order (no stacking). Shared by the preview and the real charge. */
export type Discount =
  | { kind: "reward"; code: string; label: string; amount: number; promotionCode: string }
  | { kind: "creator"; code: string; label: string; amount: number; percent: number };

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

  let check: Awaited<ReturnType<typeof validateCode>> | null = null;
  try { check = await validateCode(code); } catch (err) { console.error("[discounts] adz code check failed", err); }
  if (check?.valid && check.discount_pct && check.discount_pct > 0) {
    const pct = check.discount_pct;
    return { kind: "creator", code: (check.code ?? code).toUpperCase(), label: `${pct}% off`, amount: round((opts.subtotal * pct) / 100), percent: pct };
  }
  if (!opts.explicit) return null;
  return { error: check ? `The code “${code}” isn't valid.` : "We couldn't check that code right now. Try again, or check out without it." };
}
