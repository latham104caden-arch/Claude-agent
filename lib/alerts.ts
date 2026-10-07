import type Stripe from "stripe";
import { firstTime, sendToAll, senderReady, TEAM_PREFIX } from "./push";

const usd = (cents: number | null | undefined) => `$${((cents ?? 0) / 100).toFixed(2)}`;

/**
 * Pings every team device that turned on order alerts in /admin. Called from
 * the Stripe webhook once an order is paid; sent at most once per order.
 */
export async function alertTeamNewOrder(session: Stripe.Checkout.Session): Promise<void> {
  if (!senderReady() || session.payment_status !== "paid") return;
  if (!(await firstTime(`order-alert/${session.id}`))) return;

  const items = (session.line_items?.data ?? []).reduce((n, li) => n + (li.quantity ?? 1), 0);
  const name = session.collected_information?.shipping_details?.name ?? session.customer_details?.name ?? "";
  const first = name.split(/\s+/)[0] ?? "";
  const lastInitial = name.split(/\s+/)[1]?.[0];
  const a = session.collected_information?.shipping_details?.address ?? session.customer_details?.address;
  const m = session.metadata ?? {};
  const code = m.sale_code || m.first_order_code || m.reward_code || m.adz_code || (m.bulk_tier ? `bulk ${m.bulk_tier}+` : "");
  const body = [
    `${items} item${items === 1 ? "" : "s"}`,
    first ? `${first}${lastInitial ? ` ${lastInitial}.` : ""}` : null,
    a?.city && a?.state ? `${a.city}, ${a.state}` : a?.state ?? null,
    code ? `code ${code}` : null,
  ].filter(Boolean).join(" · ");

  const result = await sendToAll(
    { title: `New order ${usd(session.amount_total)}${session.livemode ? "" : " (test)"}`, body, url: `/admin/orders?q=${session.id.slice(-8).toUpperCase()}`, tag: `order-${session.id}` },
    TEAM_PREFIX,
  );
  if (result.failed) console.error("[alerts] order alert failed for some devices", result);
}
