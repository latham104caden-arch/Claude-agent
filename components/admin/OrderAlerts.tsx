"use client";

import { useEffect, useState } from "react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function vapidKey(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const supported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
// A browser has one push subscription (drop alerts may use it too), so remember team sign-up separately.
const FLAG = "rr-team-alerts";
const flag = (v?: boolean) => {
  try {
    if (v === undefined) return localStorage.getItem(FLAG) === "1";
    if (v) localStorage.setItem(FLAG, "1"); else localStorage.removeItem(FLAG);
  } catch {}
  return !!v;
};
const standalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Turns new-order push alerts on or off for this device (phone or computer). */
export function OrderAlerts({ devices }: { devices: number | null }) {
  const [state, setState] = useState<"loading" | "on" | "off" | "unsupported" | "ios-install" | "not-configured">("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!VAPID) { setState("not-configured"); return; }
    if (!supported()) { setState(isIOS() && !standalone() ? "ios-install" : "unsupported"); return; }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub && Notification.permission === "granted" && flag() ? "on" : "off");
    }).catch(() => setState("unsupported"));
  }, []);

  const call = async (action: string, subscription?: PushSubscriptionJSON) => {
    const res = await fetch("/api/admin/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, subscription }) });
    const data = await res.json().catch(() => ({}));
    setMsg(data.message ?? (res.ok ? "Done." : "Something went wrong."));
    return res.ok;
  };

  const turnOn = async () => {
    setBusy(true); setMsg("");
    try {
      if ((await Notification.requestPermission()) !== "granted") { setMsg("Notifications are blocked for this site. Allow them in your browser or phone settings, then try again."); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey(VAPID) }));
      if (await call("on", sub.toJSON())) { flag(true); setState("on"); }
    } catch { setMsg("Couldn't turn on alerts on this device."); }
    finally { setBusy(false); }
  };

  const turnOff = async () => {
    setBusy(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (!sub || (await call("off", sub.toJSON()))) { flag(false); setState("off"); }
    } finally { setBusy(false); }
  };

  const test = async () => { setBusy(true); setMsg(""); try { await call("test"); } finally { setBusy(false); } };

  return (
    <section className="card adm-alerts" aria-label="Order alerts">
      <div>
        <h2 className="h4">New-order alerts</h2>
        <p className="muted">
          A notification on this device the moment an order is paid.
          {devices !== null ? ` ${devices} team device${devices === 1 ? "" : "s"} signed up.` : ""}
        </p>
      </div>
      <div className="adm-alerts-actions">
        {state === "on" ? (
          <>
            <span className="badge">On for this device</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={test} disabled={busy}>Send a test</button>
            <button type="button" className="link-btn" onClick={turnOff} disabled={busy}>Turn off</button>
          </>
        ) : state === "off" ? (
          <button type="button" className="btn btn--dark btn--sm" onClick={turnOn} disabled={busy}>{busy ? "Turning on…" : "Turn on for this device"}</button>
        ) : state === "ios-install" ? (
          <p className="muted">On iPhone: tap Share → Add to Home Screen, open the dashboard from the home-screen icon, then turn alerts on here.</p>
        ) : state === "not-configured" ? (
          <p className="muted">Push isn&apos;t set up on this deployment (NEXT_PUBLIC_VAPID_PUBLIC_KEY missing).</p>
        ) : state === "unsupported" ? (
          <p className="muted">This browser can&apos;t receive alerts. Use Chrome, Edge or Firefox on a computer, Chrome on Android, or the home-screen app on iPhone.</p>
        ) : null}
      </div>
      {msg ? <p className="form-msg adm-alerts-msg" role="status">{msg}</p> : null}
    </section>
  );
}
