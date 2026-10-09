/**
 * Approved Research Partner kits. When the team approves a request in /admin,
 * the lab gets a private link (/partner/checkout/<token>) to buy exactly that
 * kit at partner prices. The link is single-use (closed once paid) and expires
 * after APPROVAL_DAYS. Kept private in Vercel Blob (partner-approvals/).
 * Regular checkout never applies partner pricing.
 */
import { randomBytes } from "node:crypto";
import { priceCart, shippingFor } from "./orders";
import { partnerQuote, partnerUnit } from "./partner";
import { getPartnerRequest, readPrivateJson, updatePartnerRequest, writePrivateJson } from "./partner-requests";
import { storageReady } from "./push";
import type { PartnerTier } from "./partner";

const PREFIX = "partner-approvals/";
export const APPROVAL_DAYS = 14;
const TOKEN = /^[a-f0-9]{48}$/;

export type PartnerApproval = {
  token: string;
  requestId: string;
  at: string;
  expiresAt: string;
  approvedBy: string;
  contact: { name: string; email: string; organization: string };
  lines: { sku: string; qty: number }[];
  paidAt?: string;
  sessionId?: string;
};

export const approvalPath = (token: string) => `${PREFIX}${token}.json`;

export async function getApproval(token: unknown): Promise<PartnerApproval | null> {
  if (typeof token !== "string" || !TOKEN.test(token) || !storageReady()) return null;
  return readPrivateJson<PartnerApproval>(approvalPath(token));
}

export function approvalState(a: PartnerApproval, now = Date.now()): "open" | "paid" | "expired" {
  if (a.paidAt) return "paid";
  return Date.parse(a.expiresAt) < now ? "expired" : "open";
}

/**
 * Approves a stored request: makes (or reuses, while still open) its private
 * checkout link. Returns the approval, or null if the request isn't found.
 */
export async function approvePartnerRequest(requestId: string, approvedBy: string): Promise<PartnerApproval | null> {
  const req = await getPartnerRequest(requestId);
  if (!req) return null;
  if (req.approval) {
    const existing = await getApproval(req.approval.token);
    if (existing && approvalState(existing) === "open") return existing;
  }
  const now = new Date();
  const a: PartnerApproval = {
    token: randomBytes(24).toString("hex"),
    requestId,
    at: now.toISOString(),
    expiresAt: new Date(now.getTime() + APPROVAL_DAYS * 86_400_000).toISOString(),
    approvedBy,
    contact: { name: req.contact.name, email: req.contact.email, organization: req.contact.organization },
    lines: req.lines.map((l) => ({ sku: l.sku, qty: l.qty })),
  };
  await writePrivateJson(approvalPath(a.token), a);
  await updatePartnerRequest(requestId, { ...req, approval: { token: a.token, at: a.at, expiresAt: a.expiresAt, emailed: false } });
  return a;
}

/** Records on the request whether the approval email went out. */
export async function noteApprovalEmailed(a: PartnerApproval, emailed: boolean): Promise<void> {
  const req = await getPartnerRequest(a.requestId);
  if (req?.approval?.token === a.token) await updatePartnerRequest(a.requestId, { ...req, approval: { ...req.approval, emailed } });
}

/** Closes the link once its order is paid (from the Stripe webhook). Safe to call twice. */
export async function markApprovalPaid(token: string, sessionId: string): Promise<void> {
  const a = await getApproval(token);
  if (!a || a.paidAt) return;
  const paidAt = new Date().toISOString();
  await writePrivateJson(approvalPath(token), { ...a, paidAt, sessionId });
  const req = await getPartnerRequest(a.requestId);
  if (req?.approval?.token === token) await updatePartnerRequest(a.requestId, { ...req, approval: { ...req.approval, paidAt } });
}

export type ApprovedLine = { sku: string; slug: string; name: string; option: string; qty: number; price: number; unit: number; tier: PartnerTier | null };

/**
 * The approved kit, re-priced from the live catalog: each vial at its tier's
 * unit price (supplies and non-marketed listings at regular price). Shipping is
 * judged on the regular subtotal, like codes at regular checkout.
 */
export function priceApproval(a: PartnerApproval):
  | { ok: true; lines: ApprovedLine[]; regular: number; savings: number; partner: number; shipping: number }
  | { ok: false; message: string } {
  const cart = priceCart(a.lines);
  if (!cart.ok) return { ok: false, message: cart.message };
  const q = partnerQuote(cart.lines.map((l) => ({ sku: l.variant.sku, slug: l.product.slug, price: l.variant.price, qty: l.qty })));
  const tierBySku = new Map(q.lines.map((l) => [l.sku, l.tier] as const));
  const lines = cart.lines.map((l) => {
    const tier = tierBySku.get(l.variant.sku) ?? null;
    return { sku: l.variant.sku, slug: l.product.slug, name: l.product.name, option: l.variant.option, qty: l.qty, price: l.variant.price, unit: tier ? partnerUnit(l.variant.price, tier.percent) : l.variant.price, tier };
  });
  const cents = (n: number) => Math.round(n * 100);
  const partner = lines.reduce((n, l) => n + cents(l.unit) * l.qty, 0) / 100;
  const regular = lines.reduce((n, l) => n + cents(l.price) * l.qty, 0) / 100;
  return { ok: true, lines, regular, savings: Math.round((regular - partner) * 100) / 100, partner, shipping: shippingFor(regular) };
}
