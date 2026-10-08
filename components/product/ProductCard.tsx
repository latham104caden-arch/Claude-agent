import Link from "next/link";
import type { ProductSummary } from "../../lib/catalog";
import { money } from "../../lib/format";
import { Vial } from "../Vial";
import { CardAction } from "./CardAction";
import { Icon } from "../Icon";
import { giftOffer } from "../../lib/gift";

export function ProductCard({ p, delay = 0 }: { p: ProductSummary; delay?: number }) {
  // The current free-gift product (lib/gift.ts) gets the teal card and a "Get one free" tag.
  const gift = giftOffer();
  const isGift = gift?.product.slug === p.slug;
  return (
    <article className={"pcard" + (isGift ? " pcard--gift" : "")} data-reveal="" data-reveal-delay={String(delay)}>
      {isGift ? <span className="pcard-gift-tag"><Icon name="gift" />Get one free</span> : null}
      <div className="pcard-art">
        <Vial name={p.name} option={p.firstOption} accent={p.accent} />
        <div className="pcard-badges">
          {p.badge ? <span className="badge">{p.badge}</span> : null}
          {!p.inStock ? <span className="badge badge--muted">Sold out</span> : null}
        </div>
      </div>
      <div className="pcard-body">
        <span className="pcard-sub">{p.subtitle}</span>
        <h3 className="pcard-name"><Link href={`/product/${p.slug}`}>{p.name}</Link></h3>
        <p className="pcard-price">
          {p.from ? <small>From</small> : null}
          {money(p.price)}
          {p.compareAt ? <s>{money(p.compareAt)}</s> : null}
        </p>
        {isGift ? <p className="pcard-gift-note">Free {gift!.variant.option} with {money(gift!.minimum).replace(/\.00$/, "")}+ orders</p> : null}
      </div>
      <div className="pcard-foot">
        <CardAction p={p} />
      </div>
    </article>
  );
}
