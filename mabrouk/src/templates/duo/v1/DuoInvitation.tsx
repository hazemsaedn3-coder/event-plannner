"use client";

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { BUILTIN_TRACKS } from "@/catalog/builtin-tracks";
import { useDemoAudio } from "@/components/demo/DemoAudio";
import { dirOf, t, ui } from "@/lib/i18n";
import type { L10n, Locale } from "@/lib/types";
import type { InvitationView } from "@/lib/view";
import { LocaleContext, useLocale } from "../../shared/LocaleContext";
import { createMusicPlayer, type MusicPlayer } from "../../shared/music";
import { DateParts, Dot } from "../../noor/v1/Ornaments";
import { Rsvp } from "../../noor/v1/Rsvp";
import { Countdown, Details, Events, Footer } from "../../noor/v1/Sections";

type Side = "bride" | "groom";

export interface DuoSideCopy {
  gateLabel: L10n;
  title: L10n;
  message: L10n;
  trackId: string;
}

export interface DuoCopy {
  gateQuestion: L10n;
  bride: DuoSideCopy;
  groom: DuoSideCopy;
}

const S = {
  forBride: { ar: "لصحاب العروسة", en: "For the bride's friends" },
  forGroom: { ar: "لصحاب العريس", en: "For the groom's friends" },
  switchToBride: { ar: "شوف دعوة صحاب العروسة 💗", en: "See the bride's friends' invite 💗" },
  switchToGroom: { ar: "شوف دعوة صحاب العريس 🥁", en: "See the groom's friends' invite 🥁" },
  back: { ar: "رجوع", en: "Back" },
  marquee: { ar: "الفرح فرحنا ✦ الليلة ليلتنا ✦ منورين يا رجالة ✦", en: "IT'S OUR PARTY ✦ TONIGHT IS OUR NIGHT ✦ LET'S GO ✦" },
  tap: { ar: "اضغط على طرفك", en: "Tap your side" },
};

/* Deterministic particle layouts (identical on server and client). */
const HEARTS = [6, 18, 31, 44, 57, 69, 82, 93].map((left, i) => ({ left, delay: i * 1.3, dur: 9 + (i % 3) * 2, size: 14 + (i % 4) * 6 }));
const PETALS = [10, 27, 48, 66, 85].map((left, i) => ({ left, delay: i * 2.1, dur: 11 + (i % 2) * 4 }));
const CONFETTI_COLORS = ["#FF3B6B", "#FFD400", "#29E7CD", "#7C5CFF", "#FF8A00"];
const CONFETTI = [4, 13, 22, 31, 40, 49, 58, 67, 76, 85, 94].map((left, i) => ({
  left,
  delay: (i * 0.7) % 6,
  dur: 6 + (i % 4),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rot: (i * 47) % 360,
}));

/**
 * Farah — one invitation, two entrances. The bride's friends step into a
 * romantic world, the groom's friends into a shaabi street-wedding; same
 * details, different soul, each with its own song.
 */
export default function DuoInvitation({ view, duo }: { view: InvitationView; duo: DuoCopy }) {
  const [locale, setLocale] = useState<Locale>(view.initialLocale);
  const [side, setSide] = useState<Side | null>(null);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const demoAudio = useDemoAudio();
  const ownPlayer = useRef<MusicPlayer | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);

  // Pause our own player (used outside demo pages) when the tab is hidden.
  useEffect(() => {
    const onHide = () => document.hidden && ownPlayer.current?.pause();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      ownPlayer.current?.dispose();
    };
  }, []);

  function playFor(s: Side) {
    const id = duo[s].trackId;
    if (demoAudio) return demoAudio.playTrack(id);
    ownPlayer.current?.dispose();
    ownPlayer.current = createMusicPlayer(BUILTIN_TRACKS[id]?.src ?? (id.startsWith("builtin:") ? undefined : `/media/${id}`));
    void ownPlayer.current.play().catch(() => undefined);
  }

  function choose(s: Side, e?: MouseEvent) {
    if (e) setOrigin({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    else setOrigin({ x: 50, y: 50 });
    setSide(s);
    playFor(s);
    window.scrollTo({ top: 0 });
  }

  const ctx = useMemo(() => ({ locale, setLocale, tr: (text: L10n) => t(text, locale) }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={ctx}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <div lang={locale} dir={dirOf(locale)} className="relative min-h-[100svh] overflow-x-clip bg-[#1b0b33]">
            <TopBar side={side} onBack={() => setSide(null)} locale={locale} onToggleLocale={() => setLocale((l) => (l === "ar" ? "en" : "ar"))} />
            <AnimatePresence mode="wait" initial={false}>
              {side === null ? (
                <m.div key="gate" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.35 }}>
                  <Gate view={view} duo={duo} onChoose={choose} />
                </m.div>
              ) : (
                <m.div
                  key={side}
                  initial={{ clipPath: `circle(0% at ${origin.x}% ${origin.y}%)` }}
                  animate={{ clipPath: `circle(150% at ${origin.x}% ${origin.y}%)` }}
                  transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                >
                  {side === "bride" ? (
                    <RomanceWorld view={view} copy={duo.bride} onSwitch={() => choose("groom")} />
                  ) : (
                    <ShaabiWorld view={view} copy={duo.groom} onSwitch={() => choose("bride")} />
                  )}
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

function TopBar({ side, onBack, locale, onToggleLocale }: { side: Side | null; onBack: () => void; locale: Locale; onToggleLocale: () => void }) {
  const btn = "pointer-events-auto flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-[14px] shadow-sm backdrop-blur-md transition active:scale-95";
  const tone = side === "groom" ? "bg-black/40 text-[#FFD400] ring-1 ring-[#FFD400]/40" : "bg-white/75 text-[#D4507A] ring-1 ring-[#D4507A]/25";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-between p-3.5">
      {side ? (
        <button type="button" onClick={onBack} className={`${btn} ${tone}`}>
          <span aria-hidden className="rtl:rotate-180">←</span>&nbsp;{t(S.back, locale)}
        </button>
      ) : (
        <span />
      )}
      <button type="button" onClick={onToggleLocale} className={`${btn} ${tone}`} lang={locale === "ar" ? "en" : "ar"}>
        {t(ui.language, locale)}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gate: the entrance split between the two sides                      */
/* ------------------------------------------------------------------ */

function Gate({ view, duo, onChoose }: { view: InvitationView; duo: DuoCopy; onChoose: (s: Side, e: MouseEvent) => void }) {
  const { tr, locale } = useLocale();
  return (
    <section className="relative h-[100svh] overflow-hidden">
      {/* Bride side (top) */}
      <button
        type="button"
        onClick={(e) => onChoose("bride", e)}
        className="duo-romance absolute inset-0 flex flex-col items-center justify-start pt-[13svh] text-center"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 44%, 0 56%)" }}
        aria-label={tr(duo.bride.gateLabel)}
      >
        <RomanceParticles few />
        <span className="relative text-[34px]" aria-hidden>
          👰‍♀️
        </span>
        <span className="f-names relative mt-2 max-w-[80vw] text-[34px] leading-tight text-[#D4507A]">{tr(duo.bride.gateLabel)}</span>
        <span className="f-body relative mt-2 text-[15px] text-[#8A5A68]">♡ {tr(S.tap)} ♡</span>
      </button>

      {/* Groom side (bottom) */}
      <button
        type="button"
        onClick={(e) => onChoose("groom", e)}
        className="duo-shaabi absolute inset-0 flex flex-col items-center justify-end pb-[12svh] text-center"
        style={{ clipPath: "polygon(0 56%, 100% 44%, 100% 100%, 0 100%)" }}
        aria-label={tr(duo.groom.gateLabel)}
      >
        <div className="duo-rays" aria-hidden />
        <ShaabiLights />
        <span className="duo-bounce relative text-[34px]" aria-hidden>
          🥁
        </span>
        <span className="f-names duo-neon relative mt-1 max-w-[80vw] text-[36px] leading-tight">{tr(duo.groom.gateLabel)}</span>
        <span className="f-body relative mt-2 text-[15px] text-[#D9C8F2]">✦ {tr(S.tap)} ✦</span>
      </button>

      {/* Seam badge with the couple */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.2 }}
          className="duo-pulse flex h-40 w-40 flex-col items-center justify-center rounded-full bg-white text-center shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] ring-4 ring-[#FFD400]"
        >
          <span className="f-body text-[12px] text-[#8A5A68]">{tr(duo.gateQuestion)}</span>
          <span className="f-names mt-1 text-[24px] leading-tight text-[#4A2430]">
            {tr(view.partner1)} <span className="text-[#D4507A]">♥</span> {tr(view.partner2)}
          </span>
          <span className="f-display mt-1 text-[12px] text-[#8A5A68]">
            <DateParts parts={view.main.numeric[locale]} className="gap-1.5" />
          </span>
        </m.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Romantic world (bride's friends)                                    */
/* ------------------------------------------------------------------ */

function RomanceParticles({ few }: { few?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="duo-bokeh" style={{ width: 160, height: 160, top: "8%", left: "-10%", background: "#ffc8d8" }} />
      <span className="duo-bokeh" style={{ width: 200, height: 200, bottom: "10%", right: "-15%", background: "#f6b6c9", animationDelay: "2s" }} />
      {(few ? HEARTS.slice(0, 5) : HEARTS).map((h, i) => (
        <span
          key={i}
          className="duo-heart text-[#e25c86]"
          style={{ left: `${h.left}%`, animationDelay: `${h.delay}s`, animationDuration: `${h.dur}s`, fontSize: h.size }}
        >
          ♥
        </span>
      ))}
      {!few && PETALS.map((p, i) => <span key={i} className="duo-petal" style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />)}
    </div>
  );
}

function RomanceWorld({ view, copy, onSwitch }: { view: InvitationView; copy: DuoSideCopy; onSwitch: () => void }) {
  const { tr, locale } = useLocale();
  return (
    <div className="duo-romance relative min-h-[100svh]">
      <div className="pointer-events-none fixed inset-0">
        <RomanceParticles />
      </div>
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-7 pt-20 pb-12 text-center">
        <m.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="f-body rounded-full bg-white/70 px-4 py-1 text-[14px] text-[var(--accent)]">
          ♡ {tr(S.forBride)} ♡
        </m.p>
        <m.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="f-display mt-6 text-[34px] leading-snug text-[var(--ink)]"
        >
          {tr(copy.title)}
        </m.h1>
        <m.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, duration: 1.2 }} className="my-8 flex flex-col items-center">
          <span className="f-names text-[60px] leading-[1.1] text-[var(--ink)]">{tr(view.partner1)}</span>
          <span className="my-1 text-[30px] text-[var(--accent)]">♥</span>
          <span className="f-names text-[60px] leading-[1.1] text-[var(--ink)]">{tr(view.partner2)}</span>
        </m.div>
        <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="f-body max-w-[330px] text-[17px] leading-relaxed text-[var(--ink-soft)]">
          {tr(copy.message)}
        </m.p>
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="mt-8 rounded-[22px] bg-white/70 px-6 py-4 shadow-[0_10px_30px_-15px_rgba(212,80,122,0.6)]">
          <p className="f-display text-[24px] text-[var(--ink)]">
            <DateParts parts={view.main.numeric[locale]} />
          </p>
          <p className="f-body mt-1 text-[14px] text-[var(--ink-soft)]">
            {tr(view.main.date)}
            <Dot />
            {tr(view.main.time)}
          </p>
          {view.main.hijri && <p className="f-body text-[13px] text-[var(--accent)]">{tr(view.main.hijri)}</p>}
        </m.div>
      </section>
      <div className="relative">
        <Countdown startsAt={view.main.startsAt} />
        <Events view={view} />
        <Details view={view} />
        <Rsvp view={view} />
        <div className="flex justify-center px-5 pb-6">
          <button type="button" onClick={onSwitch} className="f-body rounded-full bg-[#1b0b33] px-6 py-3 text-[15px] text-[#FFD400] shadow-lg">
            {tr(S.switchToGroom)}
          </button>
        </div>
        <Footer view={view} />
        <div className="h-20" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shaabi world (groom's friends)                                      */
/* ------------------------------------------------------------------ */

const BULB_COLORS = ["#FF3B6B", "#FFD400", "#29E7CD", "#7C5CFF", "#FF8A00"];

/** Festoon string lights and bunting flags, the signature of an Egyptian street wedding. */
function ShaabiLights() {
  const bulbs = Array.from({ length: 13 }, (_, i) => {
    const x = 4 + i * 7.7;
    const y = 10 + Math.sin((i / 12) * Math.PI) * 22;
    return { x, y, color: BULB_COLORS[i % BULB_COLORS.length], delay: (i % 5) * 0.24 };
  });
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0" aria-hidden>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-16 w-full">
        <path d="M0 6 Q50 46 100 6" fill="none" stroke="#3b2a55" strokeWidth="0.6" />
        {bulbs.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="1.6" fill={b.color} color={b.color} className="duo-bulb" style={{ animationDelay: `${b.delay}s` }} />
        ))}
      </svg>
      <svg viewBox="0 0 100 14" preserveAspectRatio="none" className="duo-bunting -mt-6 h-10 w-full">
        <path d="M0 1 Q50 9 100 1" fill="none" stroke="#3b2a55" strokeWidth="0.4" />
        {Array.from({ length: 12 }, (_, i) => {
          const x = 2 + i * 8.3;
          const y = 1 + Math.sin(((i + 0.5) / 12) * Math.PI) * 7;
          return <polygon key={i} points={`${x},${y} ${x + 6},${y} ${x + 3},${y + 6}`} fill={BULB_COLORS[(i + 2) % BULB_COLORS.length]} />;
        })}
      </svg>
    </div>
  );
}

function ShaabiWorld({ view, copy, onSwitch }: { view: InvitationView; copy: DuoSideCopy; onSwitch: () => void }) {
  const { tr, locale } = useLocale();
  const marquee = tr(S.marquee);
  return (
    <div className="duo-shaabi relative min-h-[100svh]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="duo-rays" />
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="duo-confetti"
            style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, rotate: `${c.rot}deg` }}
          />
        ))}
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-10">
        <ShaabiLights />
      </div>

      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 pt-24 pb-10 text-center">
        <m.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="f-body rounded-full bg-[#FF3B6B] px-4 py-1 text-[14px] font-semibold text-white shadow-[0_0_20px_rgba(255,59,107,0.6)]"
        >
          🎺 {tr(S.forGroom)} 🥁
        </m.p>
        <m.h1
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 120 }}
          className="f-display duo-neon mt-6 text-[44px] leading-[1.2]"
        >
          {tr(copy.title)}
        </m.h1>
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="my-7 flex items-center gap-3">
          <span className="f-names text-[46px] leading-none text-white">{tr(view.partner1)}</span>
          <span className="duo-bounce text-[34px]" aria-hidden>
            🎉
          </span>
          <span className="f-names text-[46px] leading-none text-white">{tr(view.partner2)}</span>
        </m.div>
        <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="f-body max-w-[330px] text-[17px] leading-relaxed text-[var(--ink-soft)]">
          {tr(copy.message)}
        </m.p>
        <m.div
          initial={{ opacity: 0, rotate: -6 }}
          animate={{ opacity: 1, rotate: -3 }}
          transition={{ delay: 1.7, type: "spring" }}
          className="mt-8 rounded-2xl border-2 border-dashed border-[#FFD400] bg-[#FF3B6B] px-6 py-3 text-white shadow-[6px_6px_0_#FFD400]"
        >
          <p className="f-display text-[28px] leading-none">
            <DateParts parts={view.main.numeric[locale]} />
          </p>
          <p className="f-body mt-2 text-[14px]">
            {tr(view.main.date)}
            <Dot />
            {tr(view.main.time)}
          </p>
        </m.div>
      </section>

      {/* Wedding banner ticker */}
      <div className="relative -rotate-2 overflow-hidden border-y-2 border-[#FFD400] bg-[#FFD400] py-2 text-[#1b0b33]" aria-hidden>
        <div className="duo-marquee f-display gap-6 text-[22px] whitespace-nowrap">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i}>{marquee}</span>
          ))}
        </div>
      </div>

      <div className="relative">
        <Countdown startsAt={view.main.startsAt} />
        <Events view={view} />
        <Details view={view} />
        <Rsvp view={view} />
        <div className="flex justify-center px-5 pb-6">
          <button type="button" onClick={onSwitch} className="f-body rounded-full bg-[#FCE8EE] px-6 py-3 text-[15px] text-[#D4507A] shadow-lg">
            {tr(S.switchToBride)}
          </button>
        </div>
        <Footer view={view} />
        <div className="h-20" />
      </div>
    </div>
  );
}
