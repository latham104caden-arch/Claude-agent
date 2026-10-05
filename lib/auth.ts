import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Passwordless sign-in without a database. A one-time code is emailed
 * (Resend); its hash rides in a short-lived signed cookie, and a successful
 * check swaps that for a 30-day signed session cookie. Orders come from Stripe
 * by email, so there are no user records to keep.
 */
export const SESSION_COOKIE = "rr_session";
export const CHALLENGE_COOKIE = "rr_challenge";
const SESSION_DAYS = 30;
const CODE_MINUTES = 10;
// No 0/O/1/I/L: easy to read from an email and type on a phone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET is not set");
  return s;
}

export function authConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32 && process.env.RESEND_API_KEY);
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

function seal(data: object): string {
  const body = b64(JSON.stringify(data));
  return `${body}.${sign(body)}`;
}

function unseal<T extends { exp: number }>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const want = Buffer.from(sign(body));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

const codeHash = (email: string, code: string, exp: number) =>
  createHash("sha256").update(`${secret()}|${email}|${code}|${exp}`).digest("base64url");

/** Normalises what the shopper typed: "k7q2 m9xp" → "K7Q2M9XP". */
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^0-9A-Z]/g, "");

/** Optional details typed on the sign-in form; carried in the challenge until the code checks out. */
/** Typed at sign-in. emailOptIn defaults on (shopper can untick); smsOptIn only when they tick it. */
export type Profile = { firstName?: string; lastName?: string; phone?: string; emailOptIn?: boolean; smsOptIn?: boolean };

/** New 8-character code (~31^8 ≈ 8.5×10^11 combinations) and the cookie that remembers it. */
export function newChallenge(email: string, profile: Profile = {}): { code: string; token: string; maxAge: number } {
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  const exp = Date.now() + CODE_MINUTES * 60_000;
  return { code, token: seal({ email, p: profile, h: codeHash(email, code, exp), exp }), maxAge: CODE_MINUTES * 60 };
}

/** Email (and form details) the challenge was issued for, if `code` matches and hasn't expired. */
export function checkChallenge(token: string | undefined, code: string): { email: string; profile: Profile } | null {
  const c = unseal<{ email: string; p?: Profile; h: string; exp: number }>(token);
  if (!c) return null;
  const want = Buffer.from(c.h);
  const got = Buffer.from(codeHash(c.email, cleanCode(code), c.exp));
  return want.length === got.length && timingSafeEqual(want, got) ? { email: c.email, profile: c.p ?? {} } : null;
}

export function newSession(email: string): { token: string; maxAge: number } {
  return { token: seal({ email, exp: Date.now() + SESSION_DAYS * 86_400_000 }), maxAge: SESSION_DAYS * 86_400 };
}

/** Signed-in email for this request, or null. */
export async function currentEmail(): Promise<string | null> {
  if (!process.env.AUTH_SECRET) return null;
  const jar = await cookies();
  return unseal<{ email: string; exp: number }>(jar.get(SESSION_COOKIE)?.value)?.email ?? null;
}

export const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
