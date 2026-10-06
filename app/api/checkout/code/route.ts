import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readAttribution } from "@adz/next";
import { currentEmail } from "../../../../lib/auth";
import { resolveDiscount } from "../../../../lib/discounts";
import { priceCart } from "../../../../lib/orders";
import { BULK_NO_CODES, bulkFor } from "../../../../lib/bulk";
import { SALE } from "../../../../lib/sale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Previews a discount code on the current cart so the order summary can show
 * it before payment. Body: { lines, code? }. With no code, reports the
 * creator-link code (if any) that checkout would auto-apply. Bulk orders take
 * no code: the bulk discount is shown by the summary itself.
 */
export async function POST(req: Request) {
  let body: { lines?: unknown; code?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 }); }
  const cart = priceCart(body.lines);
  if (!cart.ok) return NextResponse.json({ ok: false, message: cart.message }, { status: 400 });

  const typed = typeof body.code === "string" ? body.code.trim() : "";
  if (bulkFor(cart.lines.map((l) => ({ slug: l.product.slug, price: l.variant.price, qty: l.qty }))).tier) {
    // Bulk carts take no code except a live sale code (the summary shows whichever saves more).
    if (!typed) return NextResponse.json({ ok: true, discount: null });
    if (typed.toUpperCase() !== SALE.code) return NextResponse.json({ ok: false, message: BULK_NO_CODES }, { status: 400 });
    const s = await resolveDiscount(typed, { subtotal: cart.subtotal, account: await currentEmail(), explicit: true });
    if (s && "error" in s) return NextResponse.json({ ok: false, message: s.error }, { status: 400 });
    if (!s || s.kind !== "sale") return NextResponse.json({ ok: false, message: BULK_NO_CODES }, { status: 400 });
    return NextResponse.json({ ok: true, discount: { code: s.code, label: s.label, amount: s.amount, kind: s.kind, fromLink: false } });
  }
  const link = typed ? null : readAttribution(await cookies()).code;
  const d = await resolveDiscount(typed || link || "", { subtotal: cart.subtotal, account: await currentEmail(), explicit: !!typed });
  if (!d) return NextResponse.json({ ok: true, discount: null });
  if ("error" in d) return NextResponse.json({ ok: false, message: d.error }, { status: 400 });
  return NextResponse.json({ ok: true, discount: { code: d.code, label: d.label, amount: d.amount, kind: d.kind, fromLink: !typed } });
}
