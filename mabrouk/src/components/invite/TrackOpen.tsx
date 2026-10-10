"use client";

import { useEffect } from "react";

/** Counts one open per visit for designs that don't report it themselves (Farah, imported HTML). */
export function TrackOpen({ slug, locale }: { slug: string; locale: "ar" | "en" }) {
  useEffect(() => {
    const key = `mbk-open:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode: count anyway */
    }
    const body = JSON.stringify({ slug, locale });
    try {
      if (!navigator.sendBeacon?.("/api/view", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/view", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      /* analytics must never break the invitation */
    }
  }, [slug, locale]);
  return null;
}
