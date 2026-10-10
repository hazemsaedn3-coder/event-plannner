"use client";

import { BUILTIN_TRACKS } from "@/catalog/builtin-tracks";
import { resolveNoor, type ResolvedNoor } from "@/catalog/content";
import { FEATURES, type DuoConfig, type FeatureKey, type MediaMeta, type ShowcaseTemplate, type TemplateColors } from "@/catalog/types";
import { MediaUploader } from "./MediaUploader";
import { ColorField, Field, input, L10nField, PhotoList, Section, Toggle, type L } from "./ui";

/** Five-color presets matching the Noor themes. */
const PRESETS: Record<"ivory-gold" | "emerald-night" | "blush-rose", TemplateColors> = {
  "ivory-gold": { background: "#F8F2E7", surface: "#FFFBF4", text: "#3A2E22", accent: "#B08A45", seal: "#8C2232" },
  "emerald-night": { background: "#0E2E26", surface: "#133A30", text: "#F4EBD6", accent: "#D6B46C", seal: "#C9A253" },
  "blush-rose": { background: "#F7E6E2", surface: "#FDF4F1", text: "#55343A", accent: "#B5737C", seal: "#9E4A58" },
};

const EMPTY: L = { ar: "", en: "" };
const TIME_ZONES = ["Africa/Cairo", "Asia/Riyadh", "Asia/Dubai", "Asia/Kuwait", "Asia/Qatar", "Asia/Bahrain", "Asia/Muscat", "Asia/Amman", "Europe/London"];

/** Give every optional content block its default shape so the editor can bind to it. */
export function normalizeTemplate(t: ShowcaseTemplate): ShowcaseTemplate {
  return t.noor ? { ...t, noor: resolveNoor(t.noor) } : t;
}

export const SECTION_NAV = [
  { id: "sec-sections", label: "Sections" },
  { id: "sec-text", label: "Names & event" },
  { id: "sec-couple", label: "Couple photos" },
  { id: "sec-venue", label: "Venue" },
  { id: "sec-schedule", label: "Schedule" },
  { id: "sec-gallery", label: "Gallery" },
  { id: "sec-rsvp", label: "RSVP & countdown" },
  { id: "sec-extras", label: "Gifts · contact · notes" },
  { id: "sec-music", label: "Music" },
];

export function ContentEditor({
  t,
  setT,
  media,
  addMedia,
  textHint,
}: {
  t: ShowcaseTemplate;
  setT: (fn: (t: ShowcaseTemplate) => ShowcaseTemplate) => void;
  media: MediaMeta[];
  addMedia: (m: MediaMeta) => void;
  textHint?: string;
}) {
  const audio = media.filter((m) => m.kind === "audio");
  const images = media.filter((m) => m.kind === "image");
  const n = t.noor ? (t.noor as ResolvedNoor) : null;
  const set = <K extends keyof ShowcaseTemplate>(k: K, v: ShowcaseTemplate[K]) => setT((x) => ({ ...x, [k]: v }));
  const setNoor = <K extends keyof ResolvedNoor>(k: K, v: ResolvedNoor[K]) => setT((x) => ({ ...x, noor: { ...x.noor!, [k]: v } }));
  const patchNoor = <K extends keyof ResolvedNoor>(k: K, fn: (v: ResolvedNoor[K]) => ResolvedNoor[K]) =>
    setT((x) => ({ ...x, noor: { ...x.noor!, [k]: fn((x.noor as ResolvedNoor)[k]) } }));
  const setFeature = (k: FeatureKey, v: boolean) => patchNoor("features", (f) => ({ ...f, [k]: v }));
  const setHtml = (k: "html" | "css" | "js" | "baseUrl", v: string) => setT((x) => ({ ...x, html: { ...x.html!, [k]: v } }));
  const setDuo = (side: "bride" | "groom", patch: Partial<DuoConfig["bride"]>) =>
    setT((x) => ({ ...x, duo: { ...x.duo!, [side]: { ...x.duo![side], ...patch } } }));

  const tracks = [
    ...Object.entries(BUILTIN_TRACKS).map(([id, b]) => ({ id, name: `${b.title} (built-in)` })),
    ...audio.map((m) => ({ id: m.id, name: m.name })),
  ];
  function toggleTrack(id: string, on: boolean) {
    setT((x) => {
      const ids = on ? [...new Set([...x.music.trackIds, id])] : x.music.trackIds.filter((i) => i !== id);
      return { ...x, music: { trackIds: ids, defaultTrackId: ids.includes(x.music.defaultTrackId) ? x.music.defaultTrackId : (ids[0] ?? "") } };
    });
  }

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

  const off = (k: FeatureKey) => (n && !n.features[k] ? <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[12px] text-stone-600">Hidden</span> : null);

  return (
    <>
      {n && (
        <Section
          id="sec-sections"
          title="Sections"
          hint="Switch any section on or off. The invitation closes the gap, so nothing looks empty."
          aside={
            <span className="flex gap-1.5 text-[12px]">
              <button type="button" className="rounded-full border border-[#E1D5BE] px-2.5 py-1" onClick={() => patchNoor("features", (f) => Object.fromEntries(Object.keys(f).map((k) => [k, true])) as typeof f)}>
                All on
              </button>
              <button type="button" className="rounded-full border border-[#E1D5BE] px-2.5 py-1" onClick={() => patchNoor("features", (f) => Object.fromEntries(Object.keys(f).map((k) => [k, false])) as typeof f)}>
                All off
              </button>
            </span>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <Toggle key={f.key} label={f.label} checked={n.features[f.key]} onChange={(v) => setFeature(f.key, v)} />
            ))}
          </div>
        </Section>
      )}

      {t.kind === "layali" && (
        <Section title="Cinematic look" hint="Embossed paper, seal, particles and page colors. The envelope opens in 3D, the seal carries the couple's initials.">
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["velvet", "Burgundy velvet damask · gold dust", "#45111B"],
                ["royal", "Royal gold lace · gold dust", "#C6A15A"],
                ["midnight", "Midnight stars · lanterns", "#121E38"],
                ["garden", "Rose garden · falling petals", "#ECD0CB"],
                ["khaliji", "Khaliji · Sadu weaving & gold · incense", "#0F3A34"],
                ["saeedi", "Saeedi · silver tally embroidery", "#18181D"],
              ] as const
            ).map(([id, label, swatch]) => (
              <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${t.layali?.look === id ? "border-[#B08A45] bg-[#FBF6EA]" : "border-[#EFE6D4]"}`}>
                <input type="radio" name="layali-look" checked={t.layali?.look === id} onChange={() => setT((x) => ({ ...x, layali: { look: id } }))} />
                <span className="h-8 w-8 shrink-0 rounded-full ring-2 ring-white" style={{ background: swatch, boxShadow: "0 0 0 1px #E1D5BE" }} />
                <span className="text-[14px]">{label}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {(t.kind === "noor" || t.kind === "html") && (
        <Section title="Colors" hint={t.kind === "html" ? "Exposed to your HTML as --mbk-background, --mbk-surface, --mbk-text, --mbk-accent, --mbk-seal." : undefined}>
          {t.kind === "noor" && n && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Base theme">
                <select
                  className={input}
                  value={n.baseTheme}
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
                <select className={input} value={n.colorsMode} onChange={(e) => setNoor("colorsMode", e.target.value as "preset" | "custom")}>
                  <option value="preset">Preset theme colors</option>
                  <option value="custom">Custom colors</option>
                </select>
              </Field>
            </div>
          )}
          <div className={`flex flex-wrap gap-2 ${t.kind === "noor" && n?.colorsMode === "preset" ? "pointer-events-none opacity-40" : ""}`}>
            {(["background", "surface", "text", "accent", "seal"] as const).map((k) => (
              <ColorField key={k} label={k[0].toUpperCase() + k.slice(1)} value={t.colors[k]} onChange={(v) => set("colors", { ...t.colors, [k]: v })} />
            ))}
          </div>
        </Section>
      )}

      {t.kind === "duo" && t.duo && (
        <Section title="Two entrances" hint="Guests choose a side on the entrance screen. The bride's friends get the romantic world, the groom's friends the shaabi one; both see all the details below.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Entrance style">
              <select
                className={input}
                value={t.duo.style ?? "diagonal"}
                onChange={(e) => setT((x) => ({ ...x, duo: { ...x.duo!, style: e.target.value as NonNullable<DuoConfig["style"]> } }))}
              >
                <option value="diagonal">Diagonal split with glowing seam</option>
                <option value="doors">Two palace doors that open</option>
                <option value="tickets">Two party tickets (tear to enter)</option>
                <option value="split">Half & half with zigzag line</option>
              </select>
            </Field>
            <Field label="Colors (both worlds)">
              <select
                className={input}
                value={t.duo.palette ?? "classic"}
                onChange={(e) => setT((x) => ({ ...x, duo: { ...x.duo!, palette: e.target.value as NonNullable<DuoConfig["palette"]> } }))}
              >
                <option value="classic">Blush × Neon violet</option>
                <option value="royal">Ivory × Red tent (khayamiya)</option>
                <option value="night">Lavender × Teal neon</option>
                <option value="sunset">Peach × Green & gold</option>
              </select>
            </Field>
          </div>
          <L10nField label="Entrance question" value={t.duo.gateQuestion} onChange={(v) => setT((x) => ({ ...x, duo: { ...x.duo!, gateQuestion: v } }))} />
          {(["bride", "groom"] as const).map((side) => (
            <div key={side} className={`flex flex-col gap-3 rounded-2xl p-4 ${side === "bride" ? "bg-[#FCE8EE]" : "bg-[#EDE6F7]"}`}>
              <p className="text-[14px] font-semibold">{side === "bride" ? "💗 Bride's friends — romantic" : "🥁 Groom's friends — shaabi"}</p>
              <L10nField label="Entrance button" value={t.duo![side].gateLabel} onChange={(v) => setDuo(side, { gateLabel: v })} />
              <L10nField label="Big title" value={t.duo![side].title} onChange={(v) => setDuo(side, { title: v })} />
              <L10nField label="Message to this group" value={t.duo![side].message} onChange={(v) => setDuo(side, { message: v })} multiline />
              <Field label="Song for this side" hint="Also tick it under Background music so the player can switch to it.">
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

      {n && (
        <Section id="sec-text" title="Names & event" hint={textHint}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Default language">
              <select className={input} value={n.defaultLocale} onChange={(e) => setNoor("defaultLocale", e.target.value as "ar" | "en")}>
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label="Market">
              <select className={input} value={n.market} onChange={(e) => setNoor("market", e.target.value as "EG" | "GCC" | "OTHER")}>
                <option value="EG">Egypt</option>
                <option value="GCC">Gulf (GCC)</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Tone">
              <select className={input} value={n.tone} onChange={(e) => setNoor("tone", e.target.value as "romantic" | "formal")}>
                <option value="romantic">Romantic</option>
                <option value="formal">Formal (families invite)</option>
              </select>
            </Field>
          </div>
          <L10nField label="First name" value={n.partner1} onChange={(v) => setNoor("partner1", v)} />
          <L10nField label="Second name" value={n.partner2} onChange={(v) => setNoor("partner2", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name (Latin, for link previews)">
              <input className={input} value={n.latin1} onChange={(e) => setNoor("latin1", e.target.value)} />
            </Field>
            <Field label="Second name (Latin)">
              <input className={input} value={n.latin2} onChange={(e) => setNoor("latin2", e.target.value)} />
            </Field>
          </div>
          <L10nField label="Opening line (optional)" value={n.opening} onChange={(v) => setNoor("opening", v)} />
          <L10nField label="Families / hosts line" value={n.hostsLine} onChange={(v) => setNoor("hostsLine", v)} multiline />
          <L10nField label="Invitation sentence" value={n.inviteLine} onChange={(v) => setNoor("inviteLine", v)} multiline />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date & time">
              <input type="datetime-local" className={input} value={n.date} onChange={(e) => setNoor("date", e.target.value.slice(0, 16))} />
            </Field>
            <Field label="Time zone">
              <select className={input} value={n.timeZone} onChange={(e) => setNoor("timeZone", e.target.value)}>
                {TIME_ZONES.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 pt-6 text-[14px]">
              <input type="checkbox" checked={n.showHijri} onChange={(e) => setNoor("showHijri", e.target.checked)} /> Show Hijri date
            </label>
          </div>
          <L10nField label="Venue" value={n.venueName} onChange={(v) => setNoor("venueName", v)} />
          <L10nField label="Venue address" value={n.venueAddress} onChange={(v) => setNoor("venueAddress", v)} />
          <Field label="Google Maps link" hint="Powers the Maps and Directions buttons. Paste the share link from Google Maps.">
            <input className={input} value={n.mapsUrl} onChange={(e) => setNoor("mapsUrl", e.target.value)} placeholder="https://maps.app.goo.gl/…" />
          </Field>
          <L10nField label="Dress code (optional)" value={n.dressCode} onChange={(v) => setNoor("dressCode", v)} />
        </Section>
      )}

      {n && (
        <Section id="sec-couple" title="Bride & groom photos" hint="Optional. One photo or many; reorder with the arrows." aside={off("couplePhotos")}>
          <Toggle label="Show couple photos" checked={n.features.couplePhotos} onChange={(v) => setFeature("couplePhotos", v)} />
          <Field label="Layout">
            <select className={input} value={n.couple.layout} onChange={(e) => patchNoor("couple", (c) => ({ ...c, layout: e.target.value as ResolvedNoor["couple"]["layout"] }))}>
              <option value="arch">Arch: first photo inside the hero arch (Noor), the rest in a strip</option>
              <option value="polaroid">Polaroids: scattered instant photos</option>
              <option value="filmstrip">Filmstrip: swipeable arched frames</option>
              <option value="mosaic">Mosaic: elegant two-column grid</option>
            </select>
          </Field>
          <PhotoList label="Photos" value={n.couple.images} onChange={(fn) => patchNoor("couple", (c) => ({ ...c, images: fn(c.images) }))} images={images} onUploaded={addMedia} />
        </Section>
      )}

      {n && (
        <Section id="sec-venue" title="Wedding venue showcase" hint="Photos or screenshots of the hall, a short description and Maps/Directions buttons." aside={off("venueImages")}>
          <Toggle label="Show venue photos" checked={n.features.venueImages} onChange={(v) => setFeature("venueImages", v)} />
          <Field label="Layout">
            <select className={input} value={n.venueShowcase.layout} onChange={(e) => patchNoor("venueShowcase", (v) => ({ ...v, layout: e.target.value as ResolvedNoor["venueShowcase"]["layout"] }))}>
              <option value="hero">Full-width hero photo + thumbnails</option>
              <option value="carousel">Carousel / slider</option>
              <option value="grid">Gallery grid</option>
            </select>
          </Field>
          <PhotoList label="Venue photos" max={16} value={n.venueShowcase.images} onChange={(fn) => patchNoor("venueShowcase", (v) => ({ ...v, images: fn(v.images) }))} images={images} onUploaded={addMedia} />
          <L10nField label="Section title (optional)" value={n.venueShowcase.title} onChange={(v) => patchNoor("venueShowcase", (s) => ({ ...s, title: v }))} />
          <L10nField label="About the venue (optional)" value={n.venueShowcase.story} onChange={(v) => patchNoor("venueShowcase", (s) => ({ ...s, story: v }))} multiline />
          <Toggle label="Show Google Maps & Directions buttons" checked={n.features.mapsButton} onChange={(v) => setFeature("mapsButton", v)} />
        </Section>
      )}

      {n && (
        <Section id="sec-schedule" title="Event schedule" hint="The evening's timeline. Sorted by time automatically." aside={off("timeline")}>
          {n.timeline.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-2xl border border-[#EFE6D4] p-3">
              <div className="flex items-center gap-2">
                <input type="time" className={`${input} w-32`} value={s.time} onChange={(e) => patchNoor("timeline", (tl) => tl.map((x, k) => (k === i ? { ...x, time: e.target.value } : x)))} aria-label="Time" />
                <span className="flex-1" />
                <button type="button" className="rounded-full px-3 py-1 text-[13px] text-rose-700" onClick={() => patchNoor("timeline", (tl) => tl.filter((_, k) => k !== i))}>
                  Remove
                </button>
              </div>
              <L10nField label="Title" value={s.title} onChange={(v) => patchNoor("timeline", (tl) => tl.map((x, k) => (k === i ? { ...x, title: v } : x)))} />
              <L10nField label="Note (optional)" value={s.note} onChange={(v) => patchNoor("timeline", (tl) => tl.map((x, k) => (k === i ? { ...x, note: v } : x)))} />
            </div>
          ))}
          <button
            type="button"
            disabled={n.timeline.length >= 12}
            onClick={() => patchNoor("timeline", (tl) => [...tl, { time: "21:00", title: { ...EMPTY }, note: { ...EMPTY } }])}
            className="self-start rounded-full border border-[#E1D5BE] px-4 py-2 text-[13px] hover:bg-[#FBF8F2] disabled:opacity-40"
          >
            + Add a moment
          </button>
        </Section>
      )}

      {n && (
        <Section id="sec-gallery" title="Photo gallery" aside={off("gallery")}>
          <Toggle label="Show photo gallery" checked={n.features.gallery} onChange={(v) => setFeature("gallery", v)} />
          <Field label="Layout">
            <select className={input} value={n.galleryLayout} onChange={(e) => setNoor("galleryLayout", e.target.value as ResolvedNoor["galleryLayout"])}>
              <option value="carousel">Arched carousel</option>
              <option value="grid">Square grid</option>
              <option value="masonry">Masonry</option>
              <option value="coverflow">3D coverflow</option>
            </select>
          </Field>
          <PhotoList label="Gallery photos" value={n.gallery} onChange={(fn) => patchNoor("gallery", fn)} images={images} onUploaded={addMedia} />
        </Section>
      )}

      {n && (
        <Section id="sec-rsvp" title="RSVP & countdown">
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle label="Show RSVP form" checked={n.features.rsvp} onChange={(v) => setFeature("rsvp", v)} />
            <Toggle label="Show countdown" checked={n.features.countdown} onChange={(v) => setFeature("countdown", v)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="RSVP deadline (optional)" hint="After this day the form closes politely.">
              <input type="date" className={input} value={n.rsvpSettings.deadline} onChange={(e) => patchNoor("rsvpSettings", (r) => ({ ...r, deadline: e.target.value }))} />
            </Field>
            <Field label="Max guests per reply">
              <input
                type="number"
                min={1}
                max={20}
                className={input}
                value={n.rsvpSettings.maxHeadcount}
                onChange={(e) => patchNoor("rsvpSettings", (r) => ({ ...r, maxHeadcount: Math.min(20, Math.max(1, Number(e.target.value) || 1)) }))}
              />
            </Field>
          </div>
          <L10nField label="Countdown title (optional)" value={n.countdown.title} onChange={(v) => patchNoor("countdown", (c) => ({ ...c, title: v }))} />
          <Toggle label="Show seconds in the countdown" checked={n.countdown.showSeconds} onChange={(v) => patchNoor("countdown", (c) => ({ ...c, showSeconds: v }))} />
        </Section>
      )}

      {n && (
        <Section id="sec-extras" title="Gifts, contact & notes">
          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle label="Gift information" checked={n.features.gifts} onChange={(v) => setFeature("gifts", v)} />
            <Toggle label="Contact information" checked={n.features.contact} onChange={(v) => setFeature("contact", v)} />
            <Toggle label="Additional notes" checked={n.features.notes} onChange={(v) => setFeature("notes", v)} />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-[#FBF8F2] p-4">
            <p className="text-[14px] font-semibold">🎁 Gifts</p>
            <L10nField label="Message" value={n.gifts.message} onChange={(v) => patchNoor("gifts", (g) => ({ ...g, message: v }))} multiline />
            {n.gifts.accounts.map((a, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <L10nField label={`Account ${i + 1} label`} value={a.label} onChange={(v) => patchNoor("gifts", (g) => ({ ...g, accounts: g.accounts.map((x, k) => (k === i ? { ...x, label: v } : x)) }))} />
                </div>
                <input className={`${input} w-56`} placeholder="InstaPay / IBAN" value={a.value} onChange={(e) => patchNoor("gifts", (g) => ({ ...g, accounts: g.accounts.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) }))} />
                <button type="button" className="px-2 pb-2 text-rose-700" aria-label="Remove account" onClick={() => patchNoor("gifts", (g) => ({ ...g, accounts: g.accounts.filter((_, k) => k !== i) }))}>
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={n.gifts.accounts.length >= 4}
              onClick={() => patchNoor("gifts", (g) => ({ ...g, accounts: [...g.accounts, { label: { ar: "إنستاباي", en: "InstaPay" }, value: "" }] }))}
              className="self-start rounded-full border border-[#E1D5BE] bg-white px-3 py-1.5 text-[13px] disabled:opacity-40"
            >
              + Add account
            </button>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-[#FBF8F2] p-4">
            <p className="text-[14px] font-semibold">📞 Contacts (call & WhatsApp buttons)</p>
            {n.contacts.map((c, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <L10nField label={`Contact ${i + 1} name`} value={c.name} onChange={(v) => patchNoor("contacts", (cs) => cs.map((x, k) => (k === i ? { ...x, name: v } : x)))} />
                </div>
                <input
                  className={`${input} w-48`}
                  dir="ltr"
                  placeholder="201001234567"
                  value={c.phone}
                  onChange={(e) => patchNoor("contacts", (cs) => cs.map((x, k) => (k === i ? { ...x, phone: e.target.value.replace(/[^\d+]/g, "") } : x)))}
                />
                <button type="button" className="px-2 pb-2 text-rose-700" aria-label="Remove contact" onClick={() => patchNoor("contacts", (cs) => cs.filter((_, k) => k !== i))}>
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={n.contacts.length >= 4}
              onClick={() => patchNoor("contacts", (cs) => [...cs, { name: { ...EMPTY }, phone: "" }])}
              className="self-start rounded-full border border-[#E1D5BE] bg-white px-3 py-1.5 text-[13px] disabled:opacity-40"
            >
              + Add contact
            </button>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-[#FBF8F2] p-4">
            <p className="text-[14px] font-semibold">📝 Additional notes</p>
            <L10nField label="Title (optional)" value={n.notes.title} onChange={(v) => patchNoor("notes", (x) => ({ ...x, title: v }))} />
            <L10nField label="Text" value={n.notes.body} onChange={(v) => patchNoor("notes", (x) => ({ ...x, body: v }))} multiline />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle label="Dress code" checked={n.features.dressCode} onChange={(v) => setFeature("dressCode", v)} />
            <Toggle label="Social sharing" checked={n.features.share} onChange={(v) => setFeature("share", v)} />
            <Toggle label="Animations" checked={n.features.animations} onChange={(v) => setFeature("animations", v)} />
          </div>
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
                <button type="button" onClick={() => set("variables", { ...t.variables, [`var${varEntries.length + 1}`]: "" })} className="rounded-full border border-[#E1D5BE] px-3 py-1 text-[13px]">
                  + Add
                </button>
              </span>
            </div>
            {varEntries.map(([k, v], i) => (
              <div key={i} className="flex gap-2">
                <input className={`${input} w-40 shrink-0 font-mono text-[13px]`} value={k} onChange={(e) => setVar(k, e.target.value.replace(/[^a-zA-Z0-9_]/g, ""), v)} aria-label="Variable name" />
                <input className={`${input} min-w-0 flex-1`} value={v} onChange={(e) => setVar(k, k, e.target.value)} aria-label={`Value for ${k}`} />
                <button type="button" className="rounded-full px-3 text-rose-700" aria-label={`Remove ${k}`} onClick={() => set("variables", Object.fromEntries(varEntries.filter(([x]) => x !== k)))}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section id="sec-music" title="Background music" hint="Visitors get play / pause / mute and a track selector. Use royalty-free music only." aside={off("music")}>
        {n && <Toggle label="Play background music" checked={n.features.music} onChange={(v) => setFeature("music", v)} />}
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
                  <input type="radio" name="defaultTrack" disabled={!on} checked={t.music.defaultTrackId === tr.id} onChange={() => set("music", { ...t.music, defaultTrackId: tr.id })} />
                  Default
                </label>
              </li>
            );
          })}
        </ul>
        <MediaUploader compact accept="audio/*" label="Upload a song or voice (MP3/M4A, ≤ 12 MB)" onUploaded={(m) => (addMedia(m), toggleTrack(m.id, true))} />
      </Section>
    </>
  );
}
