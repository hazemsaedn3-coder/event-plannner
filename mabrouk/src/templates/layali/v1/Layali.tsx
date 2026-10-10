"use client";

import "./layali.css";
import "../../shared/still.css";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { dirOf, t, ui } from "@/lib/i18n";
import type { L10n, Locale } from "@/lib/types";
import { shows, type InvitationView } from "@/lib/view";
import { LocaleContext, useLocale } from "../../shared/LocaleContext";
import { createMusicPlayer, type MusicPlayer } from "../../shared/music";
import { InvitationSections } from "../../noor/v1/Body";
import { DateParts, Dot } from "../../noor/v1/Ornaments";
import { layaliLook, pageVars, type LayaliLook } from "./looks";
import { EmbossedPaper, RegionBand, WaxSeal } from "./Paper";

type Stage = "sealed" | "breaking" | "opening" | "rising" | "zooming" | "open";

const S = {
  tap: { ar: "اضغط على الختم لفتح الدعوة", en: "Tap the seal to open" },
  invited: { ar: "بكل الحب ندعوكم", en: "You are warmly invited" },
  scroll: { ar: "مرّر للأسفل", en: "Scroll" },
};

/* Deterministic particle layouts (same on server and client). */
const DUST = Array.from({ length: 22 }, (_, i) => ({ left: (i * 37) % 100, size: 3 + (i % 4) * 2, delay: (i * 0.9) % 9, dur: 9 + (i % 5) * 2, dx: ((i % 7) - 3) * 14 }));
const PETALS = Array.from({ length: 12 }, (_, i) => ({ left: (i * 23 + 7) % 100, delay: (i * 1.3) % 10, dur: 10 + (i % 4) * 3, dx: ((i % 5) - 2) * 40, scale: 0.7 + (i % 3) * 0.25 }));
const SMOKE = Array.from({ length: 9 }, (_, i) => ({ left: (i * 31 + 6) % 92, size: 90 + (i % 4) * 30, delay: (i * 1.7) % 12, dur: 13 + (i % 4) * 3, dx: ((i % 5) - 2) * 30 }));
const LANTERNS = Array.from({ length: 12 }, (_, i) => ({ left: (i * 29 + 5) % 96, top: (i * 41 + 8) % 80, size: 24 + (i % 4) * 18, delay: (i * 0.7) % 5, dur: 5 + (i % 3) * 2, dx: ((i % 5) - 2) * 10 }));

function foilVars(l: LayaliLook): CSSProperties {
  return { "--foil-a": l.foil[0], "--foil-b": l.foil[1], "--foil-c": l.foil[2] } as CSSProperties;
}

/**
 * Layali v1 — a cinematic invitation. A real-time, embossed 3D envelope:
 * tap the wax seal (personalised with the couple's initials), it cracks,
 * the flap opens, the card rises and the camera moves through it into a
 * film-like hero. Then every shared section, styled in the look's colors.
 */
export default function LayaliInvitation({ view, look: lookId }: { view: InvitationView; look?: string }) {
  const look = layaliLook(lookId);
  const [locale, setLocale] = useState<Locale>(view.initialLocale);
  const [stage, setStage] = useState<Stage>("sealed");
  const [playing, setPlaying] = useState(false);
  const player = useRef<MusicPlayer | null>(null);
  const externalMusic = Boolean(view.music.external);
  const musicOn = shows(view, "music");
  const still = !shows(view, "animations");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);

  useEffect(() => {
    document.body.style.overflow = stage === "open" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage]);

  useEffect(() => {
    const onHide = () => {
      if (document.hidden && player.current?.playing) {
        player.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    const pending = timers.current;
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      pending.forEach((id) => window.clearTimeout(id));
      player.current?.dispose();
    };
  }, []);

  const startMusic = useCallback(async () => {
    player.current ??= createMusicPlayer(view.music.src);
    try {
      await player.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [view.music.src]);

  const slug = view.slug;
  const open = useCallback(() => {
    if (stage !== "sealed") {
      // A second tap skips the film.
      if (stage !== "open") setStage("open");
      return;
    }
    if (!externalMusic && musicOn) void startMusic();
    const body = JSON.stringify({ slug, locale });
    try {
      if (!navigator.sendBeacon?.("/api/view", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/view", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      /* analytics must never break the invitation */
    }
    if (still) {
      setStage("open");
      return;
    }
    const seq: [Stage, number][] = [
      ["breaking", 0],
      ["opening", 650],
      ["rising", 1500],
      ["zooming", 2700],
      ["open", 3600],
    ];
    for (const [s, at] of seq) timers.current.push(window.setTimeout(() => setStage(s), at));
  }, [stage, externalMusic, musicOn, startMusic, slug, locale, still]);

  const ctx = useMemo(() => ({ locale, setLocale, tr: (text: L10n) => t(text, locale) }), [locale, setLocale]);
  const monogram = `${view.monogram[locale][0]}${locale === "ar" ? "" : "&"}${view.monogram[locale][1]}`;
  const heroPhoto = view.couple?.images[0] ?? view.venueShowcase?.images[0] ?? view.heroImage;

  return (
    <LocaleContext.Provider value={ctx}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion={still ? "always" : "user"}>
          <div
            lang={locale}
            dir={dirOf(locale)}
            className={`relative min-h-[100svh] overflow-x-clip ${still ? "mbk-still" : ""}`}
            style={{ ...pageVars(look), ...foilVars(look) }}
          >
            <TopBar
              look={look}
              showMusic={!externalMusic && musicOn}
              playing={playing}
              onToggleMusic={() => {
                if (player.current?.playing) {
                  player.current.pause();
                  setPlaying(false);
                } else void startMusic();
              }}
              locale={locale}
              onToggleLocale={() => setLocale((l) => (l === "ar" ? "en" : "ar"))}
            />

            <main className="relative">
              <Hero view={view} look={look} photo={heroPhoto} revealed={stage === "open" || stage === "zooming"} />
              <div className="relative isolate">
                <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
                  <EmbossedPaper uid={`page-${slug}`} motif={look.motif} color="transparent" strength={look.page.dark ? 0.08 : 0.16} vignette={false} />
                </div>
                <InvitationSections view={view} heroShowsCouplePhoto={false} />
                <div className="h-24" />
              </div>
            </main>

            <AnimatePresence>
              {stage !== "open" && (
                <m.div key="intro" className="fixed inset-0 z-[70]" exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
                  <EnvelopeScene look={look} view={view} stage={stage} monogram={monogram} onOpen={open} uid={slug} />
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </MotionConfig>
      </LazyMotion>
    </LocaleContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* The envelope film                                                   */
/* ------------------------------------------------------------------ */

const FLAP_CLIP = "polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)";
const POCKET_CLIP = "polygon(0 34.7%,50% 56%,100% 34.7%,100% 100%,0 100%)";

function EnvelopeScene({ look, view, stage, monogram, onOpen, uid }: { look: LayaliLook; view: InvitationView; stage: Stage; monogram: string; onOpen: () => void; uid: string }) {
  const { tr, locale } = useLocale();
  const after = (s: Stage) => ["breaking", "opening", "rising", "zooming", "open"].indexOf(stage) >= ["breaking", "opening", "rising", "zooming", "open"].indexOf(s);
  const sealed = stage === "sealed";
  const ease = [0.65, 0, 0.35, 1] as const;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={tr(S.tap)}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="absolute inset-0 cursor-pointer overflow-hidden outline-none"
      style={{ background: `radial-gradient(120% 80% at 50% 40%, ${look.page.bg} 0%, ${look.page.bg2} 70%)` }}
    >
      {/* The whole envelope steps back when opened, then the camera dives into the card. */}
      <m.div
        className="absolute inset-0"
        style={{ perspective: 1600 }}
        initial={false}
        animate={
          after("zooming")
            ? { scale: 2.4, y: "18%", opacity: 0 }
            : after("breaking")
              ? { scale: 0.8, y: "10%", opacity: 1 }
              : { scale: 1, y: "0%", opacity: 1 }
        }
        transition={{ duration: after("zooming") ? 0.9 : 0.9, ease }}
      >
        <div className={`absolute inset-0 overflow-visible ${after("breaking") ? "rounded-[18px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]" : ""}`}>
          {/* Inside of the envelope */}
          <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
            <EmbossedPaper uid={`${uid}-back`} motif={look.motif} color={look.lining} strength={0.45} />
          </div>

          {/* The card */}
          <m.div
            className="absolute right-[9%] left-[9%] overflow-hidden rounded-[10px] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)]"
            style={{ top: "40%", height: "46%", background: look.card.bg, zIndex: after("zooming") ? 40 : 10 }}
            initial={false}
            animate={after("rising") ? { y: "-62%" } : { y: "0%" }}
            transition={{ duration: 1.1, ease }}
          >
            <Card look={look} view={view} locale={locale} />
          </m.div>

          {/* Front pocket */}
          <div className="absolute inset-0 z-20 overflow-hidden rounded-[inherit]" style={{ clipPath: POCKET_CLIP }}>
            <EmbossedPaper uid={`${uid}-pocket`} motif={look.motif} color={look.paper} />
          </div>
          {look.band && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[9%] z-20" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,.35))" }}>
              <RegionBand uid={`${uid}-env`} band={look.band} height={26} />
            </div>
          )}
          {/* Foil line along the pocket edge */}
          <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id={`edge-${uid}`} x1="0" x2="1">
                <stop offset="0" stopColor={look.foil[2]} />
                <stop offset=".5" stopColor={look.foil[0]} />
                <stop offset="1" stopColor={look.foil[2]} />
              </linearGradient>
            </defs>
            <path d="M0 34.7 L50 56 L100 34.7" fill="none" stroke={`url(#edge-${uid})`} strokeWidth="0.35" vectorEffect="non-scaling-stroke" opacity=".85" />
          </svg>

          {/* Flap: two faces, hinged at the top */}
          <m.div
            className="absolute inset-x-0 top-0"
            style={{ height: "56%", transformOrigin: "50% 0%", transformStyle: "preserve-3d", zIndex: after("rising") ? 5 : 30 }}
            initial={false}
            animate={{ rotateX: after("opening") ? 178 : 0 }}
            transition={{ duration: 1, ease }}
          >
            <div className="absolute inset-0" style={{ clipPath: FLAP_CLIP, backfaceVisibility: "hidden", filter: "drop-shadow(0 10px 14px rgba(0,0,0,.45))" }}>
              <EmbossedPaper uid={`${uid}-flap`} motif={look.motif} color={look.flap} relief={4} />
            </div>
            <div className="absolute inset-0" style={{ clipPath: FLAP_CLIP, backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
              <EmbossedPaper uid={`${uid}-lining`} motif={look.motif} color={look.lining} strength={0.5} />
            </div>
          </m.div>

          {/* Seal (whole, then two halves) */}
          {sealed ? (
            <div className="lyl-breathe absolute top-[56%] left-1/2 z-40" style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,.45))" }}>
              <div className="lyl-shine relative rounded-full">
                <WaxSeal uid={`${uid}-seal`} colors={look.seal} monogram={monogram} size={112} />
              </div>
            </div>
          ) : (
            <div className="absolute top-[56%] left-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
              {(["left", "right"] as const).map((half) => (
                <m.div
                  key={half}
                  className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
                  style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,.45))" }}
                  initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                  animate={{ x: half === "left" ? -70 : 70, y: 160, rotate: half === "left" ? -35 : 35, opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.3, 0, 0.7, 1] }}
                >
                  <WaxSeal uid={`${uid}-seal-${half}`} colors={look.seal} monogram={monogram} size={112} half={half} />
                </m.div>
              ))}
              <Burst look={look} />
            </div>
          )}
        </div>
      </m.div>

      {/* Hint */}
      <AnimatePresence>
        {sealed && (
          <m.div exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 top-[68%] z-50 flex flex-col items-center gap-1.5 px-6 text-center">
            <span className="absolute inset-x-[12%] -inset-y-3 -z-10 rounded-[28px] blur-xl" style={{ background: `radial-gradient(closest-side, ${look.paper}F2, ${look.paper}00)` }} />
            <p className="lyl-pulse text-[13px] tracking-[0.3em] uppercase" style={{ color: look.envelopeInk, fontFamily: "var(--font-cormorant), serif" }}>
              {locale === "ar" ? "" : tr(S.tap)}
            </p>
            {locale === "ar" && (
              <p className="lyl-pulse text-[16px]" style={{ color: look.envelopeInk, fontFamily: "var(--font-amiri), serif" }}>
                {tr(S.tap)}
              </p>
            )}
            <p className="mt-1 text-[22px]" style={{ color: look.envelopeInk, fontFamily: "var(--font-aref), var(--font-pinyon), serif" }}>
              {tr(view.partner1)} {locale === "ar" ? "و" : "&"} {tr(view.partner2)}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Gold dust that bursts out when the seal cracks. */
function Burst({ look }: { look: LayaliLook }) {
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <m.span
            key={i}
            className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full"
            style={{ background: look.foil[0], boxShadow: `0 0 8px ${look.foil[1]}` }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * (70 + (i % 3) * 30), y: Math.sin(a) * (70 + (i % 3) * 30), opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
    </>
  );
}

function Card({ look, view, locale }: { look: LayaliLook; view: InvitationView; locale: Locale }) {
  const tr = (x: L10n) => t(x, locale);
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-5 text-center" style={{ color: look.card.ink }}>
      {look.band && (
        <>
          <RegionBand uid={`${view.slug}-card-t`} band={look.band} height={12} className="absolute inset-x-0 top-0" />
          <RegionBand uid={`${view.slug}-card-b`} band={look.band} height={12} className="absolute inset-x-0 bottom-0" />
        </>
      )}
      <div className="pointer-events-none absolute inset-2 rounded-[6px] border" style={{ borderColor: `${look.card.accent}88`, ...(look.band ? { top: 18, bottom: 18 } : {}) }} />
      <div className="pointer-events-none absolute inset-3.5 rounded-[4px] border" style={{ borderColor: `${look.card.accent}44`, ...(look.band ? { top: 24, bottom: 24 } : {}) }} />
      <p className="text-[13px]" style={{ color: look.card.accent, fontFamily: "var(--font-amiri), var(--font-cormorant), serif" }}>
        {tr(look.invited ?? S.invited)}
      </p>
      <p className="mt-3 text-[34px] leading-[1.25]" style={{ fontFamily: "var(--f-names)" }}>
        {tr(view.partner1)}
      </p>
      <p className="text-[20px]" style={{ color: look.card.accent, fontFamily: "var(--f-names)" }}>
        {locale === "ar" ? "و" : "&"}
      </p>
      <p className="text-[34px] leading-[1.25]" style={{ fontFamily: "var(--f-names)" }}>
        {tr(view.partner2)}
      </p>
      <p className="mt-3 text-[15px] tracking-[0.12em]" style={{ fontFamily: "var(--font-cormorant), var(--font-amiri), serif" }}>
        <DateParts parts={view.main.numeric[locale]} />
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Particles({ look }: { look: LayaliLook }) {
  if (look.particles === "petals")
    return (
      <>
        {PETALS.map((p, i) => (
          <span key={i} className="lyl-petal" style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, scale: String(p.scale), "--dx": `${p.dx}px` } as CSSProperties} />
        ))}
      </>
    );
  if (look.particles === "incense")
    return (
      <>
        {SMOKE.map((p, i) => (
          <span key={i} className="lyl-smoke" style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.6, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, "--dx": `${p.dx}px` } as CSSProperties} />
        ))}
        {DUST.slice(0, 12).map((p, i) => (
          <span key={`d${i}`} className="lyl-dust" style={{ left: `${p.left}%`, bottom: 0, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, "--dx": `${p.dx}px` } as CSSProperties} />
        ))}
      </>
    );
  if (look.particles === "lanterns")
    return (
      <>
        {LANTERNS.map((p, i) => (
          <span
            key={i}
            className="lyl-lantern"
            style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, "--dx": `${p.dx}px` } as CSSProperties}
          />
        ))}
        {DUST.slice(0, 10).map((p, i) => (
          <span key={`d${i}`} className="lyl-dust" style={{ left: `${p.left}%`, bottom: 0, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, "--dx": `${p.dx}px` } as CSSProperties} />
        ))}
      </>
    );
  return (
    <>
      {DUST.map((p, i) => (
        <span key={i} className="lyl-dust" style={{ left: `${p.left}%`, bottom: 0, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, "--dx": `${p.dx}px` } as CSSProperties} />
      ))}
    </>
  );
}

function Hero({ view, look, photo, revealed }: { view: InvitationView; look: LayaliLook; photo?: string; revealed: boolean }) {
  const { tr, locale } = useLocale();
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 22, filter: "blur(8px)" },
    animate: revealed ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 22, filter: "blur(8px)" },
    transition: { duration: 1.3, ease: [0.22, 1, 0.36, 1] as const, delay },
  });
  const onPhoto = Boolean(photo);
  const ink = onPhoto ? "#FFFFFF" : look.page.ink;

  return (
    <section
      className="relative isolate z-10 flex min-h-[100svh] items-center justify-center overflow-hidden px-6 py-24 text-center"
      style={{ background: look.shade, ...(photo ? ({ "--foil-a": "#FFF6DA", "--foil-b": look.foil[0], "--foil-c": "#FFFFFF" } as CSSProperties) : {}) }}
    >
      {photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="lyl-kenburns absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${look.shade}D9 0%, ${look.shade}73 30%, ${look.shade}99 62%, ${look.page.bg} 100%)` }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(70% 50% at 50% 45%, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.5) 100%)" }} />
        </>
      ) : (
        <EmbossedPaper uid={`hero-${view.slug}`} motif={look.motif} color={look.page.bg} strength={0.5} />
      )}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Particles look={look} />
      </div>

      {look.band && (
        <>
          <RegionBand uid={`${view.slug}-hero-t`} band={look.band} height={20} className="absolute inset-x-0 top-0 z-[1]" />
          <RegionBand uid={`${view.slug}-hero-b`} band={look.band} height={20} className="absolute inset-x-0 bottom-0 z-[1]" />
        </>
      )}
      {/* Foil frame */}
      <div className="pointer-events-none absolute inset-4 rounded-[28px] border" style={{ borderColor: `${look.foil[1]}66` }} />
      <div className="pointer-events-none absolute inset-6 rounded-[22px] border" style={{ borderColor: `${look.foil[1]}33` }} />

      <div className="relative max-w-[420px]" style={{ color: ink, filter: onPhoto ? "drop-shadow(0 2px 14px rgba(0,0,0,0.55))" : undefined }}>
        {view.opening && (
          <m.p {...reveal(0.1)} className="f-body text-[15px]" style={{ color: onPhoto ? look.foil[0] : look.page.accent }}>
            {tr(view.opening)}
          </m.p>
        )}
        <m.p {...reveal(0.3)} className="f-body mx-auto mt-4 max-w-[300px] text-[15px] leading-relaxed opacity-90">
          {tr(view.hostsLine)}
        </m.p>
        <m.h1 {...reveal(0.55)} className="lyl-foil-text mt-6 text-[64px] leading-[1.15]" style={{ fontFamily: "var(--f-names)" }}>
          {tr(view.partner1)}
        </m.h1>
        <m.p {...reveal(0.75)} className="lyl-foil-text text-[36px] leading-none" style={{ fontFamily: "var(--f-names)" }}>
          {locale === "ar" ? "و" : "&"}
        </m.p>
        <m.p {...reveal(0.95)} className="lyl-foil-text text-[64px] leading-[1.15]" style={{ fontFamily: "var(--f-names)" }}>
          {tr(view.partner2)}
        </m.p>
        <m.div {...reveal(1.2)} className="mx-auto mt-6 flex max-w-[260px] items-center gap-3" aria-hidden>
          <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${look.foil[1]})` }} />
          <span className="h-2 w-2 rotate-45" style={{ background: look.foil[1] }} />
          <span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${look.foil[1]})` }} />
        </m.div>
        <m.p {...reveal(1.35)} className="f-display mt-5 text-[30px] ltr:tracking-[0.14em]">
          <DateParts parts={view.main.numeric[locale]} />
        </m.p>
        <m.p {...reveal(1.5)} className="f-body mt-1 text-[15px] opacity-90">
          {tr(view.main.date)}
          <Dot />
          {tr(view.main.time)}
        </m.p>
        <m.p {...reveal(1.65)} className="f-body mt-4 text-[15px] opacity-90">
          {tr(view.inviteLine)}
        </m.p>
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={revealed ? { opacity: 1 } : {}}
        transition={{ delay: 2.2 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
        style={{ color: onPhoto ? "#fff" : look.page.accent }}
        aria-hidden
      >
        <span className="f-body text-[12px] opacity-80">{tr(S.scroll)}</span>
        <svg className="lyl-cue" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </m.div>
    </section>
  );
}

function TopBar({
  look,
  showMusic,
  playing,
  onToggleMusic,
  locale,
  onToggleLocale,
}: {
  look: LayaliLook;
  showMusic: boolean;
  playing: boolean;
  onToggleMusic: () => void;
  locale: Locale;
  onToggleLocale: () => void;
}) {
  const btn = "pointer-events-auto flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-[14px] backdrop-blur-md transition active:scale-95";
  const style = look.page.dark
    ? { background: `${look.page.bg2}99`, color: look.foil[0], border: `1px solid ${look.foil[1]}55` }
    : { background: `${look.page.surface}D9`, color: look.page.ink, border: `1px solid ${look.page.accent}55` };
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-between p-3.5">
      {showMusic ? (
        <button type="button" className={btn} style={style} onClick={onToggleMusic} aria-pressed={playing} aria-label={t(ui.music, locale)}>
          {playing ? "♪" : "♫"}
        </button>
      ) : (
        <span />
      )}
      <button type="button" className={`${btn} ${locale === "ar" ? "font-[family-name:var(--font-cormorant)]" : "font-[family-name:var(--font-amiri)]"}`} style={style} onClick={onToggleLocale} lang={locale === "ar" ? "en" : "ar"}>
        {t(ui.language, locale)}
      </button>
    </div>
  );
}
