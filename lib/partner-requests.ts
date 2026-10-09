/**
 * Research Partner requests, kept in the private Vercel Blob store
 * (partner-requests/) so none is lost if an email bounces. They hold a lab's
 * contact details, so they're written private only, never to a public store.
 * Read back in /admin, where the team approves them (lib/partner-approvals.ts).
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
  /** Set when the team approves it: the private checkout link's token. */
  approval?: { token: string; at: string; expiresAt: string; emailed: boolean; paidAt?: string };
};

/** A stored request plus its Blob pathname (its id). */
export type PartnerRequestRow = StoredPartnerRequest & { id: string };

export async function readPrivateJson<T>(pathname: string): Promise<T | null> {
  try {
    const r = await get(pathname, { access: "private" });
    return r && r.statusCode === 200 && r.stream ? (JSON.parse(await new Response(r.stream).text()) as T) : null;
  } catch {
    return null;
  }
}

export async function writePrivateJson(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
}

export const isRequestId = (id: unknown): id is string => typeof id === "string" && id.startsWith(PREFIX) && /^[\w/.-]+\.json$/.test(id) && !id.includes("..");

export async function savePartnerRequest(r: Omit<StoredPartnerRequest, "at">): Promise<boolean> {
  if (!storageReady()) return false;
  const at = new Date().toISOString();
  try {
    await writePrivateJson(`${PREFIX}${at.replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}.json`, { at, ...r });
    return true;
  } catch (err) {
    console.error("[partner] save failed", err);
    return false;
  }
}

export async function getPartnerRequest(id: string): Promise<StoredPartnerRequest | null> {
  return isRequestId(id) ? readPrivateJson<StoredPartnerRequest>(id) : null;
}

export async function updatePartnerRequest(id: string, r: StoredPartnerRequest): Promise<void> {
  if (!isRequestId(id)) throw new Error("Bad request id");
  await writePrivateJson(id, r);
}

/** Newest first. */
export async function recentPartnerRequests(limit = 25): Promise<PartnerRequestRow[] | null> {
  if (!storageReady()) return null;
  try {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
    const newest = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname)).slice(0, limit);
    const rows = await Promise.all(newest.map(async (b) => {
      const r = await readPrivateJson<StoredPartnerRequest>(b.pathname);
      return r ? { ...r, id: b.pathname } : null;
    }));
    return rows.filter((r): r is PartnerRequestRow => !!r);
  } catch (err) {
    console.error("[partner] list failed", err);
    return null;
  }
}
