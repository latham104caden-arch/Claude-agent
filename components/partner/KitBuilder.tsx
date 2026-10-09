"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { money } from "../../lib/format";
import { PARTNER_TIERS, partnerQuote } from "../../lib/partner";
import { useCart } from "../cart/CartProvider";
import { QtyStepper } from "../cart/QtyStepper";
import { Icon } from "../Icon";

export type KitProduct = { slug: string; name: string; variants: { sku: string; option: string; price: number }[] };
type Line = { sku: string; slug: string; name: string; option: string; price: number; qty: number };

const FIRST = PARTNER_TIERS[0];
const MAX_KIT = PARTNER_TIERS[PARTNER_TIERS.length - 1].kit;

/**
 * Research Partner kit builder (lib/partner.ts): pick vials and quantities;
 * each vial earns its own tier (10/20/30+ of the same vial). Shows the regular
 * price, the partner price and the saving in dollars and percent, then sends
 * the kit to the team. Nothing here changes checkout.
 */
export function KitBuilder({ products }: { products: KitProduct[] }) {
  const cart = useCart();
  const [lines, setLines] = useState<Line[]>([]);
  const [slug, setSlug] = useState(products[0]?.slug ?? "");
  const product = products.find((p) => p.slug === slug) ?? products[0];
  const [sku, setSku] = useState(product?.variants[0]?.sku ?? "");
  const [qty, setQty] = useState(5);

  const bySku = useMemo(() => new Map(products.flatMap((p) => p.variants.map((v) => [v.sku, { p, v }] as const))), [products]);
  const q = partnerQuote(lines);
  const quoted = new Map(q.lines.map((l) => [l.sku, l] as const));
  const ready = q.qualifying > 0;
  // Before any vial reaches a tier: what the closest vial would save at 10.
  const near = q.closest ? lines.find((l) => l.sku === q.closest!.sku) : null;
  const nearSave = q.closest ? Math.round(q.closest.price * FIRST.kit * FIRST.percent) / 100 : 0;

  const add = (addSku: string, n: number) => {
    const hit = bySku.get(addSku);
    if (!hit || n < 1) return;
    setLines((prev) => {
      const same = prev.find((l) => l.sku === addSku);
      if (same) return prev.map((l) => (l.sku === addSku ? { ...l, qty: Math.min(99, l.qty + n) } : l));
      return [...prev, { sku: addSku, slug: hit.p.slug, name: hit.p.name, option: hit.v.option, price: hit.v.price, qty: Math.min(99, n) }];
    });
  };
  const setLineQty = (s: string, n: number) => setLines((prev) => (n < 1 ? prev.filter((l) => l.sku !== s) : prev.map((l) => (l.sku === s ? { ...l, qty: n } : l))));
  const fromCart = () => { setLines([]); for (const l of cart.lines) if (bySku.has(l.sku)) add(l.sku, l.qty); };

  // Request form
  const [form, setForm] = useState({ name: "", email: "", phone: "", organization: "", notes: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || state === "sending") return;
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/partner/request", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, lines: lines.map((l) => ({ sku: l.sku, qty: l.qty })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { setState("sent"); return; }
      setError(data.message || "Something went wrong. Please try again.");
    } catch { setError("Couldn't reach the server. Check your connection and try again."); }
    setState("idle");
  };
  const field = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  if (state === "sent") {
    return (
      <div className="card kit-sent" role="status">
        <span className="kit-sent-icon"><Icon name="check" strokeWidth={2.4} /></span>
        <h3 className="h3">Request sent.</h3>
        <p>We&apos;ll email <b>{form.email}</b> within one business day to confirm lots and set up your partner pricing on this {q.vials}-vial kit (save {money(q.savings)}, {q.percentOff}% off).</p>
        <p className="muted">You can still order anything at regular prices in the meantime.</p>
        <Link href="/shop" className="btn btn--ghost">Back to the shop</Link>
      </div>
    );
  }

  return (
    <div className="kit">
      <div className="kit-main">
        <div className="card kit-add">
          <h3 className="h4">Build your kit</h3>
          <div className="kit-add-row">
            <label className="field">
              <span>Compound</span>
              <select className="select" value={product?.slug} onChange={(e) => { const p = products.find((x) => x.slug === e.target.value); setSlug(e.target.value); setSku(p?.variants[0]?.sku ?? ""); }}>
                {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Size</span>
              <select className="select" value={sku} onChange={(e) => setSku(e.target.value)}>
                {product?.variants.map((v) => <option key={v.sku} value={v.sku}>{v.option} · {money(v.price)}</option>)}
              </select>
            </label>
            <label className="field kit-qty">
              <span>Vials</span>
              <input className="input" type="number" min={1} max={99} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} />
            </label>
            <button type="button" className="btn btn--dark kit-add-btn" onClick={() => add(sku, qty)}>Add <Icon name="plus" /></button>
          </div>
          {cart.lines.length ? <button type="button" className="kit-link" onClick={fromCart}>Start from my cart ({cart.lines.reduce((n, l) => n + l.qty, 0)} items)</button> : null}

          {lines.length ? (
            <ul className="kit-lines">
              {lines.map((l) => {
                const ql = quoted.get(l.sku);
                return (
                <li key={l.sku}>
                  <span className="kit-line-name">{l.name} <small>{l.option} · {money(l.price)}</small>
                    {ql?.tier ? <em className="kit-line-tier is-on">{ql.tier.percent}% off · save {money(ql.savings)}{ql.next ? ` · ${ql.toNext} more for ${ql.next.percent}%` : ""}</em>
                      : ql?.compound ? <em className="kit-line-tier">Add {ql.toNext} more for {FIRST.percent}% off</em>
                      : <em className="kit-line-tier">Not discounted</em>}
                  </span>
                  <QtyStepper value={l.qty} onChange={(n) => setLineQty(l.sku, n)} label={l.name} />
                  <b className="kit-line-total">{money(l.price * l.qty)}</b>
                  <button type="button" className="line-remove" onClick={() => setLineQty(l.sku, 0)}>Remove</button>
                </li>
                );
              })}
            </ul>
          ) : <p className="muted kit-empty">Add vials above. Each vial (compound and size) earns its own discount: {PARTNER_TIERS.map((t) => `${t.kit}${t.kit === MAX_KIT ? "+" : ""} for ${t.percent}%`).join(", ")}.</p>}
        </div>
      </div>

      <aside className="card kit-sum" aria-live="polite">
        <p className="kit-sum-eyebrow">Your kit</p>
        <div className="kit-tiers">
          {PARTNER_TIERS.map((t) => (
            <span key={t.kit} className={"kit-tier" + (q.bestTier?.kit === t.kit ? " is-on" : "")}>
              <b>{t.percent}%</b><small>{t.kit}{t.kit === MAX_KIT ? "+" : ""} of a vial</small>
            </span>
          ))}
        </div>
        <p className="kit-count"><b>{q.vials}</b> vial{q.vials === 1 ? "" : "s"}{ready ? <> · <b>{q.qualifyingVials}</b> at partner pricing</> : null}</p>

        <dl className="kit-totals">
          <div><dt>Regular price</dt><dd>{money(q.regular)}</dd></div>
          <div><dt>Partner price</dt><dd>{ready ? money(q.partner) : "—"}</dd></div>
        </dl>
        <div className={"kit-save" + (ready ? "" : " is-preview")}>
          <span>{ready ? "You save" : near ? `Add ${q.closest!.toNext} more ${near.name} ${near.option}` : "Your saving"}</span>
          <b>{money(ready ? q.savings : nearSave)}</b>
          <small>{ready ? `${q.percentOff}% off your kit` : near ? `you'd save at ${FIRST.kit} of that vial (${FIRST.percent}% off)` : `Add ${FIRST.kit} of any one vial to unlock ${FIRST.percent}% off`}</small>
        </div>

        <form className="kit-form" onSubmit={send}>
          <p className="kit-form-head">Send us your kit and we&apos;ll set up your partner pricing.</p>
          <input className="kit-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" {...field("website")} />
          <label className="field"><span>Name</span><input className="input" required autoComplete="name" {...field("name")} /></label>
          <label className="field"><span>Email</span><input className="input" required type="email" autoComplete="email" {...field("email")} /></label>
          <label className="field"><span>Phone (optional)</span><input className="input" type="tel" autoComplete="tel" {...field("phone")} /></label>
          <label className="field"><span>Lab or organization (optional)</span><input className="input" autoComplete="organization" {...field("organization")} /></label>
          <label className="field"><span>Notes (optional)</span><textarea className="textarea" rows={3} {...field("notes")} /></label>
          {error ? <p className="form-msg is-error" role="alert">{error}</p> : null}
          <button type="submit" className="btn btn--primary btn--block" disabled={!ready || state === "sending"}>
            {state === "sending" ? "Sending…" : ready ? <>Request partner pricing <Icon name="arrow" /></> : `Add ${FIRST.kit} of one vial to request`}
          </button>
          <p className="kit-fine">Tiers are per vial: {FIRST.kit} or more of the same compound and size. Different vials don&apos;t add together. Partner pricing isn&apos;t applied at checkout; our team confirms lots and sets it up for you, usually within one business day. Reconstitution solution isn&apos;t discounted. For laboratory research use only.</p>
        </form>
      </aside>
    </div>
  );
}
