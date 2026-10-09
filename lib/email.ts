import type Stripe from "stripe";
import { LOGO_PNG_BASE64 } from "./email-logo";

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
  const code = session.metadata?.reward_code || session.metadata?.sale_code || session.metadata?.first_order_code || session.metadata?.adz_code || (session.metadata?.bulk_tier ? `bulk ${session.metadata.bulk_tier}+` : undefined);

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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "Idempotency-Key": `order-confirmation/${session.id}` },
    body: JSON.stringify({
      from: process.env.RESEND_ORDERS_FROM || "Revised Research <orders@revisedresearch.com>",
      to: [to],
      reply_to: "support@revisedresearch.com",
      subject: `Order ${number} confirmed`,
      html,
      text,
      attachments: [LOGO_ATTACHMENT],
    }),
    cache: "no-store",
  });
  if (!res.ok) console.error("[email] order confirmation", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export type PartnerRequestEmail = {
  contact: { name: string; email: string; phone?: string; organization?: string; notes?: string };
  lines: { name: string; option: string; sku: string; qty: number; price: number }[];
  quote: { vials: number; percent: number; regular: number; savings: number; partner: number; percentOff: number };
};

/**
 * Research Partner pricing request (owner-approved 2026-10-09): goes to the
 * team's support inbox with the lab's kit and the partner quote; replying
 * answers the lab directly. Nothing is sent to the requester.
 */
export async function sendPartnerRequest(r: PartnerRequestEmail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const money = (n: number) => `$${n.toFixed(2)}`;
  const c = r.contact;
  const rows = r.lines.map((l) => `<tr><td style="padding:6px 0">${l.qty} × ${esc(l.name)} (${esc(l.option)})<br><span style="color:#5A6A7E;font-size:12px">${esc(l.sku)}</span></td><td style="padding:6px 0;text-align:right">${money(l.price * l.qty)}</td></tr>`).join("");
  const sum = (label: string, value: string, strong = false) => `<tr><td style="padding:4px 0;${strong ? "font-weight:700" : ""}">${label}</td><td style="padding:4px 0;text-align:right;${strong ? "font-weight:700" : ""}">${value}</td></tr>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#223044">
<p style="margin:0 0 6px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#3F5874">Research Partner request</p>
<h1 style="margin:0 0 16px;font-size:22px">${r.quote.vials}-vial kit · ${r.quote.percent}% tier</h1>
<p style="margin:0 0 4px"><b>${esc(c.name)}</b>${c.organization ? ` · ${esc(c.organization)}` : ""}</p>
<p style="margin:0 0 4px"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a>${c.phone ? ` · ${esc(c.phone)}` : ""}</p>
${c.notes ? `<p style="margin:12px 0;padding:12px;background:#ECF1F6;border-radius:8px;white-space:pre-wrap">${esc(c.notes)}</p>` : ""}
<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">${rows}</table>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #CFD9E4;font-size:14px">
${sum("Regular price", money(r.quote.regular))}
${sum(`Partner savings (${r.quote.percent}% on compounds)`, `−${money(r.quote.savings)}`)}
${sum("Partner price", money(r.quote.partner), true)}
${sum("Saving overall", `${r.quote.percentOff}%`)}
</table>
<p style="margin:20px 0 0;font-size:12px;color:#5E7894">Shipping and tax not included. Prices re-checked against the live catalog when the request was sent. Reply to this email to answer the lab.</p></div>`;
  const text = [
    `Research Partner request: ${r.quote.vials}-vial kit (${r.quote.percent}% tier)`,
    `${c.name}${c.organization ? ` · ${c.organization}` : ""}`, c.email + (c.phone ? ` · ${c.phone}` : ""),
    ...(c.notes ? ["", `Notes: ${c.notes}`] : []), "",
    ...r.lines.map((l) => `${l.qty} x ${l.name} (${l.option}) [${l.sku}]  ${money(l.price * l.qty)}`), "",
    `Regular price: ${money(r.quote.regular)}`, `Partner savings: -${money(r.quote.savings)}`, `Partner price: ${money(r.quote.partner)} (${r.quote.percentOff}% off overall)`,
  ].join("\n");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_ORDERS_FROM || "Revised Research <orders@revisedresearch.com>",
      to: ["support@revisedresearch.com"],
      reply_to: c.email,
      subject: `Partner pricing request: ${r.quote.vials} vials · ${c.name}`,
      html, text,
    }),
    cache: "no-store",
  });
  if (!res.ok) console.error("[email] partner request", res.status, await res.text().catch(() => ""));
  return res.ok;
}
