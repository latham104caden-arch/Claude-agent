import Link from "next/link";
import type { ProductSummary } from "../../lib/catalog";
import { money } from "../../lib/format";
import { Vial } from "../Vial";
import { CardAction } from "./CardAction";

export function ProductCard({ p, delay = 0 }: { p: ProductSummary; delay?: number }) {
  return (
    <article className="pcard" data-reveal="" data-reveal-delay={String(delay)}>
      <div className="pcard-art">
        <Vial name={p.name} option={p.singleVariant ? p.firstOption : undefined} accent={p.accent} />
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
      </div>
      <div className="pcard-foot">
        <CardAction p={p} />
      </div>
    </article>
  );
}
