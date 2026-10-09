import { NextResponse } from "next/server";
import { getProduct } from "../../../../lib/catalog";
import { productImage } from "../../../../lib/seo";
import { SITE } from "../../../../lib/site";

/**
 * Stable image link per product for emails (cart events are sent from the
 * browser, which only knows the slug). Redirects to the product's photo.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  return NextResponse.redirect(p ? productImage(p) : `${SITE.url}/email/vial-repair.png`, {
    status: 302,
    headers: { "cache-control": "public, max-age=86400" },
  });
}
