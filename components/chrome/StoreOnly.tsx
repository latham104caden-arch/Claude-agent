"use client";

import { usePathname } from "next/navigation";

/** Renders store chrome (header, footer, age gate, offers, tracking) everywhere except the team dashboard. */
export function StoreOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname?.startsWith("/admin") ? null : <>{children}</>;
}
