import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { senderReady, sendToAll } from "../../../../lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Owner-only: sends a drop alert to every subscriber.
 * curl -X POST https://revisedresearch.com/api/push/send \
 *   -H "Authorization: Bearer $PUSH_ADMIN_TOKEN" -H "content-type: application/json" \
 *   -d '{"title":"New drop","body":"…","url":"/shop"}'
 */
export async function POST(req: Request) {
  const token = process.env.PUSH_ADMIN_TOKEN ?? "";
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok = token.length >= 24 && given.length === token.length && timingSafeEqual(Buffer.from(given), Buffer.from(token));
  if (!ok) return NextResponse.json({ ok: false, message: "Not authorized." }, { status: 401 });
  if (!senderReady()) return NextResponse.json({ ok: false, message: "Push isn't configured (VAPID keys or Blob store missing)." }, { status: 503 });

  let body: { title?: unknown; body?: unknown; url?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 80) : "";
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 240) : "";
  const url = typeof body.url === "string" && body.url.startsWith("/") ? body.url : "/";
  if (!title) return NextResponse.json({ ok: false, message: "A title is required." }, { status: 400 });

  const result = await sendToAll({ title, body: text, url });
  return NextResponse.json({ ok: true, ...result });
}
