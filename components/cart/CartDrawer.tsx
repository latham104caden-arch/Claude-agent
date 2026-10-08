"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SITE } from "../../lib/site";
import { money } from "../../lib/format";
import { Icon } from "../Icon";
import { Vial } from "../Vial";
import { useCart } from "./CartProvider";
import { bulkFor, bulkLabel } from "../../lib/bulk";
import { QtyStepper } from "./QtyStepper";
import { giftFor } from "../../lib/gift";

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

  const bulk = bulkFor(lines);
  const toFree = bulk.tier ? 0 : Math.max(0, SITE.freeShippingThreshold - subtotal);
  const pct = Math.min(100, (subtotal / SITE.freeShippingThreshold) * 100);
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
            <div className="meter"><i style={{ width: `${bulk.tier ? 100 : pct}%` }} /></div>
            {bulk.tier ? <p className="drawer-bulk"><b>{bulkLabel(bulk.tier)}:</b> you save {money(bulk.amount)}.</p> : null}
            {gift ? (
              <p className="drawer-bulk">{gift.unlocked
                ? <><b>Free gift unlocked:</b> {gift.product.name} ({gift.variant.option}) is added at checkout.</>
                : <>Add <b>{money(gift.toGo)}</b> more for a free {gift.product.name} ({gift.variant.option}).</>}</p>
            ) : null}
            {bulk.next && bulk.units > 0 ? <p className="drawer-bulk">Add <b>{bulk.toNext}</b> more compound{bulk.toNext === 1 ? "" : "s"} for {bulk.tier ? "the next tier" : "bulk pricing"}. <Link href="/bulk" onClick={() => setOpen(false)}>See tiers</Link></p> : null}
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
            {bulk.tier ? <div className="drawer-total summary-discount"><span>Bulk savings</span><span>−{money(bulk.amount)}</span></div> : null}
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
