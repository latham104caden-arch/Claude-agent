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
  const email = checkChallenge(jar.get(CHALLENGE_COOKIE)?.value, code);
  if (!email) return NextResponse.json({ ok: false, message: "That code is wrong or has expired. Check it, or send a new one." }, { status: 400 });

  // Account holders appear in Omnisend (no marketing opt-in implied).
  await upsertContact({ email, tags: ["account"] });

  const { token, maxAge } = newSession(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, cookieOpts(maxAge));
  res.cookies.set(CHALLENGE_COOKIE, "", cookieOpts(0));
  return res;
}
