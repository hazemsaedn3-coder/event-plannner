"use client";

import { useState } from "react";

/** Native share sheet where available, otherwise copies the link. */
export function ShareButton({ url, title, label, copied }: { url: string; title: string; label: string; copied: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (navigator.share) {
          await navigator.share({ title, url }).catch(() => undefined);
          return;
        }
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt(label, url);
        }
      }}
      className="f-body flex h-11 items-center gap-1.5 rounded-full border border-[var(--line)] px-4 text-[15px]"
      aria-label={`${label}: ${title}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="18" cy="5.5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="18.5" r="2.5" />
        <path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" />
      </svg>
      {done ? copied : label}
    </button>
  );
}
