"use client";

import { useState, type ReactNode } from "react";
import type { MediaMeta } from "@/catalog/types";
import { MediaUploader } from "./MediaUploader";

/** Shared form building blocks for the admin panel. */

export type L = { ar: string; en: string };

export const input =
  "w-full rounded-xl border border-[#E1D5BE] bg-white px-3 py-2 text-[15px] outline-none transition focus:border-[#B08A45] focus:ring-2 focus:ring-[#B08A45]/15";

export function Section({ title, hint, children, id, aside }: { title: string; hint?: string; children: ReactNode; id?: string; aside?: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-3xl border border-[#E7DCC6] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-[13px] text-[#7A6A55]">{hint}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#5E5246]">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-[#A0907A]">{hint}</span>}
    </label>
  );
}

export function L10nField({ label, value, onChange, multiline }: { label: string; value: L; onChange: (v: L) => void; multiline?: boolean }) {
  const El = multiline ? "textarea" : "input";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#5E5246]">{label}</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <El
          dir="rtl"
          lang="ar"
          aria-label={`${label} (Arabic)`}
          placeholder="عربي"
          className={`${input} ${multiline ? "min-h-20" : ""}`}
          value={value.ar}
          onChange={(e) => onChange({ ...value, ar: e.target.value })}
        />
        <El
          aria-label={`${label} (English)`}
          placeholder="English"
          className={`${input} ${multiline ? "min-h-20" : ""}`}
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
        />
      </div>
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-[#E1D5BE] bg-white p-1.5 pe-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-9 w-11 cursor-pointer rounded-lg border-0 bg-transparent" />
      <span className="flex flex-col">
        <span className="text-[12px] text-[#7A6A55]">{label}</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-24 font-mono text-[13px] outline-none" aria-label={`${label} hex`} spellCheck={false} />
      </span>
    </label>
  );
}

/** iOS-style on/off switch. */
export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 transition ${checked ? "border-[#D9C08E] bg-[#FBF6EA]" : "border-[#EFE6D4] bg-white"}`}>
      <span className="min-w-0">
        <span className="block text-[14px]">{label}</span>
        {hint && <span className="block text-[12px] text-[#A0907A]">{hint}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-[#B08A45] peer-focus-visible:ring-2 peer-focus-visible:ring-[#B08A45]/40" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Pick an uploaded image (or paste an https URL). */
export function ImagePicker({ label, value, images, onChange, onUploaded }: { label: string; value: string; images: MediaMeta[]; onChange: (v: string) => void; onUploaded: (m: MediaMeta) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-[#5E5246]">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-20 w-16 rounded-lg border border-[#E1D5BE] object-cover" />
        ) : (
          <span className="flex h-20 w-16 items-center justify-center rounded-lg border border-dashed border-[#D9C9A8] text-[11px] text-[#A0907A]">none</span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <select className={input} value={images.some((m) => `/media/${m.id}` === value) ? value : ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">— Choose an uploaded image —</option>
            {images.map((m) => (
              <option key={m.id} value={`/media/${m.id}`}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <input className={`${input} min-w-0 flex-1`} placeholder="or https://… image URL" value={value.startsWith("https://") ? value : ""} onChange={(e) => onChange(e.target.value)} />
            {value && (
              <button type="button" className="rounded-full border border-[#E1D5BE] px-3 text-[13px]" onClick={() => onChange("")}>
                Remove
              </button>
            )}
          </div>
          <MediaUploader compact accept="image/*" label="Upload image" onUploaded={(m) => (onUploaded(m), onChange(`/media/${m.id}`))} />
        </div>
      </div>
    </div>
  );
}

/**
 * An ordered photo list: upload one or many, pick from the library, paste a
 * URL, reorder with arrows, remove.
 */
export function PhotoList({
  label,
  hint,
  value,
  onChange,
  images,
  onUploaded,
  max = 12,
}: {
  label: string;
  hint?: string;
  value: string[];
  /** Functional updates, so several uploads finishing in a row all land. */
  onChange: (fn: (prev: string[]) => string[]) => void;
  images: MediaMeta[];
  onUploaded: (m: MediaMeta) => void;
  max?: number;
}) {
  const [picking, setPicking] = useState(false);
  const [url, setUrl] = useState("");
  const move = (i: number, d: number) =>
    onChange((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = (src: string) => onChange((prev) => (prev.length < max && !prev.includes(src) ? [...prev, src] : prev));
  const remove = (src: string) => onChange((prev) => prev.filter((v) => v !== src));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-[#5E5246]">
          {label} <span className="font-normal text-[#A0907A]">({value.length}/{max})</span>
        </span>
        {hint && <span className="text-[12px] text-[#A0907A]">{hint}</span>}
      </div>
      {value.length > 0 ? (
        <ol className="flex flex-wrap gap-2">
          {value.map((src, i) => (
            <li key={`${src}-${i}`} className="group relative h-24 w-20 overflow-hidden rounded-xl border border-[#E1D5BE] bg-[#F6F3EE]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <span className="absolute start-1 top-1 rounded-full bg-black/60 px-1.5 text-[10px] text-white">{i + 1}</span>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1 text-white">
                <button type="button" aria-label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0} className="h-6 w-6 rounded-full hover:bg-white/20 disabled:opacity-30">
                  ←
                </button>
                <button type="button" aria-label="Remove photo" onClick={() => onChange((prev) => prev.filter((_, k) => k !== i))} className="h-6 w-6 rounded-full hover:bg-rose-500/80">
                  ✕
                </button>
                <button type="button" aria-label="Move later" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="h-6 w-6 rounded-full hover:bg-white/20 disabled:opacity-30">
                  →
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-[#D9C9A8] px-3 py-4 text-center text-[13px] text-[#A0907A]">No photos yet. The section stays hidden until you add some.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <MediaUploader compact accept="image/*" label="Upload photos" onUploaded={(m) => (onUploaded(m), add(`/media/${m.id}`))} />
        <button type="button" onClick={() => setPicking((p) => !p)} className="rounded-full border border-[#E1D5BE] px-3 py-2 text-[13px] hover:bg-[#FBF8F2]">
          {picking ? "Close library" : "Choose from library"}
        </button>
        <span className="flex min-w-[220px] flex-1 gap-1.5">
          <input className={`${input} py-1.5 text-[13px]`} placeholder="https://… image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button
            type="button"
            className="rounded-full border border-[#E1D5BE] px-3 text-[13px] disabled:opacity-40"
            disabled={!/^https:\/\/|^\/(media|demo)\//.test(url)}
            onClick={() => (add(url.trim()), setUrl(""))}
          >
            Add
          </button>
        </span>
      </div>
      {picking && (
        <div className="max-h-64 overflow-y-auto rounded-2xl border border-[#EFE6D4] bg-[#FBF8F2] p-2">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
            {images.map((m) => {
              const src = `/media/${m.id}`;
              const on = value.includes(src);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => (on ? remove(src) : add(src))}
                  className={`relative aspect-[4/5] overflow-hidden rounded-lg border-2 ${on ? "border-[#B08A45]" : "border-transparent"}`}
                  title={m.name}
                  aria-pressed={on}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                  {on && <span className="absolute end-1 top-1 rounded-full bg-[#B08A45] px-1 text-[10px] text-white">✓</span>}
                </button>
              );
            })}
            {!images.length && <span className="col-span-full p-3 text-[13px] text-[#A0907A]">The library is empty. Upload photos above.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
