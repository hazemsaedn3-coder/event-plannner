"use client";

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EVENT_TYPES, MUSIC_CHOICES, ORDER_SECTIONS, type OrderFile } from "@/orders/types";
import { COUNTRY_CODES, OT } from "./copy";

export interface OrderTemplateOption {
  id: string;
  name: string;
  description: string;
  demoHref: string;
  poster: ReactNode;
}

type Lang = "ar" | "en" | "both";
type Music = (typeof MUSIC_CHOICES)[number]["id"];
type EventType = (typeof EVENT_TYPES)[number]["id"];
type SectionId = (typeof ORDER_SECTIONS)[number]["id"];

interface Draft {
  templateId: string;
  groomName: string;
  brideName: string;
  cc: string;
  phone: string;
  email: string;
  event: { type: EventType; date: string; time: string; city: string; venueName: string; venueAddress: string; mapsUrl: string; guests: string };
  preferences: { language: Lang; music: Music; sections: SectionId[]; colors: string; wording: string };
  notes: string;
}

interface Uploaded extends OrderFile {
  preview: string;
}

const DRAFT_KEY = "mbk-order-draft-v1";

const emptyDraft = (templateId: string, locale: "ar" | "en"): Draft => ({
  templateId,
  groomName: "",
  brideName: "",
  cc: "20",
  phone: "",
  email: "",
  event: { type: "wedding", date: "", time: "20:00", city: "", venueName: "", venueAddress: "", mapsUrl: "", guests: "" },
  preferences: { language: locale === "ar" ? "ar" : "both", music: "romantic", sections: ["countdown", "rsvp", "music", "timeline", "venueImages"], colors: "", wording: "" },
  notes: "",
});

/** Downscale photos in the browser before upload: faster on mobile data, smaller storage. */
async function compress(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function OrderFlow({
  locale,
  templates,
  initialTemplate,
  whatsappHref,
}: {
  locale: "ar" | "en";
  templates: OrderTemplateOption[];
  initialTemplate: string | null;
  whatsappHref: string;
}) {
  const t = OT[locale];
  const router = useRouter();
  const formTop = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(Boolean(initialTemplate));
  const [step, setStep] = useState(initialTemplate ? 1 : 0);
  const [d, setD] = useState<Draft>(() => emptyDraft(initialTemplate ?? templates[0]?.id ?? "", locale));
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [busy, setBusy] = useState<"idle" | "uploading" | "sending">("idle");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  // Coming from a design's "Order" button: go straight to the form.
  useEffect(() => {
    if (initialTemplate) formTop.current?.scrollIntoView({ block: "start" });
  }, [initialTemplate]);

  // Restore a saved draft (keeps the design chosen from a demo link).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as Draft;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
        setD((cur) => ({ ...cur, ...draft, templateId: initialTemplate ?? draft.templateId ?? cur.templateId }));
      }
    } catch {
      /* ignore */
    }
  }, [initialTemplate]);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      /* storage full or blocked */
    }
  }, [d]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setEvent = (k: keyof Draft["event"], v: string) => setD((x) => ({ ...x, event: { ...x.event, [k]: v } }));
  const setPref = <K extends keyof Draft["preferences"]>(k: K, v: Draft["preferences"][K]) => setD((x) => ({ ...x, preferences: { ...x.preferences, [k]: v } }));

  const template = templates.find((x) => x.id === d.templateId);
  const phoneDigits = (d.cc + d.phone.replace(/\D/g, "").replace(/^0+/, "")).slice(0, 15);
  const phoneOk = d.phone.replace(/\D/g, "").length >= 7;

  const stepValid = useMemo(
    () => [
      Boolean(template),
      d.groomName.trim().length >= 2 && d.brideName.trim().length >= 2 && phoneOk && Boolean(d.event.date) && d.event.city.trim().length > 0,
      true,
      true,
    ],
    [template, d, phoneOk],
  );

  function go(n: number) {
    if (n > step && !stepValid[step]) {
      setTouched(true);
      setError(t.required);
      return;
    }
    setError(null);
    setTouched(false);
    setStep(n);
    requestAnimationFrame(() => formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function addFiles(list: FileList | null, kind: "couple" | "venue") {
    if (!list?.length) return;
    setBusy("uploading");
    setError(null);
    for (const file of Array.from(list).slice(0, 16 - files.length)) {
      const blob = await compress(file);
      if (blob.size > 4 * 1024 * 1024) {
        setError(t.tooLarge);
        continue;
      }
      const body = new FormData();
      body.append("file", blob, file.name.replace(/\.\w+$/, "") + (blob.type === "image/jpeg" ? ".jpg" : ""));
      body.append("kind", kind);
      const res = await fetch("/api/orders/files", { method: "POST", body }).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (res?.ok && data?.file) setFiles((f) => [...f, { ...data.file, preview: URL.createObjectURL(blob) }]);
      else setError(res?.status === 429 ? t.rateLimited : data?.error === "too_large" ? t.tooLarge : t.failed);
    }
    setBusy("idle");
  }

  async function submit() {
    setBusy("sending");
    setError(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: d.templateId,
        groomName: d.groomName,
        brideName: d.brideName,
        whatsapp: phoneDigits,
        email: d.email.trim(),
        event: { ...d.event, guests: d.event.guests.trim() },
        preferences: d.preferences,
        notes: d.notes,
        fileIds: files.map((f) => f.id),
        locale,
        website: honeypot.current?.value ?? "",
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok && data?.id) {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      router.push(`${locale === "ar" ? "" : "/en"}/order/done/${data.id}`);
      return;
    }
    setBusy("idle");
    setError(res?.status === 429 ? t.rateLimited : data?.field === "whatsapp" ? t.invalidPhone : t.failed);
  }

  const field =
    "f-body w-full rounded-[14px] border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-[16px] text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-soft)]/50 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]";
  const bad = (cond: boolean) => (touched && cond ? "!border-rose-400 ring-4 ring-rose-100" : "");
  const label = (s: string, req?: boolean) => (
    <span className="f-body text-[14px] text-[var(--ink-soft)]">
      {s}
      {req && <span className="text-[var(--accent)]"> *</span>}
    </span>
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {/* Two paths */}
        <section className="mx-auto max-w-5xl px-5 pt-10 pb-6 text-center md:pt-16">
          <p className="f-display text-[15px] text-[var(--accent)] ltr:tracking-[0.25em] ltr:uppercase">{t.kicker}</p>
          <h1 className="f-display mt-3 text-[38px] leading-[1.35] md:text-[52px] ltr:leading-[1.1]">{t.title}</h1>
          <p className="f-body mt-3 text-[17px] text-[var(--ink-soft)]">{t.intro}</p>
          <div className="mt-8 grid gap-4 text-start md:grid-cols-2">
            <m.button
              type="button"
              whileHover={{ y: -3 }}
              onClick={() => {
                setStarted(true);
                requestAnimationFrame(() => formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }}
              className="group relative overflow-hidden rounded-[26px] border border-[var(--accent)] bg-[var(--surface)] p-7 shadow-[0_24px_50px_-34px_rgba(58,46,34,0.6)]"
            >
              <span className="absolute -end-10 -top-10 h-36 w-36 rounded-full bg-[var(--accent-soft)] blur-2xl transition group-hover:scale-125" aria-hidden />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                  <path d="M4 6.5h16v12H4zM4 7l8 6 8-6" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="f-display relative mt-4 block text-[26px]">{t.onlineTitle}</span>
              <span className="f-body relative mt-1 block text-[15px] leading-relaxed text-[var(--ink-soft)]">{t.onlineBody}</span>
              <span className="f-body relative mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-[15px] text-[var(--bg)]">
                {t.onlineCta} <span aria-hidden className="rtl:rotate-180">→</span>
              </span>
            </m.button>
            <m.a
              whileHover={{ y: -3 }}
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--surface)]/80 p-7"
            >
              <span className="absolute -end-10 -top-10 h-36 w-36 rounded-full bg-[#1f7a4d]/10 blur-2xl transition group-hover:scale-125" aria-hidden />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#1f7a4d] text-white">
                <WhatsIcon size={22} />
              </span>
              <span className="f-display relative mt-4 block text-[26px]">{t.chatTitle}</span>
              <span className="f-body relative mt-1 block text-[15px] leading-relaxed text-[var(--ink-soft)]">{t.chatBody}</span>
              <span className="f-body relative mt-5 inline-flex items-center gap-2 rounded-full bg-[#1f7a4d] px-5 py-2.5 text-[15px] font-semibold text-white">
                <WhatsIcon size={16} /> {t.chatCta}
              </span>
            </m.a>
          </div>
        </section>

        <div ref={formTop} className="scroll-mt-20" />
        <AnimatePresence>
          {started && (
            <m.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-3xl px-4 pb-24"
            >
              {/* Stepper */}
              <ol className="mx-auto mb-6 flex max-w-xl items-center justify-between gap-1 px-2" aria-label="Progress">
                {t.steps.map((s, i) => (
                  <li key={s} className="flex flex-1 items-center gap-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => i < step && go(i)}
                      disabled={i > step}
                      aria-current={i === step ? "step" : undefined}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <span
                        className={`f-display flex h-9 w-9 items-center justify-center rounded-full border text-[16px] transition ${
                          i < step
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                            : i === step
                              ? "border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)] ring-4 ring-[var(--accent-soft)]"
                              : "border-[var(--line)] text-[var(--ink-soft)]"
                        }`}
                      >
                        {i < step ? "✓" : locale === "ar" ? (i + 1).toLocaleString("ar-EG") : i + 1}
                      </span>
                      <span className={`f-body hidden text-[12px] sm:block ${i === step ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"}`}>{s}</span>
                    </button>
                    {i < t.steps.length - 1 && <span className={`mb-5 h-px flex-1 sm:mb-6 ${i < step ? "bg-[var(--accent)]" : "bg-[var(--line)]"}`} />}
                  </li>
                ))}
              </ol>

              <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_30px_70px_-50px_rgba(58,46,34,0.6)] sm:p-8">
                <AnimatePresence mode="wait" initial={false}>
                  <m.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.3 }}>
                    {step === 0 && (
                      <div>
                        <h2 className="f-display text-[28px]">{t.chooseDesign}</h2>
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {templates.map((x) => {
                            const on = x.id === d.templateId;
                            return (
                              <div key={x.id} className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => set("templateId", x.id)}
                                  aria-pressed={on}
                                  className={`relative rounded-[22px] p-1 transition ${on ? "bg-[var(--accent)] shadow-[0_14px_30px_-16px_rgba(176,138,69,0.9)]" : "bg-transparent hover:bg-[var(--accent-soft)]"}`}
                                >
                                  {x.poster}
                                  {on && (
                                    <span className="f-body absolute end-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[12px] text-[var(--bg)] shadow">✓ {t.selected}</span>
                                  )}
                                </button>
                                <p className="f-display mt-2 truncate text-[17px]">{x.name}</p>
                                <a href={x.demoHref} target="_blank" className="f-body text-[13px] text-[var(--accent)] underline underline-offset-4">
                                  {t.preview} ↗
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="flex flex-col gap-7">
                        <fieldset className="grid gap-4 sm:grid-cols-2">
                          <legend className="f-display mb-3 text-[24px]">{t.couple}</legend>
                          <label className="flex flex-col gap-1.5">
                            {label(t.groom, true)}
                            <input className={`${field} ${bad(d.groomName.trim().length < 2)}`} value={d.groomName} onChange={(e) => set("groomName", e.target.value)} maxLength={80} autoComplete="off" />
                          </label>
                          <label className="flex flex-col gap-1.5">
                            {label(t.bride, true)}
                            <input className={`${field} ${bad(d.brideName.trim().length < 2)}`} value={d.brideName} onChange={(e) => set("brideName", e.target.value)} maxLength={80} autoComplete="off" />
                          </label>
                        </fieldset>

                        <fieldset className="grid gap-4 sm:grid-cols-2">
                          <legend className="f-display mb-3 text-[24px]">{t.contact}</legend>
                          <label className="flex flex-col gap-1.5 sm:col-span-2">
                            {label(t.whatsapp, true)}
                            <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-2" dir="ltr">
                              <select className={`${field.replace("w-full", "")} w-[112px] px-2 text-[15px]`} value={d.cc} onChange={(e) => set("cc", e.target.value)} aria-label="Country code">
                                {COUNTRY_CODES.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                className={`${field} min-w-0 text-left ${bad(!phoneOk)}`}
                                inputMode="tel"
                                autoComplete="tel-national"
                                placeholder="10 1234 5678"
                                value={d.phone}
                                onChange={(e) => set("phone", e.target.value.replace(/[^\d ]/g, "").slice(0, 16))}
                              />
                            </div>
                            <span className="f-body text-[12px] text-[var(--ink-soft)]">{t.whatsappHint}</span>
                          </label>
                          <label className="flex flex-col gap-1.5 sm:col-span-2">
                            {label(t.email)}
                            <input className={field} type="email" dir="ltr" value={d.email} onChange={(e) => set("email", e.target.value)} maxLength={120} autoComplete="email" />
                          </label>
                        </fieldset>

                        <fieldset className="grid gap-4 sm:grid-cols-2">
                          <legend className="f-display mb-3 text-[24px]">{t.event}</legend>
                          <div className="flex flex-wrap gap-2 sm:col-span-2" role="radiogroup" aria-label={t.eventType}>
                            {EVENT_TYPES.map((x) => (
                              <Chip key={x.id} on={d.event.type === x.id} onClick={() => setEvent("type", x.id)}>
                                {x[locale]}
                              </Chip>
                            ))}
                          </div>
                          <label className="flex flex-col gap-1.5">
                            {label(t.date, true)}
                            <input type="date" className={`${field} ${bad(!d.event.date)}`} value={d.event.date} onChange={(e) => setEvent("date", e.target.value)} />
                          </label>
                          <label className="flex flex-col gap-1.5">
                            {label(t.time)}
                            <input type="time" className={field} value={d.event.time} onChange={(e) => setEvent("time", e.target.value)} />
                          </label>
                          <label className="flex flex-col gap-1.5">
                            {label(t.city, true)}
                            <input className={`${field} ${bad(!d.event.city.trim())}`} value={d.event.city} onChange={(e) => setEvent("city", e.target.value)} maxLength={80} />
                          </label>
                          <label className="flex flex-col gap-1.5">
                            {label(t.venue)}
                            <input className={field} value={d.event.venueName} onChange={(e) => setEvent("venueName", e.target.value)} maxLength={120} />
                          </label>
                          <label className="flex flex-col gap-1.5 sm:col-span-2">
                            {label(t.address)}
                            <input className={field} value={d.event.venueAddress} onChange={(e) => setEvent("venueAddress", e.target.value)} maxLength={200} />
                          </label>
                          <label className="flex flex-col gap-1.5">
                            {label(t.maps)}
                            <input className={field} dir="ltr" placeholder="https://maps.app.goo.gl/…" value={d.event.mapsUrl} onChange={(e) => setEvent("mapsUrl", e.target.value.trim())} maxLength={500} />
                          </label>
                          <label className="flex flex-col gap-1.5">
                            {label(t.guests)}
                            <input className={field} inputMode="numeric" value={d.event.guests} onChange={(e) => setEvent("guests", e.target.value.replace(/\D/g, "").slice(0, 4))} />
                          </label>
                        </fieldset>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="flex flex-col gap-7">
                        <fieldset className="flex flex-col gap-5">
                          <legend className="f-display mb-3 text-[24px]">{t.prefs}</legend>
                          <div className="flex flex-col gap-2">
                            {label(t.language)}
                            <div className="flex flex-wrap gap-2">
                              {(["ar", "en", "both"] as const).map((x) => (
                                <Chip key={x} on={d.preferences.language === x} onClick={() => setPref("language", x)}>
                                  {t.langs[x]}
                                </Chip>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {label(t.music)}
                            <div className="flex flex-wrap gap-2">
                              {MUSIC_CHOICES.map((x) => (
                                <Chip key={x.id} on={d.preferences.music === x.id} onClick={() => setPref("music", x.id)}>
                                  {x[locale]}
                                </Chip>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {label(t.sections)}
                            <div className="flex flex-wrap gap-2">
                              {ORDER_SECTIONS.map((x) => {
                                const on = d.preferences.sections.includes(x.id);
                                return (
                                  <Chip
                                    key={x.id}
                                    on={on}
                                    check
                                    onClick={() => setPref("sections", on ? d.preferences.sections.filter((s) => s !== x.id) : [...d.preferences.sections, x.id])}
                                  >
                                    {x[locale]}
                                  </Chip>
                                );
                              })}
                            </div>
                          </div>
                          <label className="flex flex-col gap-1.5">
                            {label(t.colors)}
                            <input className={field} placeholder={t.colorsPh} value={d.preferences.colors} onChange={(e) => setPref("colors", e.target.value)} maxLength={300} />
                          </label>
                          <label className="flex flex-col gap-1.5">
                            {label(t.wording)}
                            <textarea className={`${field} min-h-24 resize-y`} value={d.preferences.wording} onChange={(e) => setPref("wording", e.target.value)} maxLength={1000} />
                          </label>
                        </fieldset>

                        <fieldset className="flex flex-col gap-4">
                          <legend className="f-display mb-1 text-[24px]">{t.photos}</legend>
                          <p className="f-body -mt-2 text-[14px] text-[var(--ink-soft)]">{t.photosHint}</p>
                          {(["couple", "venue"] as const).map((kind) => (
                            <div key={kind} className="rounded-[18px] border border-dashed border-[var(--line)] bg-[var(--bg)]/60 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="f-body text-[15px]">{kind === "couple" ? t.couplePhotos : t.venuePhotos}</span>
                                <label className={`f-body inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--accent)] px-4 py-2 text-[14px] text-[var(--accent)] transition hover:bg-[var(--accent-soft)] ${busy !== "idle" ? "pointer-events-none opacity-50" : ""}`}>
                                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => (addFiles(e.target.files, kind), (e.target.value = ""))} />
                                  + {busy === "uploading" ? t.uploading : t.addPhotos}
                                </label>
                              </div>
                              {files.some((f) => f.kind === kind) && (
                                <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                                  {files
                                    .filter((f) => f.kind === kind)
                                    .map((f) => (
                                      <li key={f.id} className="group relative aspect-square overflow-hidden rounded-[12px] border border-[var(--line)]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={f.preview} alt={f.name} className="h-full w-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => setFiles((all) => all.filter((x) => x.id !== f.id))}
                                          className="absolute end-1 top-1 rounded-full bg-black/60 px-1.5 text-[12px] text-white"
                                          aria-label={`${t.remove} ${f.name}`}
                                        >
                                          ✕
                                        </button>
                                      </li>
                                    ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </fieldset>

                        <label className="flex flex-col gap-1.5">
                          <span className="f-display text-[24px]">{t.notes}</span>
                          <textarea className={`${field} min-h-28 resize-y`} placeholder={t.notesPh} value={d.notes} onChange={(e) => set("notes", e.target.value)} maxLength={2000} />
                        </label>
                      </div>
                    )}

                    {step === 3 && (
                      <div>
                        <h2 className="f-display text-[28px]">{t.review}</h2>
                        <p className="f-body text-[14px] text-[var(--ink-soft)]">{t.reviewHint}</p>
                        <div className="mt-5 flex flex-col gap-3">
                          <ReviewCard title={t.design} onEdit={() => go(0)} edit={t.edit}>
                            <p className="f-display text-[20px]">{template?.name}</p>
                          </ReviewCard>
                          <ReviewCard title={t.couple} onEdit={() => go(1)} edit={t.edit}>
                            <Row k={t.groom} v={d.groomName} />
                            <Row k={t.bride} v={d.brideName} />
                            <Row k={t.whatsapp} v={`+${phoneDigits}`} ltr />
                            {d.email && <Row k={t.email} v={d.email} ltr />}
                          </ReviewCard>
                          <ReviewCard title={t.event} onEdit={() => go(1)} edit={t.edit}>
                            <Row k={t.eventType} v={EVENT_TYPES.find((x) => x.id === d.event.type)?.[locale] ?? ""} />
                            <Row k={t.date} v={[d.event.date, d.event.time].filter(Boolean).join(" · ")} ltr />
                            <Row k={t.city} v={d.event.city} />
                            {d.event.venueName && <Row k={t.venue} v={d.event.venueName} />}
                            {d.event.venueAddress && <Row k={t.address} v={d.event.venueAddress} />}
                            {d.event.mapsUrl && <Row k={t.maps} v={d.event.mapsUrl} ltr />}
                            {d.event.guests && <Row k={t.guests} v={d.event.guests} />}
                          </ReviewCard>
                          <ReviewCard title={t.prefs} onEdit={() => go(2)} edit={t.edit}>
                            <Row k={t.language} v={t.langs[d.preferences.language]} />
                            <Row k={t.music} v={MUSIC_CHOICES.find((x) => x.id === d.preferences.music)?.[locale] ?? ""} />
                            <Row k={t.sections} v={d.preferences.sections.map((s) => ORDER_SECTIONS.find((x) => x.id === s)?.[locale]).join("، ") || t.none} />
                            {d.preferences.colors && <Row k={t.colors} v={d.preferences.colors} />}
                            {d.preferences.wording && <Row k={t.wording} v={d.preferences.wording} />}
                            {files.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {files.map((f) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img key={f.id} src={f.preview} alt="" className="h-12 w-12 rounded-[8px] object-cover" />
                                ))}
                              </div>
                            )}
                            {d.notes && <Row k={t.notes} v={d.notes} />}
                          </ReviewCard>
                        </div>
                        <p className="f-body mt-5 text-[13px] text-[var(--ink-soft)]">{t.consent}</p>
                      </div>
                    )}
                  </m.div>
                </AnimatePresence>

                <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

                {error && (
                  <p role="alert" className="f-body mt-5 rounded-[12px] bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
                    {error}
                  </p>
                )}

                <div className="mt-7 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
                  {step > 0 ? (
                    <button type="button" onClick={() => go(step - 1)} className="f-body rounded-full px-4 py-3 text-[15px] text-[var(--ink-soft)] hover:text-[var(--ink)]">
                      <span aria-hidden className="ltr:hidden">→ </span>
                      <span aria-hidden className="rtl:hidden">← </span>
                      {t.back}
                    </button>
                  ) : (
                    <span className="f-body text-[12px] text-[var(--ink-soft)]">{t.draftSaved}</span>
                  )}
                  {step < 3 ? (
                    <button type="button" onClick={() => go(step + 1)} className="f-body rounded-full bg-[var(--ink)] px-7 py-3 text-[16px] text-[var(--bg)] transition hover:opacity-90 active:scale-[0.98]">
                      {t.next}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submit}
                      disabled={busy !== "idle"}
                      className="f-body rounded-full bg-gradient-to-b from-[#C9A45C] to-[#A9823C] px-8 py-3.5 text-[16px] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(169,130,60,0.9)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
                    >
                      {busy === "sending" ? t.sending : t.submit}
                    </button>
                  )}
                </div>
              </div>
            </m.section>
          )}
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  );
}

function Chip({ on, onClick, children, check }: { on: boolean; onClick: () => void; children: ReactNode; check?: boolean }) {
  return (
    <button
      type="button"
      role={check ? "checkbox" : "radio"}
      aria-checked={on}
      onClick={onClick}
      className={`f-body min-h-11 rounded-full border px-4 py-2 text-[14px] transition active:scale-[0.97] ${
        on ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]" : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)]"
      }`}
    >
      {check && <span aria-hidden>{on ? "✓ " : "+ "}</span>}
      {children}
    </button>
  );
}

function ReviewCard({ title, children, onEdit, edit }: { title: string; children: ReactNode; onEdit: () => void; edit: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--bg)]/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="f-body text-[13px] text-[var(--accent)] ltr:tracking-wider ltr:uppercase">{title}</span>
        <button type="button" onClick={onEdit} className="f-body text-[13px] text-[var(--ink-soft)] underline underline-offset-4">
          {edit}
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ k, v, ltr }: { k: string; v: string; ltr?: boolean }) {
  return (
    <p className="f-body flex flex-wrap gap-x-2 py-0.5 text-[15px]">
      <span className="text-[var(--ink-soft)]">{k}:</span>
      <span className="min-w-0 break-words whitespace-pre-line" dir={ltr ? "ltr" : undefined}>
        {v}
      </span>
    </p>
  );
}

export function WhatsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" />
    </svg>
  );
}
