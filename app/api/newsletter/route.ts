import { NextResponse } from "next/server";
import { stubSubmit } from "../../../lib/api/stub";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter signup → Omnisend contact (subscribed to email, tagged
 * "website-newsletter"). Owner-approved. Needs OMNISEND_API_KEY on the
 * server; without it the form falls back to the honest 501 stub.
 */
export async function POST(req: Request) {
  const key = process.env.OMNISEND_API_KEY;
  if (!key) return stubSubmit(req, ["email"], "Newsletter signup");

  let email = "";
  try { email = String((await req.json())?.email ?? "").trim().toLowerCase(); } catch {}
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });

  try {
    const res = await fetch("https://api.omnisend.com/v5/contacts", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "X-API-KEY": key },
      body: JSON.stringify({
        identifiers: [{ type: "email", id: email, channels: { email: { status: "subscribed", statusDate: new Date().toISOString() } } }],
        tags: ["website-newsletter"],
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[newsletter] Omnisend", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ ok: false, message: "Couldn't subscribe you right now. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, message: "You're subscribed. Watch your inbox." });
  } catch (err) {
    console.error("[newsletter] Omnisend request failed", err);
    return NextResponse.json({ ok: false, message: "Couldn't subscribe you right now. Please try again." }, { status: 502 });
  }
}
