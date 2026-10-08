"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MediaMeta } from "@/catalog/types";

/** Uploads one or more files to /api/admin/media. Calls onUploaded for each success. */
export function MediaUploader({
  accept = "audio/*,image/*",
  label = "Upload music or images",
  onUploaded,
  compact,
}: {
  accept?: string;
  label?: string;
  onUploaded?: (m: MediaMeta) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMessage(null);
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 4 * 1024 * 1024) {
        errors.push(`${file.name}: larger than 4 MB`);
        continue;
      }
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body }).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (res?.ok && data?.media) onUploaded?.(data.media);
      else errors.push(`${file.name}: ${data?.error ?? "upload failed"}`);
    }
    setBusy(false);
    setMessage(errors.length ? errors.join(" · ") : "Uploaded ✓");
    router.refresh();
  }

  return (
    <div className={compact ? "" : "rounded-2xl border-2 border-dashed border-[#D9C9A8] bg-white/60 p-5"}>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#2A2420] px-4 py-2 text-[14px] text-white hover:bg-black">
        <input type="file" accept={accept} multiple className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files)} />
        {busy ? "Uploading…" : label}
      </label>
      {message && <p className="mt-2 text-[13px] text-[#7A6A55]">{message}</p>}
    </div>
  );
}
