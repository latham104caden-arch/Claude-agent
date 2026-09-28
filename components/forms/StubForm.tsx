"use client";

/**
 * Forms are built but NOT connected to any email/SMS/CRM provider yet.
 * They POST to a stub API route that validates input and returns 501, so the
 * UI flow can be tested end to end. When a provider is approved, implement it
 * inside the matching app/api/<name>/route.ts — no component change needed.
 */
import { useState } from "react";

export type StubState = "idle" | "sending" | "done" | "error";

export function useStubSubmit(endpoint: string) {
  const [state, setState] = useState<StubState>("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(json.message ?? (res.ok ? "Received." : "Something went wrong."));
      setState(res.ok ? "done" : "error");
    } catch {
      setMessage("Network error — please try again.");
      setState("error");
    }
  };

  return { state, message, submit };
}
