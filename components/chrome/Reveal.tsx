"use client";

import { useEffect } from "react";

/**
 * Adds `.is-in` to every [data-reveal] element as it scrolls into view.
 * Content is server-rendered and fully visible without JS; the `.js` class on
 * <html> (set inline in the root layout) is what opts into the fade.
 *
 * A MutationObserver picks up elements mounted later (client navigation,
 * shop filtering) so nothing is ever left stuck at opacity 0.
 */
export function Reveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document.documentElement.classList.remove("js");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const d = Number(el.dataset.revealDelay || 0);
          if (d) el.style.transitionDelay = `${d}ms`;
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    const scan = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    };
    scan(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches("[data-reveal]:not(.is-in)")) io.observe(n);
          scan(n);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}
