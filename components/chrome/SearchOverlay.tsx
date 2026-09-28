"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductSummary } from "../../lib/catalog";
import { money } from "../../lib/format";
import { Icon } from "../Icon";
import { Vial } from "../Vial";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+]/g, "");

export function SearchOverlay({ items, onClose }: { items: ProductSummary[]; onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);

  useEffect(() => { input.current?.focus(); }, []);

  const hits = useMemo(() => {
    const n = norm(q);
    const list = n
      ? items.filter((p) => norm(p.name + p.subtitle + p.category).includes(n))
      : [...items].sort((a, b) => b.popularity - a.popularity);
    return list.slice(0, 8);
  }, [q, items]);

  useEffect(() => setSel(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(hits.length - 1, s + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === "Enter" && hits[sel]) { router.push(`/product/${hits[sel].slug}`); onClose(); }
  };

  return (
    <div className="search-ov" role="dialog" aria-modal="true" aria-label="Search" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-bar">
          <Icon name="search" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search compounds…"
            aria-label="Search compounds"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
          />
          <button type="button" className="icon-btn" aria-label="Close search" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="search-results" id="search-results" role="listbox">
          {hits.length === 0 ? (
            <p className="search-empty">No compounds match “{q}”.</p>
          ) : (
            hits.map((p, i) => (
              <Link
                key={p.slug}
                href={`/product/${p.slug}`}
                className="search-hit"
                role="option"
                aria-selected={i === sel}
                onMouseEnter={() => setSel(i)}
                onClick={onClose}
              >
                <Vial name={p.name} accent={p.accent} className="mini-vial" />
                <div>
                  <b>{p.name}</b>
                  <span>{p.subtitle}</span>
                </div>
                <span className="price">{p.from ? "From " : ""}{money(p.price)}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
