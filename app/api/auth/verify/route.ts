import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CHALLENGE_COOKIE, SESSION_COOKIE, authConfigured, checkChallenge, cookieOpts, newSession } from "../../../../lib/auth";
import { upsertContact } from "../../../../lib/omnisend";

export const runtime = "nodejs";

/** Checks the emailed code; on success starts a 30-day session. */
export async function POST(req: Request) {
  if (!authConfigured()) return NextResponse.json({ ok: false, message: "Accounts aren't connected yet." }, { status: 503 });
  let code = "";
  try { code = String((await req.json())?.code ?? ""); } catch {}
  const jar = await cookies();
  const ok = checkChallenge(jar.get(CHALLENGE_COOKIE)?.value, code);
  if (!ok) return NextResponse.json({ ok: false, message: "That code is wrong or has expired. Check it, or send a new one." }, { status: 400 });

  const { email, profile } = ok;
  // Account holders appear in Omnisend with what they typed. Email/SMS marketing only per the boxes they left ticked.
  await upsertContact({
    email, firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone, tags: ["account"],
    subscribe: profile.emailOptIn === true, smsSubscribe: profile.smsOptIn === true, consentSource: "account sign-up form",
    consentIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null, consentUserAgent: req.headers.get("user-agent"),
  });

  const { token, maxAge } = newSession(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, cookieOpts(maxAge));
  res.cookies.set(CHALLENGE_COOKIE, "", cookieOpts(0));
  return res;
}
