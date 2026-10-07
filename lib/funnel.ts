/**
 * Shopper funnel counts (visits → product views → add to cart → checkout
 * started), kept in Upstash Redis via its REST API (Vercel Marketplace →
 * Upstash for Redis; env KV_REST_API_URL/KV_REST_API_TOKEN or
 * UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN). Paid orders come from
 * Stripe, not from here.
 *
 * Per business day (ADMIN_TZ):
 *   f:{day}:pv               page views (counter)
 *   f:{day}:s:{stage}        unique sessions reaching a stage (HyperLogLog)
 *   f:{day}:views|adds|checkouts   per-product hash (slug → count / units)
 * Keys expire after 400 days. No personal data is stored: sessions are random IDs.
 */
import { dayKey } from "./metrics";

export const STAGES = ["visit", "view", "add", "checkout"] as const;
export type Stage = (typeof STAGES)[number];

const url = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const token = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
export const funnelReady = () => !!(url() && token());

const TTL = 400 * 86400;

async function pipeline(cmds: (string | number)[][]): Promise<unknown[]> {
  const res = await fetch(`${url()}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text().catch(() => "")}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  const err = out.find((r) => r.error);
  if (err) throw new Error(`Upstash: ${err.error}`);
  return out.map((r) => r.result);
}

export type FunnelEvent =
  | { type: "page"; sid: string }
  | { type: "view"; sid: string; slug: string }
  | { type: "add"; sid: string; slug: string; qty: number }
  | { type: "checkout"; sid: string; items: { slug: string; qty: number }[] };

/** Records one event. Called from /api/track (browser) and /api/checkout (server). */
export async function record(e: FunnelEvent, now = Date.now()): Promise<void> {
  if (!funnelReady()) return;
  const day = dayKey(Math.floor(now / 1000));
  const d = `f:${day}`;
  // First day anything was tracked, so the dashboard only compares orders from then on.
  const cmds: (string | number)[][] = [["SET", "f:since", day, "NX"]];
  const hll = (stage: Stage) => { cmds.push(["PFADD", `${d}:s:${stage}`, e.sid], ["EXPIRE", `${d}:s:${stage}`, TTL]); };
  const hinc = (h: string, field: string, n: number) => { cmds.push(["HINCRBY", `${d}:${h}`, field, n], ["EXPIRE", `${d}:${h}`, TTL]); };
  if (e.type === "page") { cmds.push(["INCR", `${d}:pv`], ["EXPIRE", `${d}:pv`, TTL]); hll("visit"); }
  if (e.type === "view") { hll("view"); hinc("views", e.slug, 1); }
  if (e.type === "add") { hll("add"); hinc("adds", e.slug, e.qty); }
  if (e.type === "checkout") { hll("checkout"); for (const i of e.items) hinc("checkouts", i.slug, i.qty); }
  await pipeline(cmds);
}

export type FunnelDay = { day: string; pageViews: number; sessions: Record<Stage, number> };
export type FunnelReport = {
  /** First day tracking ran ("YYYY-MM-DD"), or null if nothing yet. */
  since: string | null;
  days: FunnelDay[];
  /** Unique sessions over the whole range (a session counted once even across days). */
  sessions: Record<Stage, number>;
  pageViews: number;
  products: Map<string, { views: number; adds: number; checkouts: number }>;
};

export async function report(days: string[]): Promise<FunnelReport | null> {
  if (!funnelReady() || !days.length) return null;
  const cmds: (string | number)[][] = [];
  for (const day of days) {
    cmds.push(["GET", `f:${day}:pv`]);
    for (const s of STAGES) cmds.push(["PFCOUNT", `f:${day}:s:${s}`]);
    cmds.push(["HGETALL", `f:${day}:views`], ["HGETALL", `f:${day}:adds`], ["HGETALL", `f:${day}:checkouts`]);
  }
  for (const s of STAGES) cmds.push(["PFCOUNT", ...days.map((day) => `f:${day}:s:${s}`)]);
  cmds.push(["GET", "f:since"]);
  const out = await pipeline(cmds);
  const since = typeof out[out.length - 1] === "string" ? (out[out.length - 1] as string) : null;

  const products = new Map<string, { views: number; adds: number; checkouts: number }>();
  const bump = (raw: unknown, key: "views" | "adds" | "checkouts") => {
    const arr = Array.isArray(raw) ? (raw as string[]) : [];
    for (let i = 0; i < arr.length; i += 2) {
      const row = products.get(arr[i]) ?? { views: 0, adds: 0, checkouts: 0 };
      row[key] += Number(arr[i + 1]) || 0;
      products.set(arr[i], row);
    }
  };
  let k = 0;
  const list: FunnelDay[] = days.map((day) => {
    const pageViews = Number(out[k++]) || 0;
    const sessions = Object.fromEntries(STAGES.map((s) => [s, Number(out[k++]) || 0])) as Record<Stage, number>;
    bump(out[k++], "views"); bump(out[k++], "adds"); bump(out[k++], "checkouts");
    return { day, pageViews, sessions };
  });
  const sessions = Object.fromEntries(STAGES.map((s) => [s, Number(out[k++]) || 0])) as Record<Stage, number>;
  return { since, days: list, sessions, pageViews: list.reduce((n, d) => n + d.pageViews, 0), products };
}
