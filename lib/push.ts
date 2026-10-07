/**
 * Drop alerts (web push). Subscriptions are saved one per file in Vercel Blob
 * under push/, keyed by a hash of the endpoint, so re-subscribing overwrites.
 *
 * Env: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:),
 * and the connected Blob store: BLOB_STORE_ID (newer stores, signed in with
 * Vercel OIDC automatically) or BLOB_READ_WRITE_TOKEN (older stores).
 */
import { createHash } from "node:crypto";
import webpush from "web-push";
import { del, get, list, put } from "@vercel/blob";

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };

const PREFIX = "push/";
/** Team devices that get new-order alerts (separate from shoppers' drop alerts). */
export const TEAM_PREFIX = "team-push/";

/** Only real browser push services, so the sender can't be pointed at arbitrary URLs. */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^web\.push\.apple\.com$/, /\.push\.apple\.com$/, /^updates\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];

export function isPushSub(x: unknown): x is PushSub {
  const s = x as PushSub;
  if (!s || typeof s.endpoint !== "string" || s.endpoint.length > 1000) return false;
  if (typeof s.keys?.p256dh !== "string" || typeof s.keys?.auth !== "string") return false;
  try {
    const u = new URL(s.endpoint);
    return u.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(u.hostname));
  } catch { return false; }
}

export const storageReady = () => !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
export const senderReady = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && storageReady());

const pathFor = (endpoint: string, prefix = PREFIX) => `${prefix}${createHash("sha256").update(endpoint).digest("hex").slice(0, 40)}.json`;

/** Works with a private store (preferred) and falls back to a public one. */
const ACCESS = ["private", "public"] as const;

export async function saveSubscription(sub: PushSub, prefix = PREFIX, extra: Record<string, string> = {}): Promise<void> {
  const body = JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, at: new Date().toISOString(), ...extra });
  let last: unknown;
  for (const access of ACCESS) {
    try {
      await put(pathFor(sub.endpoint, prefix), body, { access, addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
      return;
    } catch (err) { last = err; }
  }
  throw last;
}

async function read(url: string): Promise<PushSub | null> {
  for (const access of ACCESS) {
    try {
      const r = await get(url, { access });
      if (r && r.statusCode === 200 && r.stream) {
        const s = JSON.parse(await new Response(r.stream).text());
        return isPushSub(s) ? s : null;
      }
    } catch { /* try the other access type */ }
  }
  return null;
}

/** Removes one device's subscription (e.g. a team member turning order alerts off). */
export async function removeSubscription(endpoint: string, prefix = PREFIX): Promise<void> {
  const page = await list({ prefix: pathFor(endpoint, prefix), limit: 1 });
  for (const b of page.blobs) await del(b.url);
}

/** How many devices are subscribed under a prefix. */
export async function countSubscriptions(prefix = PREFIX): Promise<number> {
  let n = 0, cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    n += page.blobs.length;
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return n;
}

/**
 * True the first time it's called for `key`, false after (a marker file in
 * Blob). Stops Stripe's webhook retries from sending the same alert twice.
 */
export async function firstTime(key: string): Promise<boolean> {
  const path = `once/${createHash("sha256").update(key).digest("hex").slice(0, 40)}.json`;
  for (const access of ACCESS) {
    try {
      await put(path, "{}", { access, addRandomSuffix: false, allowOverwrite: false, contentType: "application/json" });
      return true;
    } catch (err) {
      if (/already exists/i.test(String((err as Error)?.message ?? err))) return false;
    }
  }
  return true; // storage trouble: better a possible duplicate than a missed order
}

/** Sends one alert to every saved subscription; drops ones the browser says are gone. */
export async function sendToAll(msg: { title: string; body: string; url?: string; tag?: string }, prefix = PREFIX) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@revisedresearch.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  const payload = JSON.stringify({ title: msg.title, body: msg.body, url: msg.url || "/", ...(msg.tag ? { tag: msg.tag } : {}) });
  let sent = 0, removed = 0, failed = 0, cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 500 });
    cursor = page.hasMore ? page.cursor : undefined;
    for (const blob of page.blobs) {
      const sub = await read(blob.url);
      if (!sub) { failed++; continue; }
      try {
        await webpush.sendNotification(sub, payload, { TTL: 60 * 60 * 24 });
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) { await del(blob.url).catch(() => {}); removed++; }
        else { failed++; console.error("[push] send failed", code ?? err); }
      }
    }
  } while (cursor);
  return { sent, removed, failed };
}
