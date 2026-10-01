"use client";

import { useEffect, useState } from "react";

const UNITS = [["Days", 86400], ["Hours", 3600], ["Minutes", 60], ["Seconds", 1]] as const;

/** Live countdown to the next COA batch. Renders dashes until mounted so server and client HTML match. */
export function CoaCountdown({ at }: { at: string }) {
  const target = Date.parse(at);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = now === null ? null : Math.max(0, Math.floor((target - now) / 1000));
  return (
    <div className="coa-count" role="timer" aria-live="off">
      <p className="eyebrow">New COAs on the way</p>
      {left === 0 ? (
        <p className="coa-count-done">Publishing now. Check back shortly.</p>
      ) : (
        <div className="coa-count-tiles">
          {UNITS.map(([label, secs]) => {
            const v = left === null ? null : Math.floor(left / secs) % (secs === 86400 ? 1e9 : secs === 3600 ? 24 : 60);
            return (
              <div className="coa-count-tile" key={label}>
                <b>{v === null ? "--" : String(v).padStart(2, "0")}</b>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
