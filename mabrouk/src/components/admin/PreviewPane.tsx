"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ShowcaseTemplate } from "@/catalog/types";

/**
 * Phone-sized live preview. Sends the unsaved design to the preview frame
 * (same origin, postMessage) and the frame re-renders it, so every edit is
 * visible within a moment, before saving.
 */
export function PreviewPane({ template, mode = "demo", openHref, footer }: { template: ShowcaseTemplate; mode?: "demo" | "live"; openHref?: string; footer?: ReactNode }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<"phone" | "tablet">("phone");
  const latest = useRef({ template, mode });

  useEffect(() => {
    latest.current = { template, mode };
  });

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === "mbk-preview-ready") {
        setReady(true);
        frame.current?.contentWindow?.postMessage({ type: "mbk-preview", ...latest.current }, window.location.origin);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => {
      frame.current?.contentWindow?.postMessage({ type: "mbk-preview", template, mode }, window.location.origin);
    }, 450);
    return () => window.clearTimeout(id);
  }, [template, mode, ready]);

  const w = device === "phone" ? 375 : 600;
  const h = device === "phone" ? 740 : 820;
  const scale = device === "phone" ? 0.9 : 0.58;

  return (
    <div className="rounded-3xl border border-[#E7DCC6] bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="flex items-center gap-2 text-[13px] font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live preview
        </span>
        <span className="flex items-center gap-1 text-[12px]">
          {(["phone", "tablet"] as const).map((d) => (
            <button key={d} type="button" onClick={() => setDevice(d)} className={`rounded-full px-2.5 py-1 ${device === d ? "bg-[#2A2420] text-white" : "border border-[#E1D5BE]"}`}>
              {d === "phone" ? "Phone" : "Tablet"}
            </button>
          ))}
          {openHref && (
            <a href={openHref} target="_blank" className="ms-1 text-[13px] text-[#B08A45] underline">
              Open ↗
            </a>
          )}
        </span>
      </div>
      <div className="mx-auto overflow-hidden rounded-[28px] border-[6px] border-[#1b1714]" style={{ width: w * scale + 12, height: h * scale + 12 }}>
        <iframe ref={frame} title="Live preview" src="/admin/live-preview" className="origin-top-left border-0" style={{ width: w, height: h, transform: `scale(${scale})` }} />
      </div>
      {footer}
    </div>
  );
}
