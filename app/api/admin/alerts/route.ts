import { NextResponse } from "next/server";
import { currentAdmin } from "../../../../lib/admin";
import { isPushSub, removeSubscription, saveSubscription, sendToAll, senderReady, TEAM_PREFIX } from "../../../../lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Team-only: turn new-order alerts on/off for this device, or send a test.
 * Body: { action: "on" | "off" | "test", subscription? }.
 */
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ ok: false, message: "Not authorized." }, { status: 401 });
  if (!senderReady()) return NextResponse.json({ ok: false, message: "Push isn't configured (VAPID keys or Blob store missing)." }, { status: 503 });

  let body: { action?: unknown; subscription?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 }); }

  try {
    if (body.action === "test") {
      const r = await sendToAll({ title: "Order alerts are on", body: `Test from ${admin}. New orders will show up like this.`, url: "/admin" }, TEAM_PREFIX);
      return NextResponse.json({ ok: true, message: `Sent to ${r.sent} device${r.sent === 1 ? "" : "s"}.` });
    }
    if (!isPushSub(body.subscription)) return NextResponse.json({ ok: false, message: "This browser didn't give a valid push subscription." }, { status: 400 });
    if (body.action === "on") {
      await saveSubscription(body.subscription, TEAM_PREFIX, { by: admin });
      return NextResponse.json({ ok: true, message: "Order alerts are on for this device." });
    }
    if (body.action === "off") {
      await removeSubscription(body.subscription.endpoint, TEAM_PREFIX);
      return NextResponse.json({ ok: true, message: "Order alerts are off for this device." });
    }
    return NextResponse.json({ ok: false, message: "Unknown action." }, { status: 400 });
  } catch (err) {
    console.error("[admin/alerts]", err);
    return NextResponse.json({ ok: false, message: "Couldn't update alerts. Try again." }, { status: 502 });
  }
}
