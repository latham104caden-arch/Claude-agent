import { NextResponse } from "next/server";
import { currentAdmin } from "../../../../lib/admin";
import { sendFromOrders } from "../../../../lib/email";
import { SITE } from "../../../../lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Team-only: sends one test from the orders@ sender to the support inbox and to
 * the signed-in team member, and reports Resend's exact answer. If only the
 * direct copy arrives, support@ forwarding is the problem.
 */
export async function POST() {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ ok: false, message: "Not authorized." }, { status: 401 });
  const r = await sendFromOrders({
    to: [...new Set([SITE.supportEmail, admin])],
    subject: "Test: Revised Research partner/order email",
    text: `Test sent from /admin by ${admin} at ${new Date().toISOString()}. If this reached the support inbox, partner requests and order confirmations can too.`,
  });
  const sender = r.from.replace(/.*</, "").replace(">", "");
  return NextResponse.json({
    ok: r.ok,
    message: r.ok ? `Sent from ${sender} to ${SITE.supportEmail} and ${admin}. If only the ${admin} copy arrives, support@ forwarding is dropping it.` : `Resend refused it (${r.status || "no response"}): ${r.error}`,
  });
}
