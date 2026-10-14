"use client";

import Link from "next/link";
import { useEffect } from "react";
import { money } from "../../lib/format";
import { Icon } from "../Icon";
import { Vial } from "../Vial";
import { useCart } from "./CartProvider";
import { QtyStepper } from "./QtyStepper";
import { freeShippingAt, giftFor } from "../../lib/gift";
import { bogoLive, bogoQuote } from "../../lib/bogo";

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

  const deal = bogoLive() ? bogoQuote(lines) : null;
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
            <p className="drawer-ship-line">{toFree > 0 ? <>You&apos;re <b>{money(toFree)}</b> away from free shipping</> : <b>Free shipping unlocked</b>}</p>
            <div className="meter"><i style={{ width: `${pct}%` }} /></div>
            {gift ? (
              <p className="drawer-deal"><Icon name="gift" /><span>{gift.unlocked
                ? <><b>Free {gift.product.name}</b> added at checkout</>
                : <>Add <b>{money(gift.toGo)}</b> for a free {gift.product.name}</>}</span></p>
            ) : null}
            {deal ? (
              <p className="drawer-deal drawer-deal--bogo"><Icon name="ghost" /><span>{deal.tier
                ? <><b>{deal.free.length} free with BOGO</b> (−{money(deal.amount)}){deal.next ? <> · add {deal.toNext} for {deal.next.get} free</> : null}</>
                : <><b>BOGO:</b> add {deal.toNext} more vial{deal.toNext === 1 ? "" : "s"}, get 1 free</>}</span></p>
            ) : null}
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
            <div className="drawer-actions">
              <Link href="/checkout" className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
                Checkout <Icon name="arrow" />
              </Link>
              <Link href="/cart" className="btn btn--ghost btn--block" onClick={() => setOpen(false)}>View Cart</Link>
            </div>
            <p className="drawer-note">Shipping and taxes calculated at checkout. For research use only.</p>
          </div>
        ) : null}
      </aside>
    </>
  );
}
