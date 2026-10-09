import type Stripe from "stripe";
import { LOGO_PNG_BASE64 } from "./email-logo";
import { SITE } from "./site";
import { adminEmails } from "./admin";

/**
 * Transactional email via Resend (owner-approved): account sign-in codes and
 * order confirmations. Addresses must be on a domain verified in Resend.
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


export type SendResult = { ok: boolean; status: number; error: string; from: string };

const ORDERS_FROM = () => process.env.RESEND_ORDERS_FROM || "Revised Research <orders@revisedresearch.com>";
const LOGIN_FROM = () => process.env.RESEND_FROM || "Revised Research <login@revisedresearch.com>";

/**
 * Sends from the orders@ sender; if Resend refuses that sender (4xx), retries
 * once from the sign-in sender, which is known to deliver. Returns Resend's
 * status and error text so callers can show why a send failed.
 */
export async function sendFromOrders(payload: Record<string, unknown>, idempotencyKey?: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, status: 0, error: "RESEND_API_KEY isn't set.", from: "" };
  const attempt = async (from: string, idem?: string): Promise<SendResult> => {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json", ...(idem ? { "Idempotency-Key": idem } : {}) },
        body: JSON.stringify({ ...payload, from }),
        cache: "no-store",
      });
      const error = res.ok ? "" : (await res.text().catch(() => "")).slice(0, 400);
      if (!res.ok) console.error("[email] Resend", from, res.status, error);
      return { ok: res.ok, status: res.status, error, from };
    } catch (err) {
      return { ok: false, status: 0, error: String((err as Error)?.message ?? err).slice(0, 400), from };
    }
  };
  const first = await attempt(ORDERS_FROM(), idempotencyKey);
  if (first.ok || first.status >= 500 || first.status === 0 || LOGIN_FROM() === ORDERS_FROM()) return first;
  const second = await attempt(LOGIN_FROM(), idempotencyKey ? `${idempotencyKey}/fallback` : undefined);
  return second.ok ? second : { ...second, error: `orders@ sender: ${first.status} ${first.error} | fallback: ${second.status} ${second.error}` };
}


/**
 * Logo + wordmark travel inside the email as one inline image (cid:) on its own
 * white badge, so they show without fetching anything and stay legible when a
 * mail app switches to dark mode.
 */
const LOGO = "cid:rr-logo";
const LOGO_ATTACHMENT = { filename: "revised-research.png", content: LOGO_PNG_BASE64, content_id: "rr-logo", content_type: "image/png" };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const usd = (cents: number | null | undefined) => `$${((cents ?? 0) / 100).toFixed(2)}`;

/**
 * Order confirmation for a paid Checkout Session (expand line_items). Sent from
 * both the webhook and the thank-you page; Resend's Idempotency-Key makes sure
 * the customer gets it once.
 */
export async function sendOrderConfirmation(session: Stripe.Checkout.Session): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = session.customer_details?.email;
  if (!key || !to || session.payment_status !== "paid") return false;

  const number = session.id.slice(-8).toUpperCase();
  const name = (session.customer_details?.name ?? "").split(/\s+/)[0] || "there";
  const d = session.total_details;
  const items = session.line_items?.data ?? [];
  const ship = session.collected_information?.shipping_details;
  const a = ship?.address;
  const shipTo = a ? [ship?.name, a.line1, a.line2, `${a.city ?? ""}, ${a.state ?? ""} ${a.postal_code ?? ""}`.trim()].filter(Boolean) : [];
  const code = session.metadata?.reward_code || session.metadata?.sale_code || session.metadata?.first_order_code || session.metadata?.mail_code || session.metadata?.adz_code || (session.metadata?.bulk_tier ? `bulk ${session.metadata.bulk_tier}+` : undefined);

  const row = (l: string, r: string, strong = false) =>
    `<tr><td style="padding:6px 0;font-size:14px;color:${strong ? "#223044" : "#34465E"};${strong ? "font-weight:700;" : ""}">${l}</td><td align="right" style="padding:6px 0;font-size:14px;color:#223044;${strong ? "font-weight:700;" : ""}">${r}</td></tr>`;
  const itemRows = items.map((li) => row(`${li.quantity ?? 1} × ${esc(li.description)}`, li.amount_subtotal === 0 ? "Free" : usd(li.amount_subtotal))).join("");
  const totals = [
    row("Subtotal", usd(session.amount_subtotal)),
    d?.amount_discount ? row(`Discount${code ? ` (${esc(code)})` : ""}`, `−${usd(d.amount_discount)}`) : "",
    row("Shipping", d?.amount_shipping ? usd(d.amount_shipping) : "Free"),
    d?.amount_tax ? row("Tax", usd(d.amount_tax)) : "",
    row("Total", usd(session.amount_total), true),
  ].join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"></head><body style="margin:0;background:#EEF2F6">
<div style="background:#EEF2F6;padding:28px 12px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#223044">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E1E8F0;border-radius:20px">
<tr><td style="padding:20px 22px 0"><img src="${LOGO}" width="192" height="82" alt="Revised Research" style="display:block;border:0;width:192px;height:82px;font-family:Georgia,serif;font-size:22px;color:#223044"></td></tr>
<tr><td style="padding:22px 32px 0"><p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#3F5874">Order ${number} confirmed</p>
<p style="margin:0 0 10px;font-family:Georgia,serif;font-size:26px;line-height:1.25;color:#223044">Thanks, ${esc(name)}. Your order is in.</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#34465E">We've received your payment. Shipping takes 2–3 business days, and we'll email tracking when your label is created.</p></td></tr>
<tr><td style="padding:0 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E1E8F0;border-bottom:1px solid #E1E8F0">${itemRows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">${totals}</table></td></tr>
${shipTo.length ? `<tr><td style="padding:18px 32px 0"><p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#5E7894">Shipping to</p><p style="margin:0;font-size:14px;line-height:1.6;color:#34465E">${shipTo.map(esc).join("<br>")}</p></td></tr>` : ""}
<tr><td align="center" style="padding:24px 32px 6px"><a href="https://revisedresearch.com/my-account" style="display:inline-block;background:#3F5874;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:12px 26px;border-radius:999px">View your orders</a></td></tr>
<tr><td style="padding:16px 32px 26px"><p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#5E7894">Questions? Just reply to this email or write to support@revisedresearch.com with your order number.</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#5E7894">All products are for laboratory research use only. Not for human or veterinary use.</p></td></tr>
</table></div></body></html>`;
  const text = [
    `Order ${number} confirmed`, "", `Thanks, ${name}. Your order is in. Shipping takes 2–3 business days; tracking is emailed when your label is created.`, "",
    ...items.map((li) => `${li.quantity ?? 1} x ${li.description}  ${li.amount_subtotal === 0 ? "Free" : usd(li.amount_subtotal)}`),
    "", `Total: ${usd(session.amount_total)}`, ...(shipTo.length ? ["", "Shipping to:", ...shipTo] : []),
    "", "Questions? Reply to this email or write to support@revisedresearch.com.", "For laboratory research use only.",
  ].join("\n");

  const r = await sendFromOrders({
    to: [to],
    reply_to: "support@revisedresearch.com",
    subject: `Order ${number} confirmed`,
    html,
    text,
    attachments: [LOGO_ATTACHMENT],
  }, `order-confirmation/${session.id}`);
  return r.ok;
}

export type PartnerRequestEmail = {
  contact: { name: string; email: string; phone?: string; organization?: string; notes?: string };
  /** percent/savings are this vial's own tier (0 when under 10 of it). */
  lines: { name: string; option: string; sku: string; qty: number; price: number; percent: number; savings: number }[];
  quote: { vials: number; qualifyingVials: number; regular: number; savings: number; partner: number; percentOff: number };
};

/**
 * Research Partner pricing request (owner-approved 2026-10-09): goes to the
 * team's support inbox with the lab's kit and the partner quote; replying
 * answers the lab directly. Nothing is sent to the requester.
 */
export async function sendPartnerRequest(r: PartnerRequestEmail): Promise<SendResult> {
  const money = (n: number) => `$${n.toFixed(2)}`;
  const c = r.contact;
  const tierNote = (l: PartnerRequestEmail["lines"][number]) => (l.percent ? `${l.percent}% off · −${money(l.savings)}` : "no tier (under 10 of this vial)");
  const rows = r.lines.map((l) => `<tr><td style="padding:6px 0">${l.qty} × ${esc(l.name)} (${esc(l.option)})<br><span style="color:#5A6A7E;font-size:12px">${esc(l.sku)} · ${tierNote(l)}</span></td><td style="padding:6px 0;text-align:right">${money(l.price * l.qty)}</td></tr>`).join("");
  const sum = (label: string, value: string, strong = false) => `<tr><td style="padding:4px 0;${strong ? "font-weight:700" : ""}">${label}</td><td style="padding:4px 0;text-align:right;${strong ? "font-weight:700" : ""}">${value}</td></tr>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#223044">
<p style="margin:0 0 6px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#3F5874">Research Partner request</p>
<h1 style="margin:0 0 16px;font-size:22px">${r.quote.vials} vials · save ${money(r.quote.savings)}</h1>
<p style="margin:0 0 4px"><b>${esc(c.name)}</b>${c.organization ? ` · ${esc(c.organization)}` : ""}</p>
<p style="margin:0 0 4px"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a>${c.phone ? ` · ${esc(c.phone)}` : ""}</p>
${c.notes ? `<p style="margin:12px 0;padding:12px;background:#ECF1F6;border-radius:8px;white-space:pre-wrap">${esc(c.notes)}</p>` : ""}
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">${rows}</table>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #CFD9E4;font-size:14px">
${sum("Regular price", money(r.quote.regular))}
${sum(`Partner savings (${r.quote.qualifyingVials} vials at a tier)`, `−${money(r.quote.savings)}`)}
${sum("Partner price", money(r.quote.partner), true)}
${sum("Saving overall", `${r.quote.percentOff}%`)}
</table>
<p style="margin:20px 0 0;font-size:12px;color:#5E7894">Shipping and tax not included. Prices re-checked against the live catalog when the request was sent. Reply to this email to answer the lab.</p></div>`;
  const text = [
    `Research Partner request: ${r.quote.vials} vials, save ${money(r.quote.savings)}`,
    `${c.name}${c.organization ? ` · ${c.organization}` : ""}`, c.email + (c.phone ? ` · ${c.phone}` : ""),
    ...(c.notes ? ["", `Notes: ${c.notes}`] : []), "",
    ...r.lines.map((l) => `${l.qty} x ${l.name} (${l.option}) [${l.sku}]  ${money(l.price * l.qty)}  (${tierNote(l)})`), "",
    `Regular price: ${money(r.quote.regular)}`, `Partner savings: -${money(r.quote.savings)}`, `Partner price: ${money(r.quote.partner)} (${r.quote.percentOff}% off overall)`,
  ].join("\n");
  return sendFromOrders({
    // The support inbox plus each team member directly: support@ forwarding has been losing these.
    to: [...new Set([SITE.supportEmail, ...adminEmails()])],
    reply_to: c.email,
    subject: `Partner pricing request: ${r.quote.vials} vials · ${c.name}`,
    html, text,
  });
}

export type PartnerApprovalEmail = {
  name: string;
  email: string;
  url: string;
  expiresAt: string;
  lines: { name: string; option: string; qty: number; unit: number; price: number; percent: number }[];
  regular: number;
  partner: number;
  savings: number;
};

/** Tells a lab their Research Partner kit is approved, with its private checkout link. */
export async function sendPartnerApproval(a: PartnerApprovalEmail): Promise<SendResult> {
  const money = (n: number) => `$${n.toFixed(2)}`;
  const until = new Date(a.expiresAt).toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric" });
  const first = a.name.split(/\s+/)[0] || "there";
  const rows = a.lines.map((l) => `<tr><td style="padding:6px 0">${l.qty} × ${esc(l.name)} (${esc(l.option)})${l.percent ? `<br><span style="color:#5A6A7E;font-size:12px">${l.percent}% off · ${money(l.unit)} each</span>` : ""}</td><td style="padding:6px 0;text-align:right">${money(l.unit * l.qty)}</td></tr>`).join("");
  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#223044">
<p style="margin:0 0 6px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#3F5874">Research Partner Program</p>
<h1 style="margin:0 0 12px;font-size:22px">Your partner pricing is approved</h1>
<p style="margin:0 0 16px">Hi ${esc(first)}, your kit is approved at partner pricing. Use your private link below to check out. It works once and is good until ${until}.</p>
<table style="width:100%;border-collapse:collapse;margin:8px 0 12px;font-size:14px">${rows}</table>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #CFD9E4;font-size:14px">
<tr><td style="padding:4px 0">Regular price</td><td style="padding:4px 0;text-align:right">${money(a.regular)}</td></tr>
<tr><td style="padding:4px 0">Partner savings</td><td style="padding:4px 0;text-align:right">−${money(a.savings)}</td></tr>
<tr><td style="padding:4px 0;font-weight:700">Your price</td><td style="padding:4px 0;text-align:right;font-weight:700">${money(a.partner)}</td></tr>
</table>
<p style="margin:22px 0"><a href="${esc(a.url)}" style="display:inline-block;background:#223044;color:#FFFFFF;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:600">Check out at partner pricing</a></p>
<p style="margin:0 0 6px;font-size:12px;color:#5E7894">Or paste this link: ${esc(a.url)}</p>
<p style="margin:16px 0 0;font-size:12px;color:#5E7894">Questions? Just reply to this email. For laboratory research use only. Not for human or veterinary use.</p></div>`;
  const text = [
    `Hi ${first}, your Research Partner kit is approved.`, "",
    ...a.lines.map((l) => `${l.qty} x ${l.name} (${l.option})  ${money(l.unit * l.qty)}${l.percent ? `  (${l.percent}% off)` : ""}`), "",
    `Regular price: ${money(a.regular)}`, `Partner savings: -${money(a.savings)}`, `Your price: ${money(a.partner)}`, "",
    `Check out here (works once, good until ${until}): ${a.url}`, "",
    "Questions? Reply to this email. For laboratory research use only.",
  ].join("\n");
  return sendFromOrders({
    to: [a.email],
    reply_to: SITE.supportEmail,
    subject: "Your Research Partner pricing is approved",
    html, text,
  });
}
