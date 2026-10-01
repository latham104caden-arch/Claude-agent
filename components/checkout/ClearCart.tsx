"use client";

import { useEffect } from "react";
import { useCart } from "../cart/CartProvider";

/** Empties the cart once, after a confirmed payment. */
export function ClearCart() {
  const { ready, clear } = useCart();
  useEffect(() => { if (ready) clear(); }, [ready, clear]);
  return null;
}
