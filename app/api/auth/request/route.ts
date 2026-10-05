import { NextResponse } from "next/server";
import { CHALLENGE_COOKIE, EMAIL, authConfigured, cookieOpts, newChallenge, type Profile } from "../../../../lib/auth";
import { toE164 } from "../../../../lib/omnisend";
import { sendSignInCode } from "../../../../lib/email";

export const runtime = "nodejs";

/** Emails a sign-in code and sets the short-lived challenge cookie. */
export async function POST(req: Request) {
  if (!authConfigured()) return NextResponse.json({ ok: false, message: "Accounts aren't connected yet." }, { status: 503 });
  let email = "";
  let profile: Profile = {};
  try {
    const b = await req.json();
    email = String(b?.email ?? "").trim().toLowerCase();
    const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n) || undefined;
    profile = { firstName: s(b?.firstName, 60), lastName: s(b?.lastName, 60), phone: s(b?.phone, 30), emailOptIn: b?.emailOptIn === true, smsOptIn: b?.smsOptIn === true };
  } catch {}
  if (!EMAIL.test(email) || email.length > 254) return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });

  if (profile.smsOptIn && !profile.phone) return NextResponse.json({ ok: false, message: "Add your phone number to get texts, or untick the text box." }, { status: 400 });
  if (profile.phone && !toE164(profile.phone)) return NextResponse.json({ ok: false, message: "Please enter a valid US phone number, or leave it blank." }, { status: 400 });
  const { code, token, maxAge } = newChallenge(email, profile);
  if (!(await sendSignInCode(email, code))) {
    return NextResponse.json({ ok: false, message: "Couldn't send the code right now. Please try again." }, { status: 502 });
  }
  const res = NextResponse.json({ ok: true, message: `We sent a code to ${email}.` });
  res.cookies.set(CHALLENGE_COOKIE, token, cookieOpts(maxAge));
  return res;
}
