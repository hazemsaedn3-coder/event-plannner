"use client";

import { useState } from "react";

export function CopyLink({ value, label, done }: { value: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt(label, value);
        }
      }}
      className="rounded-full border border-[#d9c9a8] px-3 py-2 text-[13px] text-[#7a6a55]"
    >
      {copied ? done : label}
    </button>
  );
}
