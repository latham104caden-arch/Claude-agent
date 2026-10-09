/**
 * Research Partner requests, kept in the private Vercel Blob store
 * (partner-requests/) so none is lost if an email bounces. They hold a lab's
 * contact details, so they're written private only, never to a public store.
 * Read back in /admin.
 */
import { get, list, put } from "@vercel/blob";
import { storageReady } from "./push";

const PREFIX = "partner-requests/";

export type StoredPartnerRequest = {
  at: string;
  contact: { name: string; email: string; phone: string; organization: string; notes: string };
  lines: { name: string; option: string; sku: string; qty: number; price: number; percent: number; savings: number }[];
  quote: { vials: number; qualifyingVials: number; regular: number; savings: number; partner: number; percentOff: number };
  /** How the email to the support inbox went (Resend's status and error, if any). */
  email?: { ok: boolean; status: number; error: string; from: string };
};

export async function savePartnerRequest(r: Omit<StoredPartnerRequest, "at">): Promise<boolean> {
  if (!storageReady()) return false;
  const at = new Date().toISOString();
  try {
    await put(`${PREFIX}${at.replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}.json`, JSON.stringify({ at, ...r }), {
      access: "private", addRandomSuffix: false, contentType: "application/json",
    });
    return true;
  } catch (err) {
    console.error("[partner] save failed", err);
    return false;
  }
}

/** Newest first. */
export async function recentPartnerRequests(limit = 25): Promise<StoredPartnerRequest[] | null> {
  if (!storageReady()) return null;
  try {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
    const newest = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname)).slice(0, limit);
    const rows = await Promise.all(newest.map(async (b) => {
      try {
        const r = await get(b.url, { access: "private" });
        return r && r.statusCode === 200 && r.stream ? (JSON.parse(await new Response(r.stream).text()) as StoredPartnerRequest) : null;
      } catch { return null; }
    }));
    return rows.filter((r): r is StoredPartnerRequest => !!r);
  } catch (err) {
    console.error("[partner] list failed", err);
    return null;
  }
}
