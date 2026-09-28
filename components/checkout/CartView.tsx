"use client";

import Link from "next/link";
import { money } from "../../lib/format";
import { useCart } from "../cart/CartProvider";
import { QtyStepper } from "../cart/QtyStepper";
import { Icon } from "../Icon";
import { Vial } from "../Vial";
import { Summary } from "./Summary";

export function CartView() {
  const { lines, ready, setQty, remove } = useCart();
  if (!ready) return <div style={{ minHeight: 320 }} />;
  if (lines.length === 0) {
    return (
      <div className="drawer-empty" style={{ padding: "80px 0 var(--section-y)" }}>
        <p>Your cart is empty.</p>
        <Link href="/shop" className="btn btn--primary">Browse Compounds <Icon name="arrow" /></Link>
      </div>
    );
  }
  return (
    <div className="cart-page">
      <div className="card">
        {lines.map((l) => (
          <div className="line" key={l.sku}>
            <div className="line-art"><Vial name={l.name} className="mini-vial" /></div>
            <div>
              <Link href={`/product/${l.slug}`} className="line-name">{l.name}</Link>
              <div className="line-opt">{l.option} · {money(l.price)} each</div>
              <QtyStepper value={l.qty} onChange={(q) => setQty(l.sku, q)} label={l.name} />
            </div>
            <div>
              <div className="line-price">{money(l.price * l.qty)}</div>
              <button type="button" className="line-remove" onClick={() => remove(l.sku)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <Summary>
        <Link href="/checkout" className="btn btn--primary btn--block">Proceed to Checkout <Icon name="arrow" /></Link>
      </Summary>
    </div>
  );
}
