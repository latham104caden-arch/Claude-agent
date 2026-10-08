"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";

type Props = { name: string; option: string; value: string; minimum: string; endsAt: string; freeShip: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Spend $X, get a free ___" box with a live countdown (lib/gift.ts). The page
 * is prerendered, so the timer starts after load and the box removes itself
 * when the deal ends; checkout enforces the end time on the server too.
 */
export function GiftBanner({ name, option, value, minimum, endsAt, freeShip }: Props) {
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
  const parts: [string, string][] = [
    [pad(Math.floor(s / 86400)), "Days"],
    [pad(Math.floor((s % 86400) / 3600)), "Hrs"],
    [pad(Math.floor((s % 3600) / 60)), "Min"],
    [pad(s % 60), "Sec"],
  ];

  return (
    <div className="gift" data-reveal="" data-reveal-delay="240">
      <div className="gift-copy">
        <span className="gift-tag">Weekend only</span>
        <p className="gift-title">Spend {minimum}, get a free {name} <span className="gift-opt">{option}</span>{freeShip ? " + free shipping" : ""}</p>
        <p className="gift-sub">A {value} value, added to your order automatically at checkout.</p>
      </div>
      <div className="gift-side">
        <div className="gift-timer" role="timer" aria-label="Time left in the weekend offer">
          {parts.map(([n, label]) => (
            <span key={label} className="gift-unit"><b>{left === null ? "--" : n}</b><i>{label}</i></span>
          ))}
        </div>
        <Link href="/shop" className="btn btn--dark btn--sm gift-cta">Shop now <Icon name="arrow" /></Link>
      </div>
    </div>
  );
}
