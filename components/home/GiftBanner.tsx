"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";

type Props = { label: string; name: string; option: string; slug: string; value: string; minimum: string; endsAt: string; freeShip: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Limited-time "spend $X, get a free ___" box with a live countdown
 * (lib/gift.ts). The page is prerendered, so the timer starts after load and
 * the box removes itself when the deal ends; checkout enforces the end time on
 * the server too.
 */
export function GiftBanner({ label, name, option, slug, value, minimum, endsAt, freeShip }: Props) {
  const end = Date.parse(endsAt);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);
  if (left === 0) return null;

  const s = Math.floor((left ?? 0) / 1000);
  const days = Math.floor(s / 86400);
  const units: [string, string][] = [
    ...(days > 0 ? [[pad(days), "Days"] as [string, string]] : []),
    [pad(Math.floor((s % 86400) / 3600)), "Hrs"],
    [pad(Math.floor((s % 3600) / 60)), "Min"],
    [pad(s % 60), "Sec"],
  ];

  return (
    <div className="gift" data-reveal="">
      <Link href="/shop" className="gift-main">
        <span className="gift-tile" aria-hidden="true"><Icon name="gift" /><b>Free</b></span>
        <span className="gift-copy">
          <span className="gift-label">{label}</span>
          <span className="gift-title">Free {name}{freeShip ? <> + <span className="gift-nowrap">Free Shipping</span></> : null}</span>
          <span className="gift-sub">
            Spend <b>{minimum}</b>, get a <b>free {name} {option}</b> (a {value} value){freeShip ? <> and <b>free shipping</b></> : null}. Added at checkout automatically, no code needed.
          </span>
          <span className="gift-chips">
            <span className="gift-chip"><Icon name="gift" />Free {name} {option}</span>
            {freeShip ? <span className="gift-chip"><Icon name="truck" />Free shipping</span> : null}
          </span>
        </span>
        <span className="gift-arrow" aria-hidden="true"><Icon name="arrow" /></span>
      </Link>
      <div className="gift-timer">
        <span className="gift-ends">Offer ends in</span>
        <span className="gift-units" role="timer" aria-label="Time left in the offer">
          {units.map(([n, unit], i) => (
            <span key={unit} className="gift-unit-wrap">
              {i ? <i className="gift-colon" aria-hidden="true">:</i> : null}
              <span className="gift-unit"><b>{left === null ? "--" : n}</b><small>{unit}</small></span>
            </span>
          ))}
        </span>
      </div>
      <p className="gift-fine">One free {name} {option} per order while the offer runs. For research use only. <Link href={`/product/${slug}`}>Product details</Link></p>
    </div>
  );
}
