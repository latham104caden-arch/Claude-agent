"use client";

/**
 * Client cart. Lives in localStorage so it survives reloads; nothing is sent
 * to a server yet. When checkout is wired, the server must re-price every line
 * from the catalog — prices held here are display-only and never trusted.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "../../lib/types";

const KEY = "rr-cart-v1";

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  ready: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const hit = prev.find((l) => l.sku === line.sku);
      if (hit) return prev.map((l) => (l.sku === line.sku ? { ...l, qty: Math.min(99, l.qty + qty) } : l));
      return [...prev, { ...line, qty }];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((sku: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.sku !== sku) : prev.map((l) => (l.sku === sku ? { ...l, qty: Math.min(99, qty) } : l))
    );
  }, []);

  const remove = useCallback((sku: string) => setLines((prev) => prev.filter((l) => l.sku !== sku)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + l.qty * l.price, 0);
    return { lines, count, subtotal, open, ready, setOpen, add, setQty, remove, clear };
  }, [lines, open, ready, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
