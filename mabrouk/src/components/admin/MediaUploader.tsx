"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_MEDIA_BYTES, type MediaMeta } from "@/catalog/types";

const PIECE = 3 * 1024 * 1024;

/** Sends a file in pieces of 3 MB (each request stays under Vercel's 4.5 MB body limit). */
async function uploadOne(file: File, progress: (pct: number) => void): Promise<{ media: MediaMeta } | { error: string }> {
  const first = new FormData();
  first.append("file", new File([file.slice(0, PIECE)], file.name, { type: file.type }));
  first.append("total", String(file.size));
  const res = await fetch("/api/admin/media", { method: "POST", body: first }).catch(() => null);
  const data = await res?.json().catch(() => null);
  if (!res?.ok || !data?.media) return { error: data?.error ?? "upload failed" };
  const media: MediaMeta = data.media;
  for (let at = PIECE; at < file.size; at += PIECE) {
    progress(Math.round((at / file.size) * 100));
    const body = new FormData();
    body.append("file", file.slice(at, at + PIECE));
    if (at + PIECE >= file.size) body.append("last", "1");
    const r = await fetch(`/api/admin/media/${media.id}/append`, { method: "POST", body }).catch(() => null);
    if (!r?.ok) return { error: "upload interrupted. Delete the broken track below and try again" };
  }
  return { media };
}

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
      if (file.size > MAX_MEDIA_BYTES) {
        errors.push(`${file.name}: larger than 12 MB`);
        continue;
      }
      const result = await uploadOne(file, (p) => setMessage(`${file.name}: ${p}%`));
      if ("media" in result) onUploaded?.(result.media);
      else errors.push(`${file.name}: ${result.error}`);
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
