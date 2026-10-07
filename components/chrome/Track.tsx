"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPage, trackProductView } from "../../lib/track-client";

/** Counts each page view (and product page view) for the team funnel and Omnisend. */
export function Track() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    trackPage();
    const m = pathname.match(/^\/product\/([^/]+)$/);
    // Next frame, so the new page's product meta tags are in the head.
    if (m) requestAnimationFrame(() => trackProductView(decodeURIComponent(m[1])));
  }, [pathname]);
  return null;
}
