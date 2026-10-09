import { NextResponse } from "next/server";
import { currentAdmin } from "../../../../lib/admin";
import { sendPartnerApproval } from "../../../../lib/email";
import { approvePartnerRequest, noteApprovalEmailed, priceApproval } from "../../../../lib/partner-approvals";
import { isRequestId } from "../../../../lib/partner-requests";
import { SITE } from "../../../../lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Team-only: approves a partner request. Makes the lab's private checkout link
 * (or reuses one that's still open), emails it to the lab, and returns it so the
 * team can also copy it and send it themselves.
 */
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ ok: false, message: "Not authorized." }, { status: 401 });
  let body: { id?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 }); }
  if (!isRequestId(body.id)) return NextResponse.json({ ok: false, message: "Unknown request." }, { status: 400 });

  const a = await approvePartnerRequest(body.id, admin).catch((err) => { console.error("[partner-approve]", err); return null; });
  if (!a) return NextResponse.json({ ok: false, message: "Couldn't approve that request. Try again." }, { status: 502 });
  const priced = priceApproval(a);
  if (!priced.ok) return NextResponse.json({ ok: false, message: `This kit can't be priced right now: ${priced.message}` }, { status: 409 });

  const url = `${SITE.url}/partner/checkout/${a.token}`;
  const sent = await sendPartnerApproval({
    name: a.contact.name, email: a.contact.email, url, expiresAt: a.expiresAt,
    lines: priced.lines.map((l) => ({ name: l.name, option: l.option, qty: l.qty, unit: l.unit, price: l.price, percent: l.tier?.percent ?? 0 })),
    regular: priced.regular, partner: priced.partner, savings: priced.savings,
  }).catch((err) => ({ ok: false, status: 0, error: String(err), from: "" }));
  await noteApprovalEmailed(a, sent.ok).catch(() => {});
  return NextResponse.json({
    ok: true, url, emailed: sent.ok,
    message: sent.ok ? `Approved. Link emailed to ${a.contact.email}.` : `Approved, but the email didn't send (${sent.status || "no response"} ${sent.error}). Copy the link and send it yourself.`,
  });
}
