"use client";

import { useRouter } from "next/navigation";
import type { CartLine } from "../../lib/types";
import { useCart } from "../cart/CartProvider";

export function SignOut() {
  const router = useRouter();
  return (
    <button type="button" className="btn btn--ghost" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.refresh(); }}>
      Sign out
    </button>
  );
}

/** Puts an old order's still-available items back in the cart at today's prices. */
export function Reorder({ lines }: { lines: CartLine[] }) {
  const { add } = useCart();
  if (!lines.length) return null;
  return (
    <button type="button" className="btn btn--primary" onClick={() => lines.forEach(({ qty, ...l }) => add(l, qty))}>
      Reorder
    </button>
  );
}
