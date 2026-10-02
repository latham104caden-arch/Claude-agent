/**
 * Omnisend contacts (owner-approved). Upserts by email. `subscribe: true`
 * marks email marketing as opted in; otherwise no channel status is sent, so
 * an existing subscriber is never downgraded and nobody is opted in silently.
 */
export type ContactInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  address?: { line1?: string | null; line2?: string | null; city?: string | null; state?: string | null; postalCode?: string | null; country?: string | null } | null;
  tags: string[];
  /** Email marketing opt-in. Phones are saved for contact only; no SMS opt-in is collected. */
  subscribe?: boolean;
  consentSource?: string;
};

/** US-first phone normaliser: "(405) 555-0101" → "+14055550101". Null if it can't be made E.164. */
export function toE164(raw?: string | null): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  if (s.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function upsertContact(c: ContactInput): Promise<boolean> {
  const key = process.env.OMNISEND_API_KEY;
  if (!key) return false;
  const now = new Date().toISOString();
  const identifiers: Record<string, unknown>[] = [{
    type: "email",
    id: c.email,
    ...(c.subscribe ? {
      channels: { email: { status: "subscribed", statusChangedAt: now } },
      consent: { source: c.consentSource ?? "website", createdAt: now },
    } : {}),
  }];
  const phone = toE164(c.phone);
  if (phone) identifiers.push({ type: "phone", id: phone });
  const a = c.address;
  const body = {
    identifiers,
    ...(c.firstName ? { firstName: c.firstName } : {}),
    ...(c.lastName ? { lastName: c.lastName } : {}),
    ...(a ? {
      address: [a.line1, a.line2].filter(Boolean).join(", ") || undefined,
      city: a.city || undefined, state: a.state || undefined,
      postalCode: a.postalCode || undefined, countryCode: a.country || undefined,
    } : {}),
    tags: ["source: website", ...c.tags],
  };
  try {
    const res = await fetch("https://api.omnisend.com/v5/contacts", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "X-API-KEY": key },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("[omnisend] contact", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (err) {
    console.error("[omnisend] contact request failed", err);
    return false;
  }
}

/** "Ana María Lopez" → first "Ana María", last "Lopez". */
export function splitName(name?: string | null): { firstName?: string; lastName?: string } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

/** Custom event (e.g. "earned reward") for Omnisend automations to trigger on. Never throws. */
export async function sendEvent(eventName: string, email: string, properties: Record<string, string | number | boolean>): Promise<boolean> {
  const key = process.env.OMNISEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.omnisend.com/v5/events", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "X-API-KEY": key },
      body: JSON.stringify({ eventName, origin: "api", contact: { email }, properties }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("[omnisend] event", eventName, res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (err) {
    console.error("[omnisend] event request failed", err);
    return false;
  }
}
