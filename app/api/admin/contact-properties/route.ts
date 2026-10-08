import { NextResponse } from "next/server";
import { currentAdmin } from "../../../../lib/admin";
import { parseCsv } from "../../../../lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Purchase fields (and the random send_group split) the import screen can't create, written as typed custom properties. */
const NUMBER = ["total_spent", "total_orders", "average_order", "days_since_last_order"];
const TEXT = ["customer_status", "spend_band", "signup_source", "first_order_date", "last_order_date", "first_seen", "send_group"];
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const BATCH = 100;

/**
 * Team-only: takes a contact CSV (the import files) and writes only the
 * purchase fields above onto each contact, matched by email, through
 * Omnisend's batch API. No subscription status, consent or tags are sent, so
 * nobody's status changes. Contacts should be imported first.
 */
export async function POST(req: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, message: "Not authorized." }, { status: 401 });
  const key = process.env.OMNISEND_API_KEY;
  if (!key) return NextResponse.json({ ok: false, message: "OMNISEND_API_KEY isn't set." }, { status: 503 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "Choose a CSV file." }, { status: 400 });

  const rows = parseCsv(await file.text());
  if (!rows.length || !("email" in rows[0])) return NextResponse.json({ ok: false, message: "That file has no email column." }, { status: 400 });

  const items = rows.flatMap((r) => {
    const email = r.email.toLowerCase();
    if (!EMAIL.test(email)) return [];
    const props: Record<string, string | number> = {};
    for (const k of NUMBER) if (r[k] !== undefined && r[k] !== "" && Number.isFinite(Number(r[k]))) props[k] = Number(r[k]);
    for (const k of TEXT) if (r[k]) props[k] = r[k];
    return Object.keys(props).length ? [{ identifiers: [{ type: "email", id: email }], customProperties: props }] : [];
  });
  if (!items.length) return NextResponse.json({ ok: false, message: "No purchase fields found in that file." }, { status: 400 });

  let sent = 0, failedBatches = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    try {
      const res = await fetch("https://api.omnisend.com/v5/batches", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json", "X-API-KEY": key },
        body: JSON.stringify({ method: "POST", endpoint: "contacts", items: chunk }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) sent += chunk.length;
      else { failedBatches++; console.error("[admin/contact-properties] batch", res.status, await res.text().catch(() => "")); }
    } catch (err) {
      failedBatches++;
      console.error("[admin/contact-properties]", err);
    }
  }
  return NextResponse.json({
    ok: failedBatches === 0,
    message: `Sent purchase fields for ${sent.toLocaleString()} of ${items.length.toLocaleString()} contacts from ${file.name}${failedBatches ? ` (${failedBatches} batch${failedBatches === 1 ? "" : "es"} failed, run the file again)` : ""}. Omnisend applies them in the background over a few minutes.`,
  });
}
