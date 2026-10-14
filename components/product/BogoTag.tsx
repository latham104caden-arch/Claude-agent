"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";

/**
 * "Get free with BOGO" tag on product cards while the Spooky Season deal
 * (lib/bogo.ts) runs. Cards are prerendered, so the tag removes itself in the
 * browser at the end time; the purple card styling follows the tag (CSS :has).
 */
export function BogoTag({ endsAt }: { endsAt: string }) {
  const [live, setLive] = useState(true);
  useEffect(() => {
    const left = Date.parse(endsAt) - Date.now();
    if (left <= 0) { setLive(false); return; }
    const id = setTimeout(() => setLive(false), Math.min(left, 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, [endsAt]);
  if (!live) return null;
  return <span className="pcard-bogo-tag"><Icon name="ghost" />Get free with BOGO</span>;
}
