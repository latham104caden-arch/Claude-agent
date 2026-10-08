"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Omnisend brand (public; it identifies the store, not a secret). */
const BRAND_ID = "6ac7c3613161ad34c2670389";

const SNIPPET = `window.omnisend = window.omnisend || [];
omnisend.push(["brandID", "${BRAND_ID}"]);
omnisend.push(["track", "$pageViewed"]);
!function(){var e=document.createElement("script");
e.type="text/javascript",e.async=!0,
e.src="https://omnisnippet1.com/inshop/launcher-v2.js";
var t=document.getElementsByTagName("script")[0];
t.parentNode.insertBefore(e,t)}();`;

type OmnisendQueue = unknown[][] & { push: (cmd: unknown[]) => number };
declare global {
  interface Window { omnisend?: OmnisendQueue }
}

/**
 * Omnisend web tracking (forms, popups, browse/cart signals). The snippet logs
 * the first page view; client-side navigations don't reload, so later page
 * views are pushed here on every route change.
 */
export function Omnisend() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.omnisend = window.omnisend || ([] as unknown as OmnisendQueue);
    window.omnisend.push(["track", "$pageViewed"]);
  }, [pathname]);

  // A plain inline script, so the snippet is in the page HTML itself (Omnisend's
  // "Verify & connect" reads the HTML; next/script would add it only after load).
  // Not id="omnisend": an element id becomes a window global and would shadow window.omnisend.
  return <script id="omnisend-snippet" dangerouslySetInnerHTML={{ __html: SNIPPET }} />;
}
