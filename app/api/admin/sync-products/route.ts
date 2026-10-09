import { NextResponse } from "next/server";
import { currentAdmin } from "../../../../lib/admin";
import { syncCatalog } from "../../../../lib/omnisend-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Team-only: pushes the site's categories and products (each size as a
 * variant, SKU, price, image, link) to Omnisend's product catalog. Safe to run
 * again after adding products or changing prices.
 */
export async function POST() {
  if (!(await currentAdmin())) return NextResponse.json({ ok: false, message: "Not authorized." }, { status: 401 });
  const key = process.env.OMNISEND_API_KEY;
  if (!key) return NextResponse.json({ ok: false, message: "OMNISEND_API_KEY isn't set." }, { status: 503 });
  try {
    const r = await syncCatalog(key);
    const parts = [
      `Synced ${r.products} product${r.products === 1 ? "" : "s"} in ${r.categories} categor${r.categories === 1 ? "y" : "ies"} to Omnisend.`,
      r.retired ? `Marked ${r.retired} product${r.retired === 1 ? "" : "s"} no longer on the site as not available.` : "",
      r.failed.length ? `Failed: ${r.failed.slice(0, 8).join(", ")}${r.failed.length > 8 ? ` and ${r.failed.length - 8} more` : ""}.` : "",
    ];
    return NextResponse.json({ ok: r.failed.length === 0, message: parts.filter(Boolean).join(" ") });
  } catch (err) {
    console.error("[admin/sync-products]", err);
    return NextResponse.json({ ok: false, message: "Couldn't reach Omnisend. Try again." }, { status: 502 });
  }
}
