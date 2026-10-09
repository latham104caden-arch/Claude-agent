import type { PartnerRequestRow } from "../../lib/partner-requests";
import { SITE } from "../../lib/site";
import { ApprovePartner } from "./ApprovePartner";
import { TestEmail } from "./TestEmail";

const money = (n: number) => `$${n.toFixed(2)}`;
const at = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: process.env.ADMIN_TZ || "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Research Partner requests from /partner, newest first (saved even if the email didn't arrive). */
export function PartnerRequests({ rows }: { rows: PartnerRequestRow[] | null }) {
  const state = (r: PartnerRequestRow) => !r.approval ? null : r.approval.paidAt ? "paid" : Date.parse(r.approval.expiresAt) < Date.now() ? "expired" : "open";
  return (
    <section className="card adm-card" id="partner-requests">
      <h2 className="h4">Partner requests</h2>
      {rows === null ? <p className="muted">Storage isn&apos;t connected, so requests only arrive by email.</p>
        : !rows.length ? <p className="muted">No partner requests yet.</p>
        : (
          <table className="adm-table">
            <thead><tr><th>Lab</th><th>Kit</th><th className="num">Partner price</th><th className="num">Checkout link</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <b>{r.contact.name}</b>{r.contact.organization ? ` · ${r.contact.organization}` : ""}
                  <span className="adm-sub"><a href={`mailto:${r.contact.email}?subject=${encodeURIComponent("Your Research Partner pricing")}`}>{r.contact.email}</a>{r.contact.phone ? ` · ${r.contact.phone}` : ""}</span>
                  <span className="adm-sub">{at(r.at)} · {!r.email ? "email: not recorded" : r.email.ok ? `emailed to support@ from ${r.email.from.replace(/.*</, "").replace(">", "")}` : `email failed: ${r.email.status || "no response"} ${r.email.error}`}</span>
                  {r.contact.notes ? <span className="adm-sub">“{r.contact.notes}”</span> : null}
                </td>
                <td>{r.lines.map((l) => (
                  <span key={l.sku} className="adm-sub" style={{ display: "block" }}>{l.qty} × {l.name} ({l.option}){l.percent ? ` · ${l.percent}% off` : ""}</span>
                ))}</td>
                <td className="num">{money(r.quote.partner)}<span className="adm-sub">save {money(r.quote.savings)} of {money(r.quote.regular)}</span></td>
                <td className="num"><ApprovePartner id={r.id} url={r.approval ? `${SITE.url}/partner/checkout/${r.approval.token}` : null} status={state(r)} /></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      <TestEmail />
    </section>
  );
}
