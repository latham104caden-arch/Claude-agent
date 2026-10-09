import { NextResponse } from "next/server";
import { priceCart } from "../../../../lib/orders";
import { PARTNER_TIERS, partnerQuote } from "../../../../lib/partner";
import { sendPartnerRequest } from "../../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Bulk pricing request from /bulk. Body: { lines: [{sku, qty}],
 * name, email, phone?, organization?, notes?, website? (honeypot) }.
 * Re-prices the kit from the catalog (never trusts the browser's numbers),
 * requires at least the smallest kit, and emails it to the team.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return fail("Invalid request."); }
  // Bots fill every field; people never see this one.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  if (!name) return fail("Please add your name.");
  if (!EMAIL.test(email)) return fail("Please add a valid email address.");

  const cart = priceCart(body.lines);
  if (!cart.ok) return fail(cart.message);
  const lines = cart.lines.map((l) => ({ slug: l.product.slug, price: l.variant.price, qty: l.qty }));
  const q = partnerQuote(lines);
  if (!q.tier) return fail(`Bulk pricing starts at a ${PARTNER_TIERS[0].kit}-vial kit. Add ${q.toNext} more vial${q.toNext === 1 ? "" : "s"}.`);

  const sent = await sendPartnerRequest({
    contact: { name, email, phone: clean(body.phone, 40), organization: clean(body.organization, 160), notes: clean(body.notes, 2000) },
    lines: cart.lines.map((l) => ({ name: l.product.name, option: l.variant.option, sku: l.variant.sku, qty: l.qty, price: l.variant.price })),
    quote: { vials: q.vials, percent: q.tier.percent, regular: q.regular, savings: q.savings, partner: q.partner, percentOff: q.percentOff },
  }).catch((err) => { console.error("[partner] request", err); return false; });
  if (!sent) return fail("We couldn't send your request just now. Please email support@revisedresearch.com instead.", 502);
  return NextResponse.json({ ok: true });
}
