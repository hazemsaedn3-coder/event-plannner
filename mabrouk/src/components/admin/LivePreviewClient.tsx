"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoPayload } from "@/catalog/demo";
import { DemoView } from "@/components/demo/DemoView";

/** Receives the editor's unsaved design, asks the server to render its view model, shows it. */
export function LivePreviewClient() {
  const [payload, setPayload] = useState<DemoPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "mbk-preview") return;
      const mine = ++seq.current;
      const res = await fetch("/api/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: e.data.template, mode: e.data.mode }),
      }).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (mine !== seq.current) return; // a newer edit is on its way
      if (res?.ok && data?.payload) {
        setPayload(data.payload);
        // Updated in place: an opened envelope or chosen entrance stays open while editing.
        setError(null);
      } else {
        setError(data?.error ?? "Preview failed");
      }
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "mbk-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <>
      {payload ? <DemoView payload={payload} /> : <div className="flex min-h-[100svh] items-center justify-center bg-[#F8F2E7] text-[14px] text-[#7A6A55]">Loading preview…</div>}
      {error && <p className="fixed inset-x-3 top-3 z-[99] rounded-xl bg-rose-600 px-3 py-2 text-[13px] text-white shadow-lg">{error}</p>}
    </>
  );
}
