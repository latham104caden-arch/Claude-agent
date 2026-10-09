import { currentEmail } from "../../../../lib/auth";
import { getProduct } from "../../../../lib/catalog";
import { sendEvent } from "../../../../lib/omnisend";
import { priceCart } from "../../../../lib/orders";
import { productImage } from "../../../../lib/seo";
import { SITE } from "../../../../lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENTS = new Set(["added product to cart", "started checkout", "viewed product"]);
const ID = /^[a-z0-9-]{8,64}$/i;

/**
 * Server copy of the browser's Omnisend cart/checkout/product events for
 * signed-in shoppers. The browser snippet only records events for contacts
 * Omnisend already recognises in that browser; this sends the same event (same
 * eventID, so Omnisend keeps one) under the account email. Properties are rebuilt
 * from the catalog, never taken from the request. Always 204.
 */
export async function POST(req: Request) {
  const none = new Response(null, { status: 204 });
  let b: { event?: unknown; eventID?: unknown; cartID?: unknown; lines?: unknown; added?: unknown; addedQty?: unknown; slug?: unknown };
  try { b = JSON.parse(await req.text()); } catch { return none; }
  const event = typeof b.event === "string" && EVENTS.has(b.event) ? b.event : null;
  const eventID = typeof b.eventID === "string" && ID.test(b.eventID) ? b.eventID : null;
  if (!event || !eventID) return none;
  const email = await currentEmail();
  if (!email) return none;

  if (event === "viewed product") {
    const p = typeof b.slug === "string" ? getProduct(b.slug) : undefined;
    if (!p) return none;
    const url = `${SITE.url}/product/${p.slug}`;
    await sendEvent(event, email, { product: { id: p.slug, title: p.name, price: Math.min(...p.variants.map((v) => v.price)), currency: "USD", url, imageUrl: productImage(p) } }, eventID);
    return none;
  }

  const cart = priceCart(b.lines);
  if (!cart.ok) return none;
  const cartID = typeof b.cartID === "string" && ID.test(b.cartID) ? b.cartID : `cart-${eventID}`;
  const item = (l: (typeof cart.lines)[number], qty: number) => ({
    productID: l.product.slug, productTitle: l.product.name, productVariantID: l.variant.sku, productVariantTitle: l.variant.option,
    productSKU: l.variant.sku, productPrice: l.variant.price, productQuantity: qty,
    productURL: `${SITE.url}/product/${l.product.slug}`, productImageURL: productImage(l.product),
  });
  const added = typeof b.added === "string" ? cart.lines.find((l) => l.variant.sku === b.added) : undefined;
  const addedQty = Math.min(99, Math.max(1, Math.floor(Number(b.addedQty) || 1)));
  await sendEvent(event, email, {
    abandonedCheckoutURL: `${SITE.url}/cart`,
    cartID,
    value: Math.round(cart.subtotal * 100) / 100,
    currency: "USD",
    ...(event === "added product to cart" && added ? { addedItem: item(added, addedQty) } : {}),
    lineItems: cart.lines.map((l) => item(l, l.qty)),
  }, eventID);
  return none;
}
