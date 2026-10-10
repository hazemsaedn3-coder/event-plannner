"use client";

import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ui } from "@/lib/i18n";
import type { L10n } from "@/lib/types";
import type { InvitationView } from "@/lib/view";
import { useLocale } from "../../shared/LocaleContext";
import { Divider, Icon, Star8 } from "./Ornaments";
import { Reveal } from "./Sections";

/**
 * Optional, admin-switchable sections shared by Noor and Farah. Every one
 * returns null when it has nothing to show, so switched-off or empty
 * sections leave no gaps.
 */

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="f-display text-[30px] leading-tight text-[var(--ink)]">{children}</h2>
      {sub && <p className="f-body mt-1 text-[14px] text-[var(--ink-soft)]">{sub}</p>}
      <Divider className="mt-3" />
    </div>
  );
}

function Pill({ href, icon, children, solid }: { href: string; icon: Parameters<typeof Icon>[0]["name"]; children: ReactNode; solid?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`f-body inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-[14px] transition active:scale-[0.97] ${
        solid
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
          : "border-[var(--line)] bg-[var(--accent-soft)] text-[var(--ink)]"
      }`}
    >
      <Icon name={icon} className={`h-4 w-4 ${solid ? "" : "text-[var(--accent)]"}`} />
      {children}
    </a>
  );
}

/** <img> for uploaded or remote photos (sizes vary; next/image needs known hosts). */
function Photo({ src, alt, className = "", eager }: { src: string; alt: string; className?: string; eager?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} className={`h-full w-full object-cover ${className}`} />;
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */

export function useLightbox() {
  const [state, setState] = useState<{ images: string[]; index: number } | null>(null);
  const open = useCallback((images: string[], index: number) => setState({ images, index }), []);
  const node = <Lightbox state={state} onClose={() => setState(null)} onIndex={(index) => setState((s) => (s ? { ...s, index } : s))} />;
  return { open, node };
}

function Lightbox({
  state,
  onClose,
  onIndex,
}: {
  state: { images: string[]; index: number } | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const { tr, locale } = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<number | null>(null);
  const count = state?.images.length ?? 0;
  const go = useCallback(
    (delta: number) => state && onIndex((state.index + delta + count) % count),
    [state, count, onIndex],
  );

  useEffect(() => {
    if (!state) return;
    closeRef.current?.focus();
    const rtl = locale === "ar";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(rtl ? -1 : 1);
      if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [state, go, onClose, locale]);

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US");
  return (
    <AnimatePresence>
      {state && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label={tr(ui.photo)}
          className="fixed inset-0 z-[90] flex flex-col bg-black/92 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current == null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            touch.current = null;
            if (Math.abs(dx) > 50) go((dx < 0 ? 1 : -1) * (locale === "ar" ? -1 : 1));
          }}
        >
          <div className="flex items-center justify-between p-3 text-white">
            <span className="f-body px-2 text-[14px] text-white/75" dir="ltr">
              {nf.format(state.index + 1)} / {nf.format(count)}
            </span>
            <button ref={closeRef} type="button" onClick={onClose} aria-label={tr(ui.close)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <AnimatePresence mode="popLayout" initial={false}>
              <m.img
                key={state.images[state.index]}
                src={state.images[state.index]}
                alt=""
                className="max-h-full max-w-full rounded-[10px] object-contain shadow-2xl"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
              />
            </AnimatePresence>
            {count > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label={tr(ui.previous)} className="absolute start-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                  <Icon name="chevron" className="h-5 w-5 ltr:rotate-180" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label={tr(ui.next)} className="absolute end-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                  <Icon name="chevron" className="h-5 w-5 rtl:rotate-180" />
                </button>
              </>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** A horizontally scrolling, snapping strip with dots. */
function Carousel({ images, onOpen, aspect = "aspect-[4/3]", width = "w-[86vw] max-w-[520px]", rounded = "rounded-[20px]" }: { images: string[]; onOpen: (i: number) => void; aspect?: string; width?: string; rounded?: string }) {
  const { tr } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setActive(Number((en.target as HTMLElement).dataset.i))),
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll("[data-i]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [images]);

  return (
    <div>
      <div ref={ref} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <button
            type="button"
            key={`${src}-${i}`}
            data-i={i}
            onClick={() => onOpen(i)}
            aria-label={`${tr(ui.enlarge)} ${i + 1}`}
            className={`group relative ${aspect} ${width} shrink-0 snap-center overflow-hidden ${rounded} border border-[var(--line)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]`}
          >
            <Photo src={src} alt="" eager={i === 0} className="transition duration-700 group-hover:scale-[1.04]" />
          </button>
        ))}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {images.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-5 bg-[var(--accent)]" : "w-1.5 bg-[var(--line)]"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Couple photos                                                       */
/* ------------------------------------------------------------------ */

export function CouplePhotos({ view }: { view: InvitationView }) {
  const { tr } = useLocale();
  const { open, node } = useLightbox();
  const c = view.couple;
  if (!c?.images.length) return null;
  // "arch": the first photo already sits in the hero arch.
  const images = c.layout === "arch" ? c.images.slice(1) : c.images;
  if (!images.length) return null;
  const all = c.images;
  const offset = all.length - images.length;
  const show = (i: number) => open(all, i + offset);
  const layout = c.layout === "arch" ? "filmstrip" : c.layout;

  return (
    <section className="py-14">
      <Reveal>
        <Title>{tr(ui.ourPhotos)}</Title>
      </Reveal>

      {layout === "polaroid" && (
        <div className="mx-auto flex max-w-[460px] flex-wrap justify-center gap-x-2 gap-y-5 px-5">
          {images.map((src, i) => (
            <Reveal key={`${src}-${i}`} delay={i * 0.07}>
              <button
                type="button"
                onClick={() => show(i)}
                aria-label={`${tr(ui.enlarge)} ${i + 1}`}
                className="block bg-white p-2 pb-8 shadow-[0_16px_34px_-16px_rgba(0,0,0,0.5)] transition hover:z-10 hover:rotate-0"
                style={{ transform: `rotate(${[-4, 3, -2, 4, -3, 2][i % 6]}deg)`, width: images.length === 1 ? 260 : 170 }}
              >
                <span className={`block ${images.length === 1 ? "aspect-[4/5]" : "aspect-square"} overflow-hidden`}>
                  <Photo src={src} alt="" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      )}

      {layout === "filmstrip" && (
        <Reveal>
          <Carousel images={images} onOpen={show} aspect="aspect-[3/4]" width="w-[64vw] max-w-[300px]" rounded="rounded-t-full rounded-b-[18px]" />
        </Reveal>
      )}

      {layout === "mosaic" && (
        <div className="mx-auto grid max-w-[460px] grid-cols-2 gap-2.5 px-5">
          {images.map((src, i) => (
            <Reveal key={`${src}-${i}`} delay={i * 0.06} className={i === 0 && images.length % 2 === 1 ? "col-span-2" : ""}>
              <button
                type="button"
                onClick={() => show(i)}
                aria-label={`${tr(ui.enlarge)} ${i + 1}`}
                className={`block w-full overflow-hidden rounded-[16px] border border-[var(--line)] ${i === 0 && images.length % 2 === 1 ? "aspect-[16/11]" : "aspect-[3/4]"}`}
              >
                <Photo src={src} alt="" />
              </button>
            </Reveal>
          ))}
        </div>
      )}
      {node}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Venue showcase                                                      */
/* ------------------------------------------------------------------ */

export function VenueShowcase({ view }: { view: InvitationView }) {
  const { tr } = useLocale();
  const { open, node } = useLightbox();
  const v = view.venueShowcase;
  if (!v) return null;
  const imgs = v.images;

  return (
    <section className="py-14">
      <Reveal>
        <Title sub={tr(v.venueName)}>{v.title ? tr(v.title) : tr(ui.theVenue)}</Title>
      </Reveal>

      {imgs.length > 0 && v.layout === "hero" && (
        <Reveal>
          <div className="px-4">
            <button
              type="button"
              onClick={() => open(imgs, 0)}
              aria-label={`${tr(ui.enlarge)} 1`}
              className="group relative mx-auto block aspect-[4/5] w-full max-w-[520px] overflow-hidden rounded-[26px] border border-[var(--line)] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.6)] sm:aspect-[16/10]"
            >
              <Photo src={imgs[0]} alt="" eager className="transition duration-[1400ms] group-hover:scale-[1.05]" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-5 text-start text-white">
                <span className="f-display block text-[26px] leading-tight">{tr(v.venueName)}</span>
                {v.venueAddress && <span className="f-body mt-0.5 block text-[14px] text-white/80">{tr(v.venueAddress)}</span>}
              </span>
              <span className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur">
                <Icon name="expand" className="h-4 w-4" />
              </span>
            </button>
            {imgs.length > 1 && (
              <div className="mx-auto mt-2.5 grid max-w-[520px] grid-cols-4 gap-2">
                {imgs.slice(1, 5).map((src, i) => (
                  <button
                    type="button"
                    key={`${src}-${i}`}
                    onClick={() => open(imgs, i + 1)}
                    aria-label={`${tr(ui.enlarge)} ${i + 2}`}
                    className="relative aspect-square overflow-hidden rounded-[12px] border border-[var(--line)]"
                  >
                    <Photo src={src} alt="" />
                    {i === 3 && imgs.length > 5 && (
                      <span className="f-display absolute inset-0 flex items-center justify-center bg-black/50 text-[20px] text-white">+{imgs.length - 5}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      )}

      {imgs.length > 0 && v.layout === "carousel" && (
        <Reveal>
          <Carousel images={imgs} onOpen={(i) => open(imgs, i)} />
        </Reveal>
      )}

      {imgs.length > 0 && v.layout === "grid" && (
        <div className="mx-auto grid max-w-[520px] grid-cols-2 gap-2.5 px-5">
          {imgs.map((src, i) => (
            <Reveal key={`${src}-${i}`} delay={(i % 4) * 0.06} className={i === 0 ? "col-span-2" : ""}>
              <button
                type="button"
                onClick={() => open(imgs, i)}
                aria-label={`${tr(ui.enlarge)} ${i + 1}`}
                className={`block w-full overflow-hidden rounded-[16px] border border-[var(--line)] ${i === 0 ? "aspect-[16/10]" : "aspect-square"}`}
              >
                <Photo src={src} alt="" />
              </button>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal>
        <div className="mx-auto mt-7 max-w-[420px] px-6 text-center">
          {v.layout !== "hero" && (
            <>
              <p className="f-display text-[22px] text-[var(--ink)]">{tr(v.venueName)}</p>
              {v.venueAddress && <p className="f-body text-[14px] text-[var(--ink-soft)]">{tr(v.venueAddress)}</p>}
            </>
          )}
          {v.story && <p className="f-body mt-4 text-[15px] leading-relaxed whitespace-pre-line text-[var(--ink-soft)]">{tr(v.story)}</p>}
          {(v.mapsUrl || v.directionsUrl) && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {v.directionsUrl && (
                <Pill href={v.directionsUrl} icon="nav" solid>
                  {tr(ui.directions)}
                </Pill>
              )}
              {v.mapsUrl && (
                <Pill href={v.mapsUrl} icon="pin">
                  {tr(ui.map)}
                </Pill>
              )}
            </div>
          )}
        </div>
      </Reveal>
      {node}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

export function Timeline({ view }: { view: InvitationView }) {
  const { tr } = useLocale();
  if (!view.timeline?.length) return null;
  return (
    <section className="px-6 py-14">
      <Reveal>
        <Title>{tr(ui.schedule)}</Title>
      </Reveal>
      <ol className="relative mx-auto max-w-[380px]">
        <span className="absolute inset-y-2 start-[94px] w-px bg-gradient-to-b from-transparent via-[var(--line)] to-transparent" aria-hidden />
        {view.timeline.map((s, i) => (
          <li key={i} className="relative pb-8 last:pb-0">
            <Reveal delay={i * 0.06} className="grid grid-cols-[72px_28px_1fr] items-start gap-x-2">
              <span className="f-display pt-0.5 text-end text-[16px] leading-tight text-[var(--accent)]">{tr(s.time)}</span>
              <span className="relative z-10 mt-1 flex h-6 w-6 items-center justify-center justify-self-center rounded-full border border-[var(--line)] bg-[var(--bg)] text-[var(--accent)]">
                <Star8 size={11} />
              </span>
              <span>
                <span className="f-display block text-[20px] leading-snug text-[var(--ink)]">{tr(s.title)}</span>
                {s.note && <span className="f-body mt-0.5 block text-[14px] leading-relaxed text-[var(--ink-soft)]">{tr(s.note)}</span>}
              </span>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Contact + notes                                                     */
/* ------------------------------------------------------------------ */

export function Contacts({ view }: { view: InvitationView }) {
  const { tr } = useLocale();
  if (!view.contacts?.length) return null;
  return (
    <section className="px-5 py-12">
      <Reveal>
        <Title>{tr(ui.contactUs)}</Title>
      </Reveal>
      <div className="mx-auto flex max-w-[400px] flex-col gap-3">
        {view.contacts.map((c, i) => {
          const digits = c.phone.replace(/\D/g, "");
          return (
            <Reveal key={i} delay={i * 0.06}>
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
                <div className="min-w-0">
                  <p className="f-display truncate text-[20px] text-[var(--ink)]">{tr(c.name)}</p>
                  <p className="f-body text-[13px] text-[var(--ink-soft)]" dir="ltr">
                    +{digits}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a href={`tel:+${digits}`} aria-label={`${tr(ui.call)} ${tr(c.name)}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] text-[var(--accent)]">
                    <Icon name="phone" className="h-5 w-5" />
                  </a>
                  <a
                    href={`https://wa.me/${digits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${tr(ui.whatsapp)} ${tr(c.name)}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)]"
                  >
                    <Icon name="chat" className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function Notes({ view }: { view: InvitationView }) {
  const { tr } = useLocale();
  if (!view.notes) return null;
  return (
    <section className="px-5 py-10">
      <Reveal>
        <div className="mx-auto max-w-[400px] rounded-[18px] border border-[var(--line)] bg-[var(--surface)] px-6 py-7 text-center">
          <Icon name="note" className="mx-auto h-6 w-6 text-[var(--accent)]" />
          <h3 className="f-display mt-2 text-[22px] text-[var(--ink)]">{view.notes.title ? tr(view.notes.title) : tr(ui.notes)}</h3>
          <p className="f-body mt-2 text-[15px] leading-relaxed whitespace-pre-line text-[var(--ink-soft)]">{tr(view.notes.body)}</p>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Social sharing                                                      */
/* ------------------------------------------------------------------ */

export function ShareInvite({ view }: { view: InvitationView }) {
  const { tr, locale } = useLocale();
  const [copied, setCopied] = useState(false);
  const url = view.shareUrl;
  if (!url) return null;
  const couple: L10n = {
    ar: `${view.partner1.ar} و${view.partner2.ar}`,
    en: `${view.partner1.en} & ${view.partner2.en}`,
  };
  const text = locale === "ar" ? `دعوة فرح ${couple.ar} 💌` : `${couple.en}'s wedding invitation 💌`;
  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text}\n${url}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
  ];
  const btn =
    "f-body inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-[14px] text-[var(--ink)] transition active:scale-[0.97]";

  return (
    <section className="px-5 py-12">
      <Reveal>
        <div className="mx-auto max-w-[400px] text-center">
          <Icon name="share" className="mx-auto h-6 w-6 text-[var(--accent)]" />
          <h3 className="f-display mt-2 text-[24px] text-[var(--ink)]">{tr(ui.share)}</h3>
          <p className="f-body mt-1 text-[14px] text-[var(--ink-soft)]">{tr(ui.shareBody)}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={btn}>
                {l.label}
              </a>
            ))}
            <button
              type="button"
              className={btn}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                } catch {
                  window.prompt(tr(ui.copyLink), url);
                }
              }}
            >
              <Icon name={copied ? "check" : "copy"} className="h-4 w-4 text-[var(--accent)]" />
              {tr(copied ? ui.copied : ui.copyLink)}
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                if (typeof navigator !== "undefined" && "share" in navigator) {
                  navigator.share({ title: text, url }).catch(() => undefined);
                } else {
                  window.open(links[0].href, "_blank", "noopener");
                }
              }}
            >
              {tr(ui.more)}
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
