import { NextResponse } from "next/server";
import { CHALLENGE_COOKIE, EMAIL, authConfigured, cookieOpts, newChallenge } from "../../../../lib/auth";
import { sendSignInCode } from "../../../../lib/email";

export const runtime = "nodejs";

/** Emails a sign-in code and sets the short-lived challenge cookie. */
export async function POST(req: Request) {
  if (!authConfigured()) return NextResponse.json({ ok: false, message: "Accounts aren't connected yet." }, { status: 503 });
  let email = "";
  try { email = String((await req.json())?.email ?? "").trim().toLowerCase(); } catch {}
  if (!EMAIL.test(email) || email.length > 254) return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });

  const { code, token, maxAge } = newChallenge(email);
  if (!(await sendSignInCode(email, code))) {
    return NextResponse.json({ ok: false, message: "Couldn't send the code right now. Please try again." }, { status: 502 });
  }
  const res = NextResponse.json({ ok: true, message: `We sent a code to ${email}.` });
  res.cookies.set(CHALLENGE_COOKIE, token, cookieOpts(maxAge));
  return res;
}
