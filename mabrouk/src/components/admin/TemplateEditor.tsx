"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { createLink, deleteLink, deleteTemplate, saveTemplate } from "@/app/(admin)/admin/actions";
import { BUILTIN_TRACKS } from "@/catalog/builtin-tracks";
import type { DuoConfig, MediaMeta, PreviewLink, ShowcaseTemplate, TemplateColors } from "@/catalog/types";
import { MediaUploader } from "./MediaUploader";

type L = { ar: string; en: string };

/** Five-color presets matching the Noor themes. */
const PRESETS: Record<"ivory-gold" | "emerald-night" | "blush-rose", TemplateColors> = {
  "ivory-gold": { background: "#F8F2E7", surface: "#FFFBF4", text: "#3A2E22", accent: "#B08A45", seal: "#8C2232" },
  "emerald-night": { background: "#0E2E26", surface: "#133A30", text: "#F4EBD6", accent: "#D6B46C", seal: "#C9A253" },
  "blush-rose": { background: "#F7E6E2", surface: "#FDF4F1", text: "#55343A", accent: "#B5737C", seal: "#9E4A58" },
};

const input =
  "w-full rounded-xl border border-[#E1D5BE] bg-white px-3 py-2 text-[15px] outline-none transition focus:border-[#B08A45] focus:ring-2 focus:ring-[#B08A45]/15";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#E7DCC6] bg-white p-5">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-[13px] text-[#7A6A55]">{hint}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#5E5246]">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-[#A0907A]">{hint}</span>}
    </label>
  );
}

function L10nField({ label, value, onChange, multiline }: { label: string; value: L; onChange: (v: L) => void; multiline?: boolean }) {
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-[#E1D5BE] bg-white p-1.5 pe-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-9 w-11 cursor-pointer rounded-lg border-0 bg-transparent" />
      <span className="flex flex-col">
        <span className="text-[12px] text-[#7A6A55]">{label}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 font-mono text-[13px] outline-none"
          aria-label={`${label} hex`}
          spellCheck={false}
        />
      </span>
    </label>
  );
}

/** Pick an uploaded image (or paste an https URL). */
function ImagePicker({ label, value, images, onChange, onUploaded }: { label: string; value: string; images: MediaMeta[]; onChange: (v: string) => void; onUploaded: (m: MediaMeta) => void }) {
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

export function TemplateEditor({ initial, media: initialMedia, links: initialLinks, siteUrl }: { initial: ShowcaseTemplate; media: MediaMeta[]; links: PreviewLink[]; siteUrl: string }) {
  const router = useRouter();
  const [t, setT] = useState<ShowcaseTemplate>(initial);
  const [savedId, setSavedId] = useState(initial.id);
  const [media, setMedia] = useState(initialMedia);
  const [links, setLinks] = useState(initialLinks);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "saved" | "error"; text?: string }>({ kind: "idle" });
  const [previewKey, setPreviewKey] = useState(0);
  const dirty = useMemo(() => JSON.stringify(t) !== JSON.stringify(initial), [t, initial]);

  const audio = media.filter((m) => m.kind === "audio");
  const images = media.filter((m) => m.kind === "image");
  const set = <K extends keyof ShowcaseTemplate>(k: K, v: ShowcaseTemplate[K]) => setT((x) => ({ ...x, [k]: v }));
  const setNoor = <K extends keyof NonNullable<ShowcaseTemplate["noor"]>>(k: K, v: NonNullable<ShowcaseTemplate["noor"]>[K]) =>
    setT((x) => ({ ...x, noor: { ...x.noor!, [k]: v } }));
  const setHtml = (k: "html" | "css" | "js" | "baseUrl", v: string) => setT((x) => ({ ...x, html: { ...x.html!, [k]: v } }));
  const addMedia = (m: MediaMeta) => setMedia((list) => [m, ...list]);
  const publicUrl = `${siteUrl}/demo/${savedId}`;

  async function save() {
    setStatus({ kind: "saving" });
    const res = await saveTemplate(savedId, t);
    if (!res.ok) {
      setStatus({ kind: "error", text: res.error });
      return;
    }
    setStatus({ kind: "saved", text: "Saved ✓" });
    setPreviewKey((k) => k + 1);
    if (res.id !== savedId) {
      setSavedId(res.id);
      router.replace(`/admin/templates/${res.id}`);
    }
    router.refresh();
  }

  /* ---------------- music ---------------- */
  const tracks = [
    ...Object.entries(BUILTIN_TRACKS).map(([id, b]) => ({ id, name: `${b.title} (built-in)` })),
    ...audio.map((m) => ({ id: m.id, name: m.name })),
  ];
  const setDuo = (side: "bride" | "groom", patch: Partial<DuoConfig["bride"]>) =>
    setT((x) => ({ ...x, duo: { ...x.duo!, [side]: { ...x.duo![side], ...patch } } }));
  function toggleTrack(id: string, on: boolean) {
    const ids = on ? [...new Set([...t.music.trackIds, id])] : t.music.trackIds.filter((x) => x !== id);
    set("music", { trackIds: ids, defaultTrackId: ids.includes(t.music.defaultTrackId) ? t.music.defaultTrackId : ids[0] ?? "" });
  }

  /* ---------------- variables ---------------- */
  const varEntries = Object.entries(t.variables);
  function setVar(oldKey: string, key: string, value: string) {
    const next: Record<string, string> = {};
    for (const [k, v] of varEntries) next[k === oldKey ? key : k] = k === oldKey ? value : v;
    set("variables", next);
  }
  function detectVars() {
    const found = [...(t.html?.html ?? "").matchAll(/\{\{\s*([a-zA-Z0-9_]{1,40})\s*\}\}/g)].map((m) => m[1]);
    const next = { ...t.variables };
    for (const k of found) if (!(k in next)) next[k] = k;
    set("variables", next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-5">
        {/* Header / save bar */}
        <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center gap-2 rounded-2xl bg-[#F6F3EE]/95 px-1 py-2 backdrop-blur">
          <h1 className="me-auto min-w-0 truncate font-[family-name:var(--font-cormorant)] text-[28px]">{t.name.en || t.name.ar}</h1>
          {status.text && (
            <span role="status" className={`text-[13px] ${status.kind === "error" ? "text-rose-700" : "text-emerald-700"}`}>
              {status.text}
            </span>
          )}
          <a href={`/api/admin/templates/${savedId}/export`} className="rounded-full border border-[#E1D5BE] bg-white px-3 py-2 text-[13px]">
            Export JSON
          </a>
          <button
            type="button"
            onClick={save}
            disabled={status.kind === "saving"}
            className="rounded-full bg-[#2A2420] px-5 py-2 text-[14px] font-medium text-white hover:bg-black disabled:opacity-50"
          >
            {status.kind === "saving" ? "Saving…" : dirty ? "Save changes" : "Save"}
          </button>
        </div>

        <Section title="Basics" hint="Shown on the landing page gallery.">
          <L10nField label="Name" value={t.name} onChange={(v) => set("name", v)} />
          <L10nField label="Short description" value={t.description} onChange={(v) => set("description", v)} multiline />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="URL id" hint={`/demo/${t.id}`}>
              <input className={`${input} font-mono`} value={t.id} onChange={(e) => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
            </Field>
            <Field label="Status">
              <select className={input} value={t.status} onChange={(e) => set("status", e.target.value as ShowcaseTemplate["status"])}>
                <option value="published">Published (visible on site)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </Field>
            <Field label="Order" hint="Lower shows first">
              <input type="number" min={0} max={9999} className={input} value={t.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
            </Field>
          </div>
          <L10nField label="Order button text (WhatsApp CTA)" value={t.ctaText} onChange={(v) => set("ctaText", v)} />
        </Section>

        {t.kind !== "duo" && <Section title="Colors" hint={t.kind === "html" ? "Exposed to your HTML as --mbk-background, --mbk-surface, --mbk-text, --mbk-accent, --mbk-seal." : undefined}>
          {t.kind === "noor" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Base theme">
                <select
                  className={input}
                  value={t.noor!.baseTheme}
                  onChange={(e) => {
                    const theme = e.target.value as keyof typeof PRESETS;
                    setT((x) => ({ ...x, colors: PRESETS[theme], noor: { ...x.noor!, baseTheme: theme } }));
                  }}
                >
                  <option value="ivory-gold">Ivory Gold</option>
                  <option value="emerald-night">Emerald Night</option>
                  <option value="blush-rose">Blush Rose</option>
                </select>
              </Field>
              <Field label="Color mode" hint="Preset = the hand-tuned theme. Custom = your five colors below.">
                <select className={input} value={t.noor!.colorsMode} onChange={(e) => setNoor("colorsMode", e.target.value as "preset" | "custom")}>
                  <option value="preset">Preset theme colors</option>
                  <option value="custom">Custom colors</option>
                </select>
              </Field>
            </div>
          )}
          <div className={`flex flex-wrap gap-2 ${t.kind === "noor" && t.noor!.colorsMode === "preset" ? "pointer-events-none opacity-40" : ""}`}>
            {(["background", "surface", "text", "accent", "seal"] as const).map((k) => (
              <ColorField key={k} label={k[0].toUpperCase() + k.slice(1)} value={t.colors[k]} onChange={(v) => set("colors", { ...t.colors, [k]: v })} />
            ))}
          </div>
        </Section>}

        {t.kind === "duo" && t.duo && (
          <Section title="Two entrances" hint="Guests choose a side on the entrance screen. The bride's friends get the romantic world, the groom's friends the shaabi one; both see all the details below.">
            <L10nField label="Entrance question" value={t.duo.gateQuestion} onChange={(v) => setT((x) => ({ ...x, duo: { ...x.duo!, gateQuestion: v } }))} />
            {(["bride", "groom"] as const).map((side) => (
              <div key={side} className={`flex flex-col gap-3 rounded-2xl p-4 ${side === "bride" ? "bg-[#FCE8EE]" : "bg-[#EDE6F7]"}`}>
                <p className="text-[14px] font-semibold">{side === "bride" ? "💗 Bride's friends — romantic" : "🥁 Groom's friends — shaabi"}</p>
                <L10nField label="Entrance button" value={t.duo![side].gateLabel} onChange={(v) => setDuo(side, { gateLabel: v })} />
                <L10nField label="Big title" value={t.duo![side].title} onChange={(v) => setDuo(side, { title: v })} />
                <L10nField label="Message to this group" value={t.duo![side].message} onChange={(v) => setDuo(side, { message: v })} multiline />
                <Field label="Song for this side" hint="Also add it under Background music so the music player can switch to it.">
                  <select className={input} value={t.duo![side].trackId} onChange={(e) => setDuo(side, { trackId: e.target.value })}>
                    {tracks.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            ))}
          </Section>
        )}

        {t.kind !== "html" && t.noor && (
          <Section title="Invitation text" hint="Sample content shown in the demo. Client links can override the names and date.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Default language">
                <select className={input} value={t.noor.defaultLocale} onChange={(e) => setNoor("defaultLocale", e.target.value as "ar" | "en")}>
                  <option value="ar">Arabic</option>
                  <option value="en">English</option>
                </select>
              </Field>
              <Field label="Market">
                <select className={input} value={t.noor.market} onChange={(e) => setNoor("market", e.target.value as "EG" | "GCC" | "OTHER")}>
                  <option value="EG">Egypt</option>
                  <option value="GCC">Gulf (GCC)</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Tone">
                <select className={input} value={t.noor.tone} onChange={(e) => setNoor("tone", e.target.value as "romantic" | "formal")}>
                  <option value="romantic">Romantic</option>
                  <option value="formal">Formal (families invite)</option>
                </select>
              </Field>
            </div>
            <L10nField label="First name" value={t.noor.partner1} onChange={(v) => setNoor("partner1", v)} />
            <L10nField label="Second name" value={t.noor.partner2} onChange={(v) => setNoor("partner2", v)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name (Latin, for link previews)">
                <input className={input} value={t.noor.latin1} onChange={(e) => setNoor("latin1", e.target.value)} />
              </Field>
              <Field label="Second name (Latin)">
                <input className={input} value={t.noor.latin2} onChange={(e) => setNoor("latin2", e.target.value)} />
              </Field>
            </div>
            <L10nField label="Opening line (optional)" value={t.noor.opening} onChange={(v) => setNoor("opening", v)} />
            <L10nField label="Families / hosts line" value={t.noor.hostsLine} onChange={(v) => setNoor("hostsLine", v)} multiline />
            <L10nField label="Invitation sentence" value={t.noor.inviteLine} onChange={(v) => setNoor("inviteLine", v)} multiline />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date & time">
                <input type="datetime-local" className={input} value={t.noor.date} onChange={(e) => setNoor("date", e.target.value.slice(0, 16))} />
              </Field>
              <Field label="Time zone">
                <select className={input} value={t.noor.timeZone} onChange={(e) => setNoor("timeZone", e.target.value)}>
                  {["Africa/Cairo", "Asia/Riyadh", "Asia/Dubai", "Asia/Kuwait", "Asia/Qatar", "Asia/Bahrain", "Asia/Muscat", "Asia/Amman", "Europe/London"].map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 pt-6 text-[14px]">
                <input type="checkbox" checked={t.noor.showHijri} onChange={(e) => setNoor("showHijri", e.target.checked)} /> Show Hijri date
              </label>
            </div>
            <L10nField label="Venue" value={t.noor.venueName} onChange={(v) => setNoor("venueName", v)} />
            <L10nField label="Venue address" value={t.noor.venueAddress} onChange={(v) => setNoor("venueAddress", v)} />
            <Field label="Google Maps link (optional)">
              <input className={input} value={t.noor.mapsUrl} onChange={(e) => setNoor("mapsUrl", e.target.value)} placeholder="https://maps.app.goo.gl/…" />
            </Field>
            <L10nField label="Dress code (optional)" value={t.noor.dressCode} onChange={(v) => setNoor("dressCode", v)} />
          </Section>
        )}

        {t.kind === "html" && t.html && (
          <Section title="HTML / CSS / JS" hint="Use {{key}} in the HTML for editable text. Runs in a sandbox (no access to this site).">
            <Field label="HTML">
              <textarea spellCheck={false} className={`${input} min-h-56 font-mono text-[13px]`} value={t.html.html} onChange={(e) => setHtml("html", e.target.value)} />
            </Field>
            <Field label="CSS">
              <textarea spellCheck={false} className={`${input} min-h-40 font-mono text-[13px]`} value={t.html.css} onChange={(e) => setHtml("css", e.target.value)} />
            </Field>
            <Field label="JavaScript (optional)">
              <textarea spellCheck={false} className={`${input} min-h-24 font-mono text-[13px]`} value={t.html.js} onChange={(e) => setHtml("js", e.target.value)} />
            </Field>
            <Field label="Base URL (optional)" hint="Relative images/styles resolve against this. Set automatically on URL import.">
              <input className={input} value={t.html.baseUrl} onChange={(e) => setHtml("baseUrl", e.target.value)} placeholder="https://example.com/" />
            </Field>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#5E5246]">Text variables</span>
                <span className="flex gap-2">
                  <button type="button" onClick={detectVars} className="rounded-full border border-[#E1D5BE] px-3 py-1 text-[13px]">
                    Detect from HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => set("variables", { ...t.variables, [`var${varEntries.length + 1}`]: "" })}
                    className="rounded-full border border-[#E1D5BE] px-3 py-1 text-[13px]"
                  >
                    + Add
                  </button>
                </span>
              </div>
              {varEntries.map(([k, v], i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${input} w-40 shrink-0 font-mono text-[13px]`} value={k} onChange={(e) => setVar(k, e.target.value.replace(/[^a-zA-Z0-9_]/g, ""), v)} aria-label="Variable name" />
                  <input className={`${input} min-w-0 flex-1`} value={v} onChange={(e) => setVar(k, k, e.target.value)} aria-label={`Value for ${k}`} />
                  <button
                    type="button"
                    className="rounded-full px-3 text-rose-700"
                    aria-label={`Remove ${k}`}
                    onClick={() => set("variables", Object.fromEntries(varEntries.filter(([x]) => x !== k)))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Imagery" hint="Designs look complete without photos; images are optional.">
          <ImagePicker label="Gallery thumbnail (leave empty for an auto-drawn poster)" value={t.thumbnail} images={images} onChange={(v) => set("thumbnail", v)} onUploaded={addMedia} />
          {t.kind === "noor" && t.noor && (
            <>
              <ImagePicker label="Hero photo (inside the arch)" value={t.noor.heroImage} images={images} onChange={(v) => setNoor("heroImage", v)} onUploaded={addMedia} />
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-[#5E5246]">Photo gallery</span>
                <div className="flex flex-wrap gap-2">
                  {images.map((m) => {
                    const url = `/media/${m.id}`;
                    const on = t.noor!.gallery.includes(url);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setNoor("gallery", on ? t.noor!.gallery.filter((g) => g !== url) : [...t.noor!.gallery, url].slice(0, 12))}
                        className={`relative h-20 w-16 overflow-hidden rounded-lg border-2 ${on ? "border-[#B08A45]" : "border-transparent opacity-60"}`}
                        title={m.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={m.name} className="h-full w-full object-cover" />
                        {on && <span className="absolute end-1 top-1 rounded-full bg-[#B08A45] px-1 text-[10px] text-white">✓</span>}
                      </button>
                    );
                  })}
                  {!images.length && <span className="text-[13px] text-[#A0907A]">Upload images above to build a gallery.</span>}
                </div>
              </div>
            </>
          )}
        </Section>

        <Section title="Background music" hint="Visitors get play / pause / mute and a track selector. Use royalty-free music only.">
          <ul className="flex flex-col gap-2">
            {tracks.map((tr) => {
              const on = t.music.trackIds.includes(tr.id);
              return (
                <li key={tr.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EFE6D4] px-3 py-2">
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-[14px]">
                    <input type="checkbox" checked={on} onChange={(e) => toggleTrack(tr.id, e.target.checked)} />
                    <span className="truncate">{tr.name}</span>
                  </label>
                  {(BUILTIN_TRACKS[tr.id]?.src || !BUILTIN_TRACKS[tr.id]) && (
                    <audio controls preload="none" src={BUILTIN_TRACKS[tr.id]?.src ?? `/media/${tr.id}`} className="h-9 max-w-[220px]" />
                  )}
                  <label className={`flex items-center gap-1 text-[13px] ${on ? "" : "opacity-40"}`}>
                    <input
                      type="radio"
                      name="defaultTrack"
                      disabled={!on}
                      checked={t.music.defaultTrackId === tr.id}
                      onChange={() => set("music", { ...t.music, defaultTrackId: tr.id })}
                    />
                    Default
                  </label>
                </li>
              );
            })}
          </ul>
          <MediaUploader compact accept="audio/*" label="Upload a track (MP3/M4A, ≤ 4 MB)" onUploaded={(m) => (addMedia(m), toggleTrack(m.id, true))} />
        </Section>

        <ClientLinks templateId={savedId} template={t} siteUrl={siteUrl} links={links} setLinks={setLinks} />

        <section className="rounded-3xl border border-rose-200 bg-white p-5">
          <h2 className="text-[17px] font-semibold text-rose-800">Danger zone</h2>
          <form
            action={deleteTemplate.bind(null, savedId)}
            onSubmit={(e) => {
              if (!window.confirm("Delete this template and all its client links?")) e.preventDefault();
            }}
          >
            <button className="mt-3 rounded-full border border-rose-300 px-4 py-2 text-[14px] text-rose-700 hover:bg-rose-50">Delete template</button>
          </form>
        </section>
      </div>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-3xl border border-[#E7DCC6] bg-white p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[13px] font-medium">Preview {dirty && <span className="text-[#B08A45]">(save to update)</span>}</span>
            <a href={`/admin/preview/${savedId}`} target="_blank" className="text-[13px] text-[#B08A45] underline">
              Open ↗
            </a>
          </div>
          <div className="mx-auto overflow-hidden rounded-[28px] border-[6px] border-[#1b1714]" style={{ width: 375 * 0.9 + 12, height: 740 * 0.9 + 12 }}>
            <iframe key={previewKey} title="Template preview" src={`/admin/preview/${savedId}`} className="origin-top-left border-0" style={{ width: 375, height: 740, transform: "scale(0.9)" }} />
          </div>
          <div className="mt-3 rounded-xl bg-[#F6F3EE] p-3 text-[13px]">
            <p className="font-medium">Public share link</p>
            {t.status === "published" ? (
              <p className="mt-1 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{publicUrl}</span>
                <button type="button" className="rounded-full border border-[#E1D5BE] bg-white px-2 py-1 text-[12px]" onClick={() => navigator.clipboard.writeText(publicUrl)}>
                  Copy
                </button>
              </p>
            ) : (
              <p className="mt-1 text-[#7A6A55]">Publish the template to activate /demo/{savedId}. Client links below work even for drafts.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Client preview links                                                */
/* ------------------------------------------------------------------ */

function ClientLinks({
  templateId,
  template,
  siteUrl,
  links,
  setLinks,
}: {
  templateId: string;
  template: ShowcaseTemplate;
  siteUrl: string;
  links: PreviewLink[];
  setLinks: (fn: (l: PreviewLink[]) => PreviewLink[]) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [note, setNote] = useState("");
  const [p1, setP1] = useState<L>({ ar: "", en: "" });
  const [p2, setP2] = useState<L>({ ar: "", en: "" });
  const [date, setDate] = useState("");
  const [vars, setVars] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setError(null);
    const overrides =
      template.kind !== "html"
        ? {
            ...(p1.ar || p1.en ? { partner1: { ar: p1.ar || p1.en, en: p1.en || p1.ar }, latin1: p1.en || undefined } : {}),
            ...(p2.ar || p2.en ? { partner2: { ar: p2.ar || p2.en, en: p2.en || p2.ar }, latin2: p2.en || undefined } : {}),
            ...(date ? { date } : {}),
          }
        : { variables: Object.fromEntries(Object.entries(vars).filter(([, v]) => v)) };
    const res = await createLink(templateId, { clientName, note, overrides });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setLinks((l) => [res.link, ...l]);
    setClientName("");
    setNote("");
    setP1({ ar: "", en: "" });
    setP2({ ar: "", en: "" });
    setDate("");
    setVars({});
  }

  return (
    <Section title="Client preview links" hint="A private link per client (/p/…), optionally with their own names, date or texts. Not indexed by search engines.">
      <div className="grid gap-3 rounded-2xl bg-[#FBF8F2] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client name">
            <input className={input} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Ahmed & Sara" />
          </Field>
          <Field label="Internal note (optional)">
            <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Instagram lead, 12 Oct" />
          </Field>
        </div>
        {template.kind !== "html" ? (
          <>
            <L10nField label="Their first name (optional)" value={p1} onChange={setP1} />
            <L10nField label="Their second name (optional)" value={p2} onChange={setP2} />
            <Field label="Their date (optional)">
              <input type="datetime-local" className={input} value={date} onChange={(e) => setDate(e.target.value.slice(0, 16))} />
            </Field>
          </>
        ) : (
          Object.keys(template.variables).map((k) => (
            <Field key={k} label={`${k} (optional)`}>
              <input className={input} placeholder={template.variables[k]} value={vars[k] ?? ""} onChange={(e) => setVars({ ...vars, [k]: e.target.value })} />
            </Field>
          ))
        )}
        {error && <p className="text-[13px] text-rose-700">{error}</p>}
        <button type="button" onClick={create} disabled={busy} className="justify-self-start rounded-full bg-[#2A2420] px-4 py-2 text-[14px] text-white disabled:opacity-50">
          {busy ? "Creating…" : "Create client link"}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {links.map((l) => {
          const url = `${siteUrl}/p/${l.token}`;
          return (
            <li key={l.token} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#EFE6D4] px-3 py-2 text-[14px]">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.clientName || "Unnamed client"}</p>
                <p className="truncate font-mono text-[12px] text-[#7A6A55]">{url}</p>
                {l.note && <p className="truncate text-[12px] text-[#A0907A]">{l.note}</p>}
              </div>
              <button type="button" className="rounded-full border border-[#E1D5BE] px-3 py-1 text-[13px]" onClick={() => navigator.clipboard.writeText(url)}>
                Copy
              </button>
              <a
                className="rounded-full bg-[#1f9d55] px-3 py-1 text-[13px] text-white"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`${l.clientName ? `${l.clientName}، ` : ""}هذه معاينة تصميم دعوتكم من مبروك 💌\n${url}`)}`}
              >
                WhatsApp
              </a>
              <a className="rounded-full border border-[#E1D5BE] px-3 py-1 text-[13px]" href={url} target="_blank">
                Open
              </a>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-[13px] text-rose-700"
                onClick={async () => {
                  if (!window.confirm("Delete this client link?")) return;
                  await deleteLink(l.token);
                  setLinks((list) => list.filter((x) => x.token !== l.token));
                }}
              >
                Delete
              </button>
            </li>
          );
        })}
        {!links.length && <li className="text-[13px] text-[#A0907A]">No client links yet.</li>}
      </ul>
    </Section>
  );
}
