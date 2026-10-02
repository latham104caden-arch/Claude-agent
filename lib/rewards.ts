import { createHmac } from "node:crypto";
import type Stripe from "stripe";
import { sendEvent } from "./omnisend";
import { getStripe } from "./stripe";

/**
 * Spend rewards: every $999 a customer spends earns a one-time $100 code tied
 * to their email. No database: spend is summed from their paid Stripe orders
 * (goods after discounts, minus refunds; no shipping or tax), and each code is
 * derived from email + milestone + AUTH_SECRET, so it is unguessable and is
 * created in Stripe at most once (creation is idempotent by code).
 */
export const REWARD_EVERY = 999;
export const REWARD_VALUE = 100;
const COUPON_ID = "rr-reward-100";
const CODE_PREFIX = "RR100";

export type RewardCode = { code: string; used: boolean };
export type Rewards = { spent: number; earned: number; toNext: number; codes: RewardCode[] };

function rewardCode(email: string, n: number): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const mac = createHmac("sha256", secret).update(`reward|${email}|${n}`).digest("base64url").replace(/[^A-Za-z0-9]/g, "");
  return CODE_PREFIX + mac.slice(0, 8).toUpperCase();
}

export const isRewardCode = (code: string) => code.toUpperCase().startsWith(CODE_PREFIX);

/** Lifetime spend for an email, in dollars. */
export async function lifetimeSpend(stripe: Stripe, email: string): Promise<number> {
  let cents = 0;
  for await (const s of stripe.checkout.sessions.list({ customer_details: { email }, limit: 100, expand: ["data.payment_intent.latest_charge"] })) {
    if (s.payment_status !== "paid") continue;
    const goods = (s.amount_subtotal ?? 0) - (s.total_details?.amount_discount ?? 0);
    const pi = s.payment_intent;
    const charge = pi && typeof pi === "object" ? pi.latest_charge : null;
    const refunded = charge && typeof charge === "object" ? charge.amount_refunded : 0;
    cents += Math.max(0, goods - refunded);
  }
  return cents / 100;
}

async function ensureCoupon(stripe: Stripe): Promise<string> {
  try {
    return (await stripe.coupons.retrieve(COUPON_ID)).id;
  } catch {
    const c = await stripe.coupons.create({ id: COUPON_ID, amount_off: REWARD_VALUE * 100, currency: "usd", duration: "once", name: `$${REWARD_VALUE} spend reward` });
    return c.id;
  }
}

async function findCode(stripe: Stripe, code: string): Promise<Stripe.PromotionCode | null> {
  return (await stripe.promotionCodes.list({ code, limit: 1 })).data[0] ?? null;
}

/** Works out what the customer has earned and makes sure each earned code exists in Stripe. */
export async function syncRewards(email: string): Promise<Rewards | null> {
  const stripe = getStripe();
  if (!stripe || !process.env.AUTH_SECRET) return null;
  email = email.toLowerCase();
  const spent = await lifetimeSpend(stripe, email);
  const earned = Math.floor(spent / REWARD_EVERY);
  const codes: RewardCode[] = [];
  let coupon: string | null = null;
  for (let n = 1; n <= earned; n++) {
    const code = rewardCode(email, n);
    let promo = await findCode(stripe, code);
    if (!promo) {
      coupon ??= await ensureCoupon(stripe);
      promo = await stripe.promotionCodes.create({
        coupon, code, max_redemptions: 1,
        restrictions: { minimum_amount: REWARD_VALUE * 100, minimum_amount_currency: "usd" },
        metadata: { email, milestone: String(n), reason: `$${REWARD_EVERY * n} lifetime spend` },
      });
      // First time this code exists → Omnisend's "earned reward" automation emails it.
      await sendEvent("earned reward", email, { code, amount: REWARD_VALUE, milestone: n, lifetimeSpend: Math.round(spent * 100) / 100 });
    }
    codes.push({ code, used: promo.times_redeemed > 0 || !promo.active });
  }
  const toNext = Math.round((REWARD_EVERY * (earned + 1) - spent) * 100) / 100;
  return { spent, earned, toNext, codes };
}

/** The Stripe promotion code for a reward code, if it exists, is unused and belongs to `email`. */
export async function rewardPromotionFor(email: string, code: string): Promise<{ id: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: "Payments aren't connected yet." };
  const promo = await findCode(stripe, code.toUpperCase());
  if (!promo || promo.metadata?.email !== email.toLowerCase()) return { error: "That reward code isn't valid for this account." };
  if (!promo.active || promo.times_redeemed > 0) return { error: "That reward code has already been used." };
  return { id: promo.id };
}
