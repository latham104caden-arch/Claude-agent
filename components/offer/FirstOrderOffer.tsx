"use client";

/**
 * "25% off your first order" offer, unlocked by turning on drop alerts.
 *
 * Flow: offer → (iPhone) add to home screen → open the home-screen app →
 * turn on alerts → code RR25. iPhone only allows notifications from a
 * home-screen app, so the code unlocks there. Android and desktop browsers can
 * get alerts directly, so they skip straight to "turn on alerts" (Android is
 * offered the install prompt first when the browser provides one).
 *
 * The code itself is enforced at checkout (lib/discounts.ts: signed in, first
 * paid order, $100 minimum), so revealing it here is safe.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";

const CODE = "RR25";
const KEY = "rr-offer-v1";
const GATE_KEY = "rr-gate-v1";
const SNOOZE_DAYS = 7;
const AUTO_OPEN_MS = 8000;
const HIDDEN_ON = ["/checkout"];
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Step = "intro" | "install" | "alerts" | "code" | "unsupported";
type Saved = { claimed?: boolean; snoozeUntil?: number };
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const load = (): Saved => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const save = (s: Saved) => { try { localStorage.setItem(KEY, JSON.stringify({ ...load(), ...s })); } catch {} };
const gatePassed = () => { try { return !!localStorage.getItem(GATE_KEY); } catch { return true; } };

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function vapidKey(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function FirstOrderOffer() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [claimed, setClaimed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const installEvt = useRef<InstallPrompt | null>(null);

  useEffect(() => {
    const saved = load();
    setClaimed(!!saved.claimed);
    setReady(true);
    if (pushSupported()) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e: Event) => { e.preventDefault(); installEvt.current = e as InstallPrompt; };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Opened from the home screen: go straight to the alerts step. Otherwise offer once, after the entry gate.
    const standalone = isStandalone();
    const t = window.setInterval(() => {
      if (!gatePassed() || HIDDEN_ON.some((p) => location.pathname.startsWith(p))) return;
      window.clearInterval(t);
      const s = load();
      if (s.claimed) return;
      if (standalone) { setStep(pushSupported() ? "alerts" : "unsupported"); setOpen(true); }
      else if (!s.snoozeUntil || s.snoozeUntil < Date.now()) { setStep("intro"); setOpen(true); }
    }, standalone ? 600 : AUTO_OPEN_MS);
    return () => { window.clearInterval(t); window.removeEventListener("beforeinstallprompt", onPrompt); };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setNote("");
    if (!load().claimed) save({ snoozeUntil: Date.now() + SNOOZE_DAYS * 864e5 });
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, close]);

  const reopen = () => { setStep(claimed ? "code" : "intro"); setNote(""); setOpen(true); };

  const claim = async () => {
    if (isStandalone()) return setStep(pushSupported() ? "alerts" : "unsupported");
    if (isIOS()) return setStep("install");
    if (!pushSupported()) return setStep("unsupported");
    const evt = installEvt.current;
    if (evt) {
      installEvt.current = null;
      try { await evt.prompt(); await evt.userChoice; } catch {}
    }
    setStep("alerts");
  };

  const turnOnAlerts = async () => {
    if (busy) return;
    setBusy(true);
    setNote("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setNote(isIOS()
          ? "Alerts are off. Turn them on in Settings › Notifications › Revised, then tap the button again."
          : "Alerts are blocked. Allow notifications for this site in your browser settings, then tap the button again.");
        setBusy(false);
        return;
      }
      // Save the subscription so drop alerts can actually be sent. The code unlocks either way once alerts are on.
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        if (VAPID) {
          const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey(VAPID) }));
          await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) });
        }
      } catch (err) { console.error("[offer] push subscribe failed", err); }
      save({ claimed: true });
      setClaimed(true);
      setStep("code");
    } catch {
      setNote("Couldn't turn on alerts. Please try again.");
    }
    setBusy(false);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(CODE); } catch {
      const t = document.createElement("textarea"); t.value = CODE; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch {} t.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!ready || HIDDEN_ON.some((p) => pathname?.startsWith(p))) return null;

  return (
    <>
      {!open ? (
        <button type="button" className="offer-pill" onClick={reopen}>
          <Icon name="phone" /> {claimed ? `Your code: ${CODE}` : "Get my discount"}
        </button>
      ) : null}

      {open ? (
        <div className="offer" role="dialog" aria-modal="true" aria-labelledby="offer-title" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className={"offer-card" + (step === "intro" || step === "install" ? "" : " offer-card--solid")}>
            <button type="button" className="offer-x" aria-label="Close" onClick={close}><Icon name="close" /></button>

            {step !== "code" ? (
              <div className="offer-head">
                <span className="offer-ic"><Icon name={step === "alerts" ? "bell" : "phone"} /></span>
                <h2 id="offer-title">{step === "alerts" ? "One more step" : step === "unsupported" ? "Alerts aren't available here" : "Get 25% off"}</h2>
                <p>
                  {step === "intro" && "Add Revised Research to your home screen and turn on drop alerts to unlock 25% off your first order."}
                  {step === "install" && "Add the app to your home screen, then open it and turn on alerts. Your code unlocks there."}
                  {step === "alerts" && "Last step: turn on drop alerts to unlock your code."}
                  {step === "unsupported" && "This browser can't receive alerts. Open revisedresearch.com in Safari on iPhone (iOS 16.4 or later) or Chrome on Android to claim your code."}
                </p>
                {step === "alerts" ? (
                  <button type="button" className="btn btn--block offer-btn-light" onClick={turnOnAlerts} disabled={busy}>
                    <Icon name="bell" /> {busy ? "Turning on…" : "Turn on alerts"}
                  </button>
                ) : null}
                {note ? <p className="offer-note" role="alert">{note}</p> : null}
              </div>
            ) : (
              <div className="offer-head">
                <h2 id="offer-title">Your code is ready</h2>
                <div className="offer-code">
                  <span className="offer-code-label">Your code</span>
                  <b>{CODE}</b>
                  <button type="button" className="offer-copy" onClick={copy}><Icon name={copied ? "check" : "copy"} /> {copied ? "Copied" : "Copy code"}</button>
                  <p>25% off your first order. $100 minimum, one per customer. Sign in at checkout to use it. Applies instead of other codes and bulk pricing, not on top of them.</p>
                </div>
                <Link href="/shop" className="btn btn--block offer-btn-light" onClick={() => setOpen(false)}>Shop Compounds <Icon name="arrow" /></Link>
              </div>
            )}

            {step === "intro" ? (
              <div className="offer-body">
                <button type="button" className="btn btn--primary btn--block" onClick={claim}><Icon name="phone" /> Claim my discount</button>
                <button type="button" className="offer-later" onClick={close}>Not now</button>
              </div>
            ) : null}

            {step === "install" ? (
              <div className="offer-body">
                <p className="offer-steps-title">On iPhone:</p>
                <ol className="offer-steps">
                  <li><span>1</span><p>Tap the <Icon name="share" className="offer-inline" /> Share icon in Safari.</p></li>
                  <li><span>2</span><p>Scroll down and choose “Add to Home Screen”.</p></li>
                  <li><span>3</span><p>Open the app from your home screen to turn on drop alerts.</p></li>
                </ol>
              </div>
            ) : null}

            <p className="offer-ruo">Research use only · Not for human or animal consumption · 21+</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
