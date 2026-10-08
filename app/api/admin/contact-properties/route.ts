import { NextResponse } from "next/server";
import { currentAdmin } from "../../../../lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Fields the import screen can't create (purchase data and the random send_group split), written as custom properties. */
const NUMBER = ["total_spent", "total_orders", "average_order", "days_since_last_order"];
const TEXT = ["customer_status", "spend_band", "signup_source", "first_order_date", "last_order_date", "first_seen", "send_group"];
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const MAX_ROWS = 300;
const PARALLEL = 6;

/**
 * Team-only: takes up to 300 CSV rows (the browser splits the file) and
 * PATCHes only the custom properties above onto each existing contact, by
 * email. Omnisend's batch API can't be used: it insists on a channel status,
 * and this must never change anyone's subscription. Missing contacts are
 * skipped, not created.
 */
export async function POST(req: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, message: "Not authorized." }, { status: 401 });
  const key = process.env.OMNISEND_API_KEY;
  if (!key) return NextResponse.json({ ok: false, message: "OMNISEND_API_KEY isn't set." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { rows?: Record<string, string>[] } | null;
  const rows = Array.isArray(body?.rows) ? body.rows.slice(0, MAX_ROWS) : [];

  const items = rows.flatMap((r) => {
    const email = String(r.email ?? "").trim().toLowerCase();
    if (!EMAIL.test(email)) return [];
    const props: Record<string, string | number> = {};
    for (const k of NUMBER) if (r[k] !== undefined && r[k] !== "" && Number.isFinite(Number(r[k]))) props[k] = Number(r[k]);
    for (const k of TEXT) if (r[k]) props[k] = String(r[k]);
    return Object.keys(props).length ? [{ email, props }] : [];
  });

  let updated = 0, missing = 0, failed = 0;
  const patch = async ({ email, props }: (typeof items)[number]) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(`https://api.omnisend.com/v5/contacts?email=${encodeURIComponent(email)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", accept: "application/json", "X-API-KEY": key },
          body: JSON.stringify({ customProperties: props }),
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) { updated++; return; }
        if (res.status === 404) { missing++; return; }
        if (res.status === 429 || res.status >= 500) {
          const wait = Number(res.headers.get("retry-after")) || 2 ** attempt;
          await new Promise((r) => setTimeout(r, Math.min(wait, 20) * 1000));
          continue;
        }
        console.error("[admin/contact-properties]", res.status, await res.text().catch(() => ""));
        failed++; return;
      } catch (err) {
        if (attempt === 3) { console.error("[admin/contact-properties]", err); failed++; return; }
      }
    }
    failed++;
  };
  for (let i = 0; i < items.length; i += PARALLEL) await Promise.all(items.slice(i, i + PARALLEL).map(patch));
  return NextResponse.json({ ok: true, updated, missing, failed, skipped: rows.length - items.length });
}
