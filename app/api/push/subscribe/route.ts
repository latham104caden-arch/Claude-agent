import { NextResponse } from "next/server";
import { isPushSub, saveSubscription, storageReady } from "../../../../lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Saves a browser's drop-alert subscription. Body: { subscription }. */
export async function POST(req: Request) {
  let body: { subscription?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!isPushSub(body.subscription)) return NextResponse.json({ ok: false }, { status: 400 });
  if (!storageReady()) {
    console.error("[push] BLOB_READ_WRITE_TOKEN is not set; subscription not saved");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  try {
    await saveSubscription(body.subscription);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push] save failed", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
