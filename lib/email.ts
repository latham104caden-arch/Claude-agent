/**
 * Transactional email via Resend (owner-approved, sign-in codes only).
 * RESEND_FROM must be on a domain verified in Resend.
 */
export async function sendSignInCode(to: string, code: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.RESEND_FROM || "Revised Research <login@revisedresearch.com>";
  const pretty = `${code.slice(0, 4)}-${code.slice(4)}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Your Revised Research sign-in code: ${pretty}`,
      text: `Your sign-in code is ${pretty}\n\nIt expires in 10 minutes. If you didn't ask for it, you can ignore this email.\n\nRevised Research · For laboratory research use only.`,
      html: `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:440px;margin:0 auto;padding:24px;color:#223044">
<p style="margin:0 0 6px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#3F5874">Revised Research</p>
<h1 style="margin:0 0 18px;font-size:22px;font-weight:600">Your sign-in code</h1>
<p style="margin:0 0 18px;font-size:32px;font-weight:700;letter-spacing:.12em;font-family:ui-monospace,Menlo,monospace">${pretty}</p>
<p style="margin:0 0 6px;font-size:14px;color:#34465E">It expires in 10 minutes. If you didn't ask for it, you can ignore this email.</p>
<p style="margin:24px 0 0;font-size:12px;color:#5E7894">For laboratory research use only.</p></div>`,
    }),
    cache: "no-store",
  });
  if (!res.ok) console.error("[email] Resend", res.status, await res.text().catch(() => ""));
  return res.ok;
}
