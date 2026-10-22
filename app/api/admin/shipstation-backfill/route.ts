import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { currentAdmin } from "../../../../lib/admin";
import { allOrders, linesFor } from "../../../../lib/metrics";
import { findInShipStation, sendToShipStation, shipStationReady } from "../../../../lib/shipstation";
import { getStripe } from "../../../../lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CAP = 150;
const SESSION = /^cs_(live|test)_[A-Za-z0-9]+$/;
const fail = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status });
const sendTests = () => process.env.SHIPSTATION_TEST_ORDERS === "true";

/**
 * Team-only: sends past paid orders to ShipStation (for Ikonik), for orders
 * from before the hookup. GET lists the candidates so the team can review and
 * untick anything already shipped; POST sends one order. Each send first looks
 * the order up in ShipStation by its Stripe session, so nothing goes in twice.
 * Fully refunded orders and Stripe test orders are never sent.
 */
export async function GET() {
  if (!(await currentAdmin())) return fail("Not authorized.", 401);
  if (!shipStationReady()) return fail("SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET aren't set in Vercel.", 503);
  const raw = await allOrders(true);
  if (!raw) return fail("Stripe isn't connected.", 503);
  const orders = raw.orders.filter((o) => o.status !== "Refunded" && (o.livemode || sendTests())).slice(0, CAP);
  const lines = await linesFor(orders.map((o) => o.id));
  return NextResponse.json({
    ok: true,
    store: process.env.SHIPSTATION_STORE_ID || null,
    capped: raw.orders.length > CAP,
    orders: orders.map((o) => ({
      id: o.id, number: o.number, created: o.created, name: o.name, place: [o.city, o.state].filter(Boolean).join(", "),
      total: o.total, status: o.status, live: o.livemode,
      items: (lines.get(o.id) ?? []).map((l) => `${l.qty} × ${l.name}`),
    })),
  });
}

export async function POST(req: Request) {
  if (!(await currentAdmin())) return fail("Not authorized.", 401);
  if (!shipStationReady()) return fail("SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET aren't set in Vercel.", 503);
  const stripe = getStripe();
  if (!stripe) return fail("Stripe isn't connected.", 503);
  const body = (await req.json().catch(() => ({}))) as { id?: unknown };
  const id = typeof body.id === "string" && SESSION.test(body.id) ? body.id : null;
  if (!id) return fail("Missing order.", 400);

  try {
    const s = await stripe.checkout.sessions.retrieve(id, { expand: ["line_items.data.price.product", "payment_intent.latest_charge"] });
    if (s.payment_status !== "paid") return NextResponse.json({ ok: true, result: "skipped", message: "Not paid." });
    if (fullyRefunded(s)) return NextResponse.json({ ok: true, result: "skipped", message: "Refunded." });
    if (!s.livemode && !sendTests()) return NextResponse.json({ ok: true, result: "skipped", message: "Stripe test order." });
    const found = await findInShipStation(s.id);
    if (found) return NextResponse.json({ ok: true, result: "already", message: `Already in ShipStation (${found.orderStatus.replace(/_/g, " ")}).` });
    const sent = await sendToShipStation(s);
    if (!sent) return NextResponse.json({ ok: true, result: "skipped", message: "Not sent." });
    return NextResponse.json({ ok: true, result: "sent", message: "Sent: awaiting shipment." });
  } catch (err) {
    console.error("[admin/shipstation-backfill]", id, err);
    const msg = err instanceof Error ? err.message : "";
    return fail(/ShipStation 401/.test(msg) ? "ShipStation refused the keys (401). Check them in Vercel." : msg.startsWith("ShipStation") ? msg.slice(0, 200) : "Couldn't send this one. Try again.", 502);
  }
}

function fullyRefunded(s: Stripe.Checkout.Session): boolean {
  const pi = typeof s.payment_intent === "object" ? s.payment_intent : null;
  const charge = pi && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
  return !!charge && charge.amount_refunded > 0 && charge.amount_refunded >= charge.amount;
}
