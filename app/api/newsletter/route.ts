import { NextResponse } from "next/server";
import { stubSubmit } from "../../../lib/api/stub";
import { upsertContact } from "../../../lib/omnisend";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter signup → Omnisend contact, subscribed to email and tagged
 * "website-newsletter". Owner-approved. Needs OMNISEND_API_KEY on the
 * server; without it the form falls back to the honest 501 stub.
 */
export async function POST(req: Request) {
  if (!process.env.OMNISEND_API_KEY) return stubSubmit(req, ["email"], "Newsletter signup");

  let email = "";
  try { email = String((await req.json())?.email ?? "").trim().toLowerCase(); } catch {}
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });

  const ok = await upsertContact({ email, tags: ["website-newsletter"], subscribe: true, consentSource: "website newsletter form" });
  return ok
    ? NextResponse.json({ ok: true, message: "You're subscribed. Watch your inbox." })
    : NextResponse.json({ ok: false, message: "Couldn't subscribe you right now. Please try again." }, { status: 502 });
}
