"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";

type Props = { name: string; tiers: { buy: number; get: number }[]; endsAt: string };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Spooky Season box under the hero (lib/bogo.ts): the three BOGO tiers, a
 * live countdown, and how to claim it (the "Get BOGO" button at checkout).
 * The page is prerendered, so the box removes itself in the browser when the
 * deal ends; checkout enforces the end time on the server too.
 */
export function SpookyBanner({ name, tiers, endsAt }: Props) {
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
    <div className="spooky" data-reveal="">
      <span className="spooky-haunt" aria-hidden="true">
        <Icon name="ghost" /><Icon name="ghost" /><Icon name="ghost" /><Icon name="pumpkin" /><Icon name="pumpkin" />
      </span>
      <Link href="/shop" className="spooky-main">
        <span className="spooky-copy">
          <span className="spooky-label">Limited time offer</span>
          <span className="spooky-title">{name}</span>
          <span className="spooky-sub">Mix any vials. The more you stock, the more come free: tap <b>Get BOGO</b> at checkout.</span>
        </span>
        <span className="spooky-arrow" aria-hidden="true"><Icon name="arrow" /></span>
      </Link>
      <ul className="spooky-tiers">
        {tiers.map((t, i) => (
          <li key={t.buy} className={"spooky-tier" + (i === tiers.length - 1 ? " is-best" : "")}>
            <span className="spooky-tier-buy">Buy {t.buy}</span>
            <b>Get {t.get} free</b>
            <small>{t.buy + t.get} vials, pay for {t.buy}</small>
          </li>
        ))}
      </ul>
      <div className="spooky-timer">
        <span className="spooky-ends">Ends in</span>
        <span className="spooky-units" role="timer" aria-label="Time left in the sale">
          {units.map(([n, unit], i) => (
            <span key={unit} className="spooky-unit-wrap">
              {i ? <i className="spooky-colon" aria-hidden="true">:</i> : null}
              <span className="spooky-unit"><b>{left === null ? "--" : n}</b><small>{unit}</small></span>
            </span>
          ))}
        </span>
      </div>
      <p className="spooky-fine">The cheapest vials in your cart are the free ones. One deal per order; doesn&apos;t combine with codes. For research use only.</p>
    </div>
  );
}
