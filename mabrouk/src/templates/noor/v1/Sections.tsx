"use client";

import { m } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { audienceLabel, ui } from "@/lib/i18n";
import type { L10n } from "@/lib/types";
import type { InvitationView, SubEventView } from "@/lib/view";
import { useLocale } from "../../shared/LocaleContext";
import { ArchFrame, Corner, DateParts, Divider, Dot, Icon, Star8 } from "./Ornaments";

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </m.div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="f-display text-[30px] leading-tight text-[var(--ink)]">{children}</h2>
      <Divider className="mt-3" />
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[18px] border border-[var(--line)] bg-[var(--surface)] px-6 py-7 ${className}`}>
      <Corner className="absolute top-2 left-2" />
      <Corner className="absolute top-2 right-2 -scale-x-100" />
      <Corner className="absolute bottom-2 left-2 -scale-y-100" />
      <Corner className="absolute right-2 bottom-2 -scale-100" />
      {children}
    </div>
  );
}

function PillLink({ href, icon, children }: { href: string; icon: Parameters<typeof Icon>[0]["name"]; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="f-body inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-3.5 py-2 text-[13px] text-[var(--ink)] transition active:scale-[0.97]"
    >
      <Icon name={icon} className="h-4 w-4 text-[var(--accent)]" />
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function Hero({ view, revealed }: { view: InvitationView; revealed: boolean }) {
  const { tr, locale } = useLocale();
  const show = (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const, delay },
  });

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center px-5 pt-16 pb-10">
      <div className="relative w-full max-w-[400px]">
        <m.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={revealed ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.6, ease: "easeOut" }}
        >
          <ArchFrame className="h-full w-full" />
        </m.div>

        <div className="relative flex min-h-[560px] flex-col items-center px-8 pt-16 pb-10 text-center">
          <m.div {...show(0.1)}>
            <Star8 size={18} className="text-[var(--accent)]" />
          </m.div>
          {view.opening && (
            <m.p {...show(0.2)} className="f-body mx-auto mt-4 max-w-[230px] text-[15px] leading-snug text-[var(--accent)]">
              {tr(view.opening)}
            </m.p>
          )}
          {view.heroImage && (
            <m.div
              {...show(0.3)}
              className="mt-5 h-40 w-32 overflow-hidden rounded-t-full rounded-b-[14px] border border-[var(--line)] p-1"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={view.heroImage} alt="" className="h-full w-full rounded-t-full rounded-b-[10px] object-cover" />
            </m.div>
          )}
          <m.p {...show(0.35)} className="f-body mt-5 max-w-[290px] text-[15px] leading-relaxed text-[var(--ink-soft)]">
            {tr(view.hostsLine)}
          </m.p>

          <div className="my-6 flex flex-col items-center">
            <m.h1 {...show(0.55)} className="f-names text-[58px] leading-[1.15] text-[var(--ink)]">
              {tr(view.partner1)}
            </m.h1>
            <m.span {...show(0.7)} className="f-names my-1 text-[34px] leading-none text-[var(--accent)]">
              {locale === "ar" ? "و" : "&"}
            </m.span>
            <m.p {...show(0.85)} className="f-names text-[58px] leading-[1.15] text-[var(--ink)]">
              {tr(view.partner2)}
            </m.p>
          </div>

          <m.p {...show(1)} className="f-body text-[15px] leading-relaxed text-[var(--ink-soft)]">
            {tr(view.inviteLine)}
          </m.p>

          <m.div {...show(1.15)} className="mt-7 w-full">
            <Divider />
            <p className="f-display mt-4 text-[26px] text-[var(--ink)] ltr:tracking-[0.12em]">
              <DateParts parts={view.main.numeric[locale]} />
            </p>
            <p className="f-body mt-1 text-[15px] text-[var(--ink-soft)]">
              {tr(view.main.date)}
              <Dot />
              {tr(view.main.time)}
            </p>
            {view.main.hijri && (
              <p className="f-body mt-1 text-[13px] text-[var(--accent)]">{tr(view.main.hijri)}</p>
            )}
          </m.div>
        </div>
      </div>

      <m.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[var(--accent)]"
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: [0, 1, 0], y: [0, 6, 0] } : {}}
        transition={{ duration: 2.2, repeat: Infinity, delay: 2 }}
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </m.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Countdown                                                           */
/* ------------------------------------------------------------------ */

function remaining(target: number, now: number) {
  const diff = Math.max(0, target - now);
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

export function Countdown({ startsAt, title, showSeconds = true }: { startsAt: string; title?: L10n; showSeconds?: boolean }) {
  const { tr, locale } = useLocale();
  const target = new Date(startsAt).getTime();
  // null until mounted: the server can't know the visitor's "now".
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const r = now == null ? null : remaining(target, now);
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { minimumIntegerDigits: 2 });
  const units = [
    { key: "days", label: ui.days, value: r?.days },
    { key: "hours", label: ui.hours, value: r?.hours },
    { key: "minutes", label: ui.minutes, value: r?.minutes },
    { key: "seconds", label: ui.seconds, value: r?.seconds },
  ].filter((u) => showSeconds || u.key !== "seconds");

  return (
    <section className="px-5 py-14">
      <Reveal>
        <p className="f-display mb-6 text-center text-[13px] text-[var(--accent)] ltr:tracking-[0.3em] ltr:uppercase">
          {tr(title ?? ui.countdown)}
        </p>
        {r?.done ? (
          <p className="f-display text-center text-[28px] text-[var(--ink)]">{tr(ui.itsToday)}</p>
        ) : (
          <div className={`mx-auto grid gap-2.5 ${showSeconds ? "max-w-[380px] grid-cols-4" : "max-w-[300px] grid-cols-3"}`}>
            {units.map((u) => (
              <div
                key={u.key}
                className="flex aspect-[4/5] flex-col items-center justify-center rounded-t-full rounded-b-[14px] border border-[var(--line)] bg-[var(--surface)]"
              >
                <span className="f-display text-[28px] leading-none text-[var(--ink)] tabular-nums">
                  {u.value == null ? "··" : nf.format(u.value)}
                </span>
                <span className="f-body mt-1.5 text-[12px] text-[var(--ink-soft)]">{tr(u.label)}</span>
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Story                                                               */
/* ------------------------------------------------------------------ */

export function Story({ view }: { view: InvitationView }) {
  const { tr } = useLocale();
  if (!view.story?.length) return null;
  return (
    <section className="px-6 py-14">
      <Reveal>
        <SectionTitle>{tr(ui.ourStory)}</SectionTitle>
      </Reveal>
      <ol className="relative mx-auto max-w-[380px] border-s border-[var(--line)] ps-7">
        {view.story.map((item, i) => (
          <li key={i} className="relative pb-9 last:pb-0">
            <Reveal delay={i * 0.08}>
              <span className="absolute -start-[37px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--accent)]">
                <Star8 size={12} />
              </span>
              {item.when && <p className="f-body text-[13px] text-[var(--accent)]">{tr(item.when)}</p>}
              <h3 className="f-display mt-0.5 text-[22px] text-[var(--ink)]">{tr(item.title)}</h3>
              <p className="f-body mt-1.5 text-[15px] leading-relaxed text-[var(--ink-soft)]">{tr(item.body)}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-events                                                          */
/* ------------------------------------------------------------------ */

function EventCard({ event }: { event: SubEventView }) {
  const { tr, locale } = useLocale();
  const audience = tr(audienceLabel[event.audience]);
  return (
    <Card className="text-center">
      {audience && (
        <span className="f-body mb-3 inline-block rounded-full bg-[var(--accent-soft)] px-3 py-0.5 text-[12px] text-[var(--accent)]">
          {audience}
        </span>
      )}
      <h3 className="f-display text-[26px] leading-tight text-[var(--ink)]">{tr(event.title)}</h3>
      <div className="f-body mt-3 space-y-1 text-[15px] text-[var(--ink-soft)]">
        <p>{tr(event.date)}</p>
        {event.hijri && <p className="text-[13px] text-[var(--accent)]">{tr(event.hijri)}</p>}
        <p className="flex items-center justify-center gap-1.5">
          <Icon name="clock" className="h-4 w-4 text-[var(--accent)]" />
          {tr(event.time)}
        </p>
      </div>
      <div className="mx-auto my-4 h-px w-12 bg-[var(--line)]" />
      <p className="f-display text-[19px] text-[var(--ink)]">{tr(event.venueName)}</p>
      {event.venueAddress && <p className="f-body text-[14px] text-[var(--ink-soft)]">{tr(event.venueAddress)}</p>}
      {event.note && <p className="f-body mt-3 text-[14px] text-[var(--ink-soft)] ltr:italic">{tr(event.note)}</p>}
      {event.dressCode && (
        <p className="f-body mt-2 flex items-center justify-center gap-1.5 text-[14px] text-[var(--ink-soft)]">
          <Icon name="dress" className="h-4 w-4 text-[var(--accent)]" />
          {tr(event.dressCode)}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {event.mapsUrl && (
          <PillLink href={event.mapsUrl} icon="pin">
            {tr(ui.map)}
          </PillLink>
        )}
        {event.wazeUrl && (
          <PillLink href={event.wazeUrl} icon="nav">
            {tr(ui.waze)}
          </PillLink>
        )}
        <PillLink href={event.calendarUrl[locale]} icon="calendar">
          {tr(ui.addToCalendar)}
        </PillLink>
      </div>
    </Card>
  );
}

export function Events({ view }: { view: InvitationView }) {
  const { tr } = useLocale();
  if (!view.subEvents.length) return null;
  return (
    <section className="px-5 py-14">
      <Reveal>
        <SectionTitle>{tr(ui.celebrations)}</SectionTitle>
      </Reveal>
      <div className="mx-auto flex max-w-[400px] flex-col gap-5">
        {view.subEvents.map((e, i) => (
          <Reveal key={e.id} delay={i * 0.05}>
            <EventCard event={e} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dress code + gifts                                                  */
/* ------------------------------------------------------------------ */

function CopyButton({ value }: { value: string }) {
  const { tr } = useLocale();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable: value is visible anyway */
        }
      }}
      className="f-body inline-flex min-h-9 items-center gap-1 rounded-full border border-[var(--line)] px-3 text-[12px] text-[var(--accent)]"
    >
      <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
      {tr(copied ? ui.copied : ui.copy)}
    </button>
  );
}

export function Details({ view }: { view: InvitationView }) {
  const { tr } = useLocale();
  if (!view.dressCode && !view.gifts) return null;
  return (
    <section className="px-5 py-10">
      <div className="mx-auto flex max-w-[400px] flex-col gap-5">
        {view.dressCode && (
          <Reveal>
            <Card className="text-center">
              <Icon name="dress" className="mx-auto h-6 w-6 text-[var(--accent)]" />
              <h3 className="f-display mt-2 text-[22px] text-[var(--ink)]">{tr(ui.dressCode)}</h3>
              <p className="f-body mt-1.5 text-[15px] text-[var(--ink-soft)]">{tr(view.dressCode)}</p>
            </Card>
          </Reveal>
        )}
        {view.gifts && (
          <Reveal>
            <Card className="text-center">
              <Icon name="gift" className="mx-auto h-6 w-6 text-[var(--accent)]" />
              <h3 className="f-display mt-2 text-[22px] text-[var(--ink)]">{tr(ui.gifts)}</h3>
              <p className="f-body mt-1.5 text-[15px] leading-relaxed text-[var(--ink-soft)]">{tr(view.gifts.message)}</p>
              {view.gifts.accounts?.map((a) => (
                <div
                  key={a.value}
                  className="mt-4 flex items-center justify-between gap-3 rounded-[12px] bg-[var(--accent-soft)] px-4 py-3"
                >
                  <div className="min-w-0 text-start">
                    <p className="f-body text-[12px] text-[var(--ink-soft)]">{tr(a.label)}</p>
                    <p className="truncate font-mono text-[14px] text-[var(--ink)]" dir="ltr">
                      {a.value}
                    </p>
                  </div>
                  <CopyButton value={a.value} />
                </div>
              ))}
            </Card>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery (optional — templates must look complete without photos)   */
/* ------------------------------------------------------------------ */

export function Gallery({ view, onOpen }: { view: InvitationView; onOpen?: (images: string[], index: number) => void }) {
  const { tr } = useLocale();
  if (!view.gallery?.length) return null;
  const srcs = view.gallery.map((g) => g.src);
  const layout = view.galleryLayout ?? "carousel";
  const tile = (img: (typeof view.gallery)[number], i: number, className: string) => (
    <button
      type="button"
      key={`${img.src}-${i}`}
      onClick={() => onOpen?.(srcs, i)}
      aria-label={`${tr(ui.enlarge)} ${i + 1}`}
      className={`group relative block overflow-hidden border border-[var(--line)] ${className}`}
    >
      <Image src={img.src} alt={tr(img.alt)} fill sizes="(max-width: 640px) 72vw, 300px" className="object-cover transition duration-700 group-hover:scale-[1.04]" loading="lazy" unoptimized />
    </button>
  );
  return (
    <section className="py-14">
      <Reveal>
        <SectionTitle>{tr(ui.gallery)}</SectionTitle>
      </Reveal>
      {layout === "carousel" && (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {view.gallery.map((img, i) => tile(img, i, "aspect-[3/4] w-[72vw] max-w-[300px] shrink-0 snap-center rounded-t-full rounded-b-[18px]"))}
        </div>
      )}
      {layout === "grid" && (
        <div className="mx-auto grid max-w-[520px] grid-cols-2 gap-2.5 px-5 sm:grid-cols-3">
          {view.gallery.map((img, i) => (
            <Reveal key={`${img.src}-${i}`} delay={(i % 6) * 0.05}>
              {tile(img, i, "aspect-square w-full rounded-[16px]")}
            </Reveal>
          ))}
        </div>
      )}
      {layout === "coverflow" && <Coverflow images={srcs} alts={view.gallery.map((g) => tr(g.alt))} onOpen={(i) => onOpen?.(srcs, i)} />}
      {layout === "masonry" && (
        <div className="mx-auto max-w-[520px] columns-2 gap-2.5 px-5">
          {view.gallery.map((img, i) => (
            <Reveal key={`${img.src}-${i}`} delay={(i % 6) * 0.05} className="mb-2.5 break-inside-avoid">
              {tile(img, i, `w-full rounded-[16px] ${["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/5]"][i % 4]}`)}
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

/** 3D coverflow: the centered photo faces you, neighbours turn away. Swipe or tap. */
function Coverflow({ images, alts, onOpen }: { images: string[]; alts: string[]; onOpen: (i: number) => void }) {
  const { tr } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      el.querySelectorAll<HTMLElement>("[data-cf]").forEach((item, i) => {
        const r = item.getBoundingClientRect();
        // Untransformed width: the rotation itself must not change the measurement.
        const d = (r.left + r.width / 2 - mid) / item.offsetWidth; // -1 … 1 per neighbour
        const c = Math.max(-2, Math.min(2, d));
        item.style.transform = `perspective(900px) rotateY(${c * -38}deg) scale(${1 - Math.min(Math.abs(c), 1.5) * 0.16})`;
        item.style.zIndex = String(10 - Math.round(Math.abs(c) * 3));
        item.style.opacity = String(1 - Math.min(Math.abs(c), 2) * 0.22);
        if (Math.abs(d) < bestD) {
          bestD = Math.abs(d);
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [images]);

  const goTo = (i: number) => {
    const el = ref.current;
    const item = el?.querySelectorAll<HTMLElement>("[data-cf]")[i];
    if (el && item) el.scrollTo({ left: item.offsetLeft - (el.clientWidth - item.clientWidth) / 2, behavior: "smooth" });
  };

  return (
    <div>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-0 overflow-x-auto py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: "calc(50% - min(31vw, 140px) + 30px)" }}
      >
        {images.map((src, i) => (
          <button
            type="button"
            key={`${src}-${i}`}
            data-cf
            onClick={() => (i === active ? onOpen(i) : goTo(i))}
            aria-label={`${tr(ui.enlarge)} ${i + 1}`}
            className="relative -mx-[30px] aspect-[3/4] w-[62vw] max-w-[280px] shrink-0 snap-center overflow-hidden rounded-[20px] border border-[var(--line)] shadow-[0_24px_44px_-22px_rgba(0,0,0,0.6)] transition-[opacity] duration-300 will-change-transform"
          >
            <Image src={src} alt={alts[i] ?? ""} fill sizes="280px" className="object-cover" loading={i < 3 ? "eager" : "lazy"} unoptimized />
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${tr(ui.photo)} ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-6 bg-[var(--accent)]" : "w-1.5 bg-[var(--line)]"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Footer — the growth channel                                         */
/* ------------------------------------------------------------------ */

export function Footer({ view }: { view: InvitationView }) {
  const { tr, locale } = useLocale();
  return (
    <footer className="px-5 pt-10 pb-12 text-center">
      <Divider />
      <p className="f-names mt-8 text-[34px] text-[var(--ink)]">
        {tr(view.partner1)} <span className="text-[var(--accent)]">{locale === "ar" ? "و" : "&"}</span>{" "}
        {tr(view.partner2)}
      </p>
      <a
        href={`${locale === "ar" ? "/" : "/en"}?ref=invite`}
        className="f-body mt-10 inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2 text-[13px] text-[var(--ink-soft)]"
      >
        {tr(ui.madeWith)}
        <span className="f-display text-[15px] text-[var(--accent)]">{locale === "ar" ? "مبروك" : "Mabrouk"}</span>
        <Star8 size={10} className="text-[var(--accent)]" />
      </a>
    </footer>
  );
}
