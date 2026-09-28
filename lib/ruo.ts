/**
 * RUO naming guard.
 *
 * Carried over from the Ventra build: some compound names must never reach a
 * customer-facing surface (payment-processor risk). The catalog is filtered
 * through `enforceRuo()` before anything renders, and `scripts/check-ruo.mjs`
 * scans the source tree at check time. Fail closed: a product carrying a
 * banned name is dropped, not "fixed".
 *
 * The list lives in data/ruo-banned.json so the build script and the runtime
 * read the same thing.
 */
import banned from "../data/ruo-banned.json";
import type { Product } from "./types";

const BANNED: string[] = (banned as string[]).map((s) => s.toLowerCase());

function strings(v: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 8) return out;
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out, depth + 1));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out, depth + 1));
  return out;
}

export function hasBannedName(v: unknown): boolean {
  return strings(v).some((s) => {
    const l = s.toLowerCase();
    return BANNED.some((b) => l.includes(b));
  });
}

export function enforceRuo(products: Product[]): Product[] {
  return products.filter((p) => {
    if (!hasBannedName(p)) return true;
    // Never log the matched name itself.
    console.error(`[ruo] dropped product "${p.slug}" — contains a banned compound name`);
    return false;
  });
}
