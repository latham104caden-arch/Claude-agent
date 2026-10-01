import type { NextRequest } from "next/server";
import { adzMiddleware } from "@adz/next/middleware";

/**
 * adz affiliate links on our own domain: /r/<CODE> (creator link, 30-day
 * referral cookie), /tt and /ig (bio links), and ?adz_coupon=<CODE>.
 * Every other request passes straight through.
 */
export async function middleware(request: NextRequest) {
  const adz = await adzMiddleware(request);
  if (adz) return adz;
}

export const config = {
  // Every page except API routes, Next internals, and static files.
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
