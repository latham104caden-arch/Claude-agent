import { getCatalog } from "../../../lib/catalog";
import { funnelReady, record } from "../../../lib/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SID = /^[a-z0-9]{8,40}$/i;
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|axios|node-fetch/i;

/**
 * Shopper funnel beacon: { type: "page" | "view" | "add", sid, slug?, qty? }.
 * Only catalog slugs are counted; bots and malformed calls are ignored. Always 204.
 */
export async function POST(req: Request) {
  if (!funnelReady() || BOT.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  let b: { type?: unknown; sid?: unknown; slug?: unknown; qty?: unknown };
  try { b = JSON.parse(await req.text()); } catch { return new Response(null, { status: 204 }); }
  const sid = typeof b.sid === "string" && SID.test(b.sid) ? b.sid : null;
  if (!sid) return new Response(null, { status: 204 });
  const slug = typeof b.slug === "string" && getCatalog().some((p) => p.slug === b.slug) ? b.slug : null;
  const qty = Math.min(99, Math.max(1, Math.floor(Number(b.qty) || 1)));
  try {
    if (b.type === "page") await record({ type: "page", sid });
    else if (b.type === "view" && slug) await record({ type: "view", sid, slug });
    else if (b.type === "add" && slug) await record({ type: "add", sid, slug, qty });
  } catch (err) { console.error("[track]", err); }
  return new Response(null, { status: 204 });
}
