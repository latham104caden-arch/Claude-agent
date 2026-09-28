import { NextResponse } from "next/server";

/**
 * Shared handler for forms whose provider is NOT connected yet.
 * Validates the payload so the UI contract is real, then returns 501 with an
 * honest message. Nothing is stored, emailed or texted.
 */
export async function stubSubmit(req: Request, required: string[], what: string) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }
  const missing = required.filter((k) => typeof body[k] !== "string" || !(body[k] as string).trim());
  if (missing.length) {
    return NextResponse.json({ ok: false, message: `Please fill in: ${missing.join(", ")}.` }, { status: 400 });
  }
  if ("email" in body && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
    return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });
  }
  return NextResponse.json(
    { ok: false, connected: false, message: `${what} isn't connected yet — nothing was sent.` },
    { status: 501 }
  );
}
