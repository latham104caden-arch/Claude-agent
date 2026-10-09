import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readAttribution } from "@adz/next";
import { currentEmail } from "../../../../lib/auth";
import { resolveDiscount } from "../../../../lib/discounts";
import { priceCart } from "../../../../lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Previews a discount code on the current cart so the order summary can show
 * it before payment. Body: { lines, code? }. With no code, reports the
 * creator-link code (if any) that checkout would auto-apply.
 */
export async function POST(req: Request) {
  let body: { lines?: unknown; code?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 }); }
  const cart = priceCart(body.lines);
  if (!cart.ok) return NextResponse.json({ ok: false, message: cart.message }, { status: 400 });

  const typed = typeof body.code === "string" ? body.code.trim() : "";
  const link = typed ? null : readAttribution(await cookies()).code;
  const d = await resolveDiscount(typed || link || "", { subtotal: cart.subtotal, lines: cart.lines.map((l) => ({ product: l.product, price: l.variant.price, qty: l.qty })), account: await currentEmail(), explicit: !!typed });
  if (!d) return NextResponse.json({ ok: true, discount: null });
  if ("error" in d) return NextResponse.json({ ok: false, message: d.error }, { status: 400 });
  return NextResponse.json({ ok: true, discount: { code: d.code, label: d.label, amount: d.amount, kind: d.kind, fromLink: !typed } });
}
