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
  subscribe?: boolean;
  consentSource?: string;
};

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
  if (c.phone && /^\+\d{8,15}$/.test(c.phone)) identifiers.push({ type: "phone", id: c.phone });
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
