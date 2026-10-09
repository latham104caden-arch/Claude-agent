import { NextResponse } from "next/server";
import { priceCart } from "../../../../lib/orders";
import { PARTNER_TIERS, partnerQuote } from "../../../../lib/partner";
import { sendPartnerRequest } from "../../../../lib/email";
import { savePartnerRequest } from "../../../../lib/partner-requests";
import { alertTeamPartnerRequest } from "../../../../lib/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Research Partner pricing request from /partner. Body: { lines: [{sku, qty}],
 * name, email, phone?, organization?, notes?, website? (honeypot) }.
 * Re-prices the kit from the catalog (never trusts the browser's numbers),
 * requires at least the smallest kit, then emails the support inbox, pings team
 * devices and saves it with the email result (shown in /admin). It counts as
 * received if any of those worked.
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
  const q = partnerQuote(cart.lines.map((l) => ({ sku: l.variant.sku, slug: l.product.slug, price: l.variant.price, qty: l.qty })));
  if (!q.qualifying) return fail(`Partner pricing starts at ${PARTNER_TIERS[0].kit} of the same vial (same compound and size).`);
  const bySku = new Map(cart.lines.map((l) => [l.variant.sku, l] as const));

  const request = {
    contact: { name, email, phone: clean(body.phone, 40), organization: clean(body.organization, 160), notes: clean(body.notes, 2000) },
    lines: q.lines.map((l) => ({ name: bySku.get(l.sku)!.product.name, option: bySku.get(l.sku)!.variant.option, sku: l.sku, qty: l.qty, price: l.price, percent: l.tier?.percent ?? 0, savings: l.savings })),
    quote: { vials: q.vials, qualifyingVials: q.qualifyingVials, regular: q.regular, savings: q.savings, partner: q.partner, percentOff: q.percentOff },
  };
  const [mail, alerted] = await Promise.all([
    sendPartnerRequest(request).catch((err) => ({ ok: false, status: 0, error: String(err), from: "" })),
    alertTeamPartnerRequest({ name, organization: request.contact.organization, vials: q.vials, savings: q.savings }).catch((err) => { console.error("[partner] alert", err); return false; }),
  ]);
  // Saved with the email result, so /admin shows the request and whether (and why not) the email went out.
  const saved = await savePartnerRequest({ ...request, email: mail });
  if (!saved && !mail.ok) {
    console.error("[partner] request lost", { email: mail, alerted });
    return fail("We couldn't send your request just now. Please email support@revisedresearch.com instead.", 502);
  }
  return NextResponse.json({ ok: true });
}
