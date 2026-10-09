"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";

type Props = { items: string[]; deal?: { items: string[]; endsAt: string } };

/** The scrolling bar itself. The list is doubled so the loop is seamless. */
export function AnnounceBar({ items, deal }: Props) {
  // Prerendered pages keep the deal version after it ends, so drop it in the browser at the end time.
  const [live, setLive] = useState(!!deal);
  useEffect(() => {
    if (!deal) return;
    const left = Date.parse(deal.endsAt) - Date.now();
    if (left <= 0) { setLive(false); return; }
    const id = setTimeout(() => setLive(false), Math.min(left, 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, [deal]);

  const list = live && deal ? deal.items : items;
  const dealCount = live && deal ? 2 : 0;
  return (
    <div className={"announce" + (live ? " announce--deal" : "")} role="region" aria-label="Store highlights">
      <p className="sr-only">{list.join(" · ")}</p>
      <div className="announce-track" aria-hidden="true">
        {[...list, ...list].map((t, i) => (
          <span className={"announce-item" + (i % list.length < dealCount ? " announce-item--deal" : "")} key={i}>
            <Icon name={i % list.length < dealCount ? "gift" : "check"} strokeWidth={i % list.length < dealCount ? 2 : 2.6} />{t}
          </span>
        ))}
      </div>
    </div>
  );
}
