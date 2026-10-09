"use client";

import Link from "next/link";
import { useEffect } from "react";
import { money } from "../../lib/format";
import { Icon } from "../Icon";
import { Vial } from "../Vial";
import { useCart } from "./CartProvider";
import { PARTNER, PARTNER_TIERS, partnerQuote } from "../../lib/partner";
import { QtyStepper } from "./QtyStepper";
import { freeShippingAt, giftFor } from "../../lib/gift";

export function CartDrawer() {
  const { lines, subtotal, open, setOpen, setQty, remove } = useCart();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, setOpen]);

  const kit = partnerQuote(lines);
  const shipFreeAt = freeShippingAt();
  const toFree = Math.max(0, shipFreeAt - subtotal);
  const pct = Math.min(100, (subtotal / shipFreeAt) * 100);
  const gift = giftFor(subtotal);

  return (
    <>
      <div className={"drawer-ov" + (open ? " is-open" : "")} onClick={() => setOpen(false)} />
      <aside className={"drawer" + (open ? " is-open" : "")} role="dialog" aria-modal="true" aria-label="Cart" aria-hidden={!open}>
        <div className="drawer-head">
          <h2>Your Cart</h2>
          <button type="button" className="icon-btn" aria-label="Close cart" onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>

        {lines.length > 0 ? (
          <div className="drawer-ship">
            {toFree > 0 ? (
              <>You&apos;re <b>{money(toFree)}</b> away from free shipping.</>
            ) : (
              <><b>You&apos;ve unlocked free shipping.</b></>
            )}
            <div className="meter"><i style={{ width: `${pct}%` }} /></div>
            {gift ? (
              <p className="drawer-bulk">{gift.unlocked
                ? <><b>Free gift unlocked:</b> {gift.product.name} ({gift.variant.option}) is added at checkout.</>
                : <>Add <b>{money(gift.toGo)}</b> more for a free {gift.product.name} ({gift.variant.option}){gift.minimum >= shipFreeAt ? " and free shipping" : ""}.</>}</p>
            ) : null}
            {kit.vials >= PARTNER_TIERS[0].kit
              ? <p className="drawer-bulk"><b>{kit.vials} vials:</b> Bulk pricing would save you {money(kit.savings)} ({kit.tier!.percent}%). <Link href={PARTNER.path} onClick={() => setOpen(false)}>Request it</Link></p>
              : kit.vials >= 5 ? <p className="drawer-bulk">Stocking a lab? Kits of {PARTNER_TIERS[0].kit}+ vials get up to {PARTNER_TIERS[PARTNER_TIERS.length - 1].percent}% off. <Link href={PARTNER.path} onClick={() => setOpen(false)}>Bulk pricing</Link></p> : null}
          </div>
        ) : null}

        <div className="drawer-body">
          {lines.length === 0 ? (
            <div className="drawer-empty">
              <p>Your cart is empty.</p>
              <Link href="/shop" className="btn btn--primary" onClick={() => setOpen(false)}>
                Browse Compounds <Icon name="arrow" />
              </Link>
            </div>
          ) : (
            lines.map((l) => (
              <div className="line" key={l.sku}>
                <div className="line-art"><Vial name={l.name} className="mini-vial" /></div>
                <div>
                  <Link href={`/product/${l.slug}`} className="line-name" onClick={() => setOpen(false)}>{l.name}</Link>
                  <div className="line-opt">{l.option}</div>
                  <QtyStepper value={l.qty} onChange={(q) => setQty(l.sku, q)} label={l.name} />
                </div>
                <div>
                  <div className="line-price">{money(l.price * l.qty)}</div>
                  <button type="button" className="line-remove" onClick={() => remove(l.sku)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 ? (
          <div className="drawer-foot">
            <div className="drawer-total"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <Link href="/checkout" className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
              Checkout <Icon name="arrow" />
            </Link>
            <Link href="/cart" className="btn btn--ghost btn--block" onClick={() => setOpen(false)}>View Cart</Link>
            <p className="drawer-note">Shipping and taxes calculated at checkout. For research use only.</p>
          </div>
        ) : null}
      </aside>
    </>
  );
}
