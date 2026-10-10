"use client";

import "./duo.css";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
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
import { neonText, palette, romanceVars, shaabiVars, type DuoPalette, type DuoStyleId } from "./palettes";

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
  style?: DuoStyleId;
  palette?: string;
}

const S = {
  forBride: { ar: "لصحاب العروسة", en: "For the bride's friends" },
  forGroom: { ar: "لصحاب العريس", en: "For the groom's friends" },
  switchToBride: { ar: "شوف دعوة صحاب العروسة 💗", en: "See the bride's friends' invite 💗" },
  switchToGroom: { ar: "شوف دعوة صحاب العريس 🥁", en: "See the groom's friends' invite 🥁" },
  back: { ar: "رجوع", en: "Back" },
  marquee: { ar: "الفرح فرحنا ✦ الليلة ليلتنا ✦ منورين يا رجالة ✦", en: "IT'S OUR PARTY ✦ TONIGHT IS OUR NIGHT ✦ LET'S GO ✦" },
  tap: { ar: "اضغط على طرفك", en: "Tap your side" },
  or: { ar: "أو", en: "or" },
  admit: { ar: "تذكرة دخول", en: "Admit one" },
  enter: { ar: "اضغط وادخل الفرح", en: "Tap to enter" },
};

/* Deterministic particle layouts (identical on server and client). */
const HEARTS = [6, 18, 31, 44, 57, 69, 82, 93].map((left, i) => ({ left, delay: i * 1.3, dur: 9 + (i % 3) * 2, size: 14 + (i % 4) * 6 }));
const PETALS = [10, 27, 48, 66, 85].map((left, i) => ({ left, delay: i * 2.1, dur: 11 + (i % 2) * 4 }));
const CONFETTI = [4, 13, 22, 31, 40, 49, 58, 67, 76, 85, 94].map((left, i) => ({ left, delay: (i * 0.7) % 6, dur: 6 + (i % 4), rot: (i * 47) % 360 }));

/**
 * Farah — one invitation, two entrances. The bride's friends step into a
 * romantic world, the groom's friends into a shaabi street-wedding; same
 * details, different soul, each with its own song. `duo.style` picks the
 * entrance layout and `duo.palette` the colors of both worlds.
 */
export default function DuoInvitation({ view, duo }: { view: InvitationView; duo: DuoCopy }) {
  const p = palette(duo.palette);
  const style = duo.style ?? "diagonal";
  const [locale, setLocale] = useState<Locale>(view.initialLocale);
  const [side, setSide] = useState<Side | null>(null);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const demoAudio = useDemoAudio();
  const ownPlayer = useRef<MusicPlayer | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);

  // Our own player is only used outside demo pages.
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

  /** Start the song right away (inside the tap), switch the view after an optional gate animation. */
  function choose(s: Side, e?: MouseEvent, delayMs = 0) {
    setOrigin(e ? { x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 } : { x: 50, y: 50 });
    playFor(s);
    const go = () => {
      setSide(s);
      window.scrollTo({ top: 0 });
    };
    if (delayMs) window.setTimeout(go, delayMs);
    else go();
  }

  const ctx = useMemo(() => ({ locale, setLocale, tr: (text: L10n) => t(text, locale) }), [locale, setLocale]);
  const gateProps = { view, duo, p, onChoose: choose };

  return (
    <LocaleContext.Provider value={ctx}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <div lang={locale} dir={dirOf(locale)} className="relative min-h-[100svh] overflow-x-clip" style={{ background: p.shaabi.bg2 }}>
            <TopBar p={p} side={side} onBack={() => setSide(null)} locale={locale} onToggleLocale={() => setLocale((l) => (l === "ar" ? "en" : "ar"))} />
            <AnimatePresence mode="wait" initial={false}>
              {side === null ? (
                <m.div key="gate" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.35 }}>
                  {style === "doors" ? (
                    <DoorsGate {...gateProps} />
                  ) : style === "tickets" ? (
                    <TicketsGate {...gateProps} />
                  ) : style === "split" ? (
                    <SplitGate {...gateProps} />
                  ) : (
                    <DiagonalGate {...gateProps} />
                  )}
                </m.div>
              ) : (
                <m.div
                  key={side}
                  initial={{ clipPath: `circle(0% at ${origin.x}% ${origin.y}%)` }}
                  animate={{ clipPath: `circle(150% at ${origin.x}% ${origin.y}%)` }}
                  transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                >
                  {side === "bride" ? (
                    <RomanceWorld p={p} view={view} copy={duo.bride} onSwitch={() => choose("groom")} />
                  ) : (
                    <ShaabiWorld p={p} khayamiya={duo.palette === "royal"} view={view} copy={duo.groom} onSwitch={() => choose("bride")} />
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

function TopBar({ p, side, onBack, locale, onToggleLocale }: { p: DuoPalette; side: Side | null; onBack: () => void; locale: Locale; onToggleLocale: () => void }) {
  const btn = "pointer-events-auto flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-[14px] shadow-sm backdrop-blur-md transition active:scale-95";
  const tone: CSSProperties =
    side === "groom"
      ? { background: "rgba(0,0,0,0.45)", color: "#FFFFFF", boxShadow: `inset 0 0 0 1px ${p.shaabi.accent}66` }
      : { background: "rgba(255,255,255,0.8)", color: p.romance.accent, boxShadow: `inset 0 0 0 1px ${p.romance.accent}40` };
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-between p-3.5">
      {side ? (
        <button type="button" onClick={onBack} className={btn} style={tone}>
          <span aria-hidden className="rtl:rotate-180">←</span>&nbsp;{t(S.back, locale)}
        </button>
      ) : (
        <span />
      )}
      <button type="button" onClick={onToggleLocale} className={btn} style={tone} lang={locale === "ar" ? "en" : "ar"}>
        {t(ui.language, locale)}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared gate pieces                                                  */
/* ------------------------------------------------------------------ */

interface GateProps {
  view: InvitationView;
  duo: DuoCopy;
  p: DuoPalette;
  onChoose: (s: Side, e?: MouseEvent, delayMs?: number) => void;
}

function CoupleBadge({ view, duo, p, size = 160 }: { view: InvitationView; duo: DuoCopy; p: DuoPalette; size?: number }) {
  const { tr, locale } = useLocale();
  return (
    <m.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.2 }}
      className="duo-pulse flex flex-col items-center justify-center rounded-full bg-white text-center"
      style={{ width: size, height: size, boxShadow: `0 0 0 4px ${p.shaabi.accent}, 0 0 0 9px ${p.romance.accent}55, 0 20px 50px -10px rgba(0,0,0,0.5)` }}
    >
      <span className="f-body px-3 text-[12px] leading-tight" style={{ color: p.romance.inkSoft }}>
        {tr(duo.gateQuestion)}
      </span>
      <span className="f-names mt-1 px-2 text-[22px] leading-tight" style={{ color: p.romance.ink }}>
        {tr(view.partner1)} <span style={{ color: p.romance.accent }}>♥</span> {tr(view.partner2)}
      </span>
      <span className="f-display mt-1 text-[12px]" style={{ color: p.romance.inkSoft }}>
        <DateParts parts={view.main.numeric[locale]} className="gap-1.5" />
      </span>
    </m.div>
  );
}

function RomanceParticles({ few }: { few?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="duo-bokeh" style={{ width: 160, height: 160, top: "8%", left: "-10%", background: "var(--particle)", opacity: 0.4 }} />
      <span className="duo-bokeh" style={{ width: 200, height: 200, bottom: "10%", right: "-15%", background: "var(--particle)", opacity: 0.35, animationDelay: "2s" }} />
      {(few ? HEARTS.slice(0, 5) : HEARTS).map((h, i) => (
        <span key={i} className="duo-heart" style={{ left: `${h.left}%`, animationDelay: `${h.delay}s`, animationDuration: `${h.dur}s`, fontSize: h.size }}>
          ♥
        </span>
      ))}
      {!few && PETALS.map((pt, i) => <span key={i} className="duo-petal" style={{ left: `${pt.left}%`, animationDelay: `${pt.delay}s`, animationDuration: `${pt.dur}s` }} />)}
    </div>
  );
}

/** Festoon string lights and bunting flags, the signature of an Egyptian street wedding. */
function ShaabiLights({ colors }: { colors: string[] }) {
  const bulbs = Array.from({ length: 13 }, (_, i) => ({
    x: 4 + i * 7.7,
    y: 10 + Math.sin((i / 12) * Math.PI) * 22,
    color: colors[i % colors.length],
    delay: (i % 5) * 0.24,
  }));
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0" aria-hidden>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-16 w-full">
        <path d="M0 6 Q50 46 100 6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
        {bulbs.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="1.6" fill={b.color} color={b.color} className="duo-bulb" style={{ animationDelay: `${b.delay}s` }} />
        ))}
      </svg>
      <svg viewBox="0 0 100 14" preserveAspectRatio="none" className="duo-bunting -mt-6 h-10 w-full">
        <path d="M0 1 Q50 9 100 1" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
        {Array.from({ length: 12 }, (_, i) => {
          const x = 2 + i * 8.3;
          const y = 1 + Math.sin(((i + 0.5) / 12) * Math.PI) * 7;
          return <polygon key={i} points={`${x},${y} ${x + 6},${y} ${x + 3},${y + 6}`} fill={colors[(i + 2) % colors.length]} />;
        })}
      </svg>
    </div>
  );
}

function BrideLabel({ duo, p }: { duo: DuoCopy; p: DuoPalette }) {
  const { tr } = useLocale();
  return (
    <>
      <span className="relative text-[32px]" aria-hidden>
        👰‍♀️
      </span>
      <span className="f-names relative mt-2 max-w-[80vw] px-3 text-[32px] leading-tight" style={{ color: p.romance.accent }}>
        {tr(duo.bride.gateLabel)}
      </span>
      <span className="f-body relative mt-2 text-[15px]" style={{ color: p.romance.inkSoft }}>
        ♡ {tr(S.tap)} ♡
      </span>
    </>
  );
}

function GroomLabel({ duo, p }: { duo: DuoCopy; p: DuoPalette }) {
  const { tr } = useLocale();
  return (
    <>
      <span className="duo-bounce relative text-[32px]" aria-hidden>
        🥁
      </span>
      <span className="f-names duo-flicker relative mt-1 max-w-[80vw] px-3 text-[34px] leading-tight" style={neonText(p)}>
        {tr(duo.groom.gateLabel)}
      </span>
      <span className="f-body relative mt-2 text-[15px] text-white/90">✦ {tr(S.tap)} ✦</span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Gate 1: diagonal split with a glowing seam                          */
/* ------------------------------------------------------------------ */

function DiagonalGate({ view, duo, p, onChoose }: GateProps) {
  const { tr } = useLocale();
  // The seam runs from (0%, 56%) to (100%, 44%).
  const seamY = (x: number) => 56 - (12 * x) / 100;
  return (
    <section className="relative h-[100svh] overflow-hidden">
      <button
        type="button"
        onClick={(e) => onChoose("bride", e)}
        className="absolute inset-0 flex flex-col items-center justify-start pt-[13svh] text-center"
        style={{ ...romanceVars(p), clipPath: "polygon(0 0, 100% 0, 100% 44%, 0 56%)" }}
        aria-label={tr(duo.bride.gateLabel)}
      >
        <RomanceParticles few />
        <BrideLabel duo={duo} p={p} />
      </button>
      <button
        type="button"
        onClick={(e) => onChoose("groom", e)}
        className="absolute inset-0 flex flex-col items-center justify-end overflow-hidden pb-[12svh] text-center"
        style={{ ...shaabiVars(p), clipPath: "polygon(0 56%, 100% 44%, 100% 100%, 0 100%)" }}
        aria-label={tr(duo.groom.gateLabel)}
      >
        <div className="duo-rays" aria-hidden />
        <ShaabiLights colors={p.shaabi.bulbs} />
        <GroomLabel duo={duo} p={p} />
      </button>

      {/* Seam: white band + travelling dashed light + charms along the cut */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <line x1="0" y1="56" x2="100" y2="44" stroke="#FFFFFF" strokeWidth="8" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="56" x2="100" y2="44" stroke={p.shaabi.accent} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeDasharray="10 7" className="duo-seam-dash" />
      </svg>
      {[8, 24, 76, 92].map((x, i) => (
        <span
          key={x}
          className="duo-shimmer pointer-events-none absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[14px] shadow"
          style={{ left: `${x}%`, top: `${seamY(x)}%`, color: i % 2 ? p.shaabi.hot : p.romance.accent, animationDelay: `${i * 0.4}s` }}
          aria-hidden
        >
          {i % 2 ? "✦" : "♥"}
        </span>
      ))}

      <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <CoupleBadge view={view} duo={duo} p={p} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gate 2: two palace doors with a pillar between them                 */
/* ------------------------------------------------------------------ */

function DoorsGate({ view, duo, p, onChoose }: GateProps) {
  const { tr, locale } = useLocale();
  const [opening, setOpening] = useState<Side | null>(null);

  function open(side: Side, e: MouseEvent) {
    if (opening) return;
    setOpening(side);
    onChoose(side, e, 900);
  }

  const door = (side: Side) => {
    const isBride = side === "bride";
    const vars = isBride ? romanceVars(p) : shaabiVars(p);
    const trim = isBride ? p.romance.accent : p.shaabi.accent;
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={(e) => open(side, e)}
          aria-label={tr(duo[side].gateLabel)}
          className="relative flex h-[46svh] w-[40vw] max-w-[210px] flex-col items-center justify-center overflow-hidden rounded-t-full text-center [perspective:900px]"
          style={{ ...vars, boxShadow: `0 0 0 3px ${trim}, 0 0 0 9px rgba(255,255,255,0.14), 0 25px 50px -20px rgba(0,0,0,0.7)` }}
        >
          {isBride ? <RomanceParticles few /> : <div className="duo-rays" aria-hidden />}
          <span className="relative text-[40px]" aria-hidden>
            {isBride ? "💐" : "🎉"}
          </span>
          {/* Door leaves that swing open */}
          {[0, 1].map((i) => (
            <m.span
              key={i}
              aria-hidden
              className="absolute inset-y-0 w-1/2"
              style={{
                [i === 0 ? "left" : "right"]: 0,
                transformOrigin: i === 0 ? "left center" : "right center",
                background: `linear-gradient(${i === 0 ? 90 : 270}deg, ${isBride ? p.romance.bg2 : p.shaabi.surface}, ${isBride ? p.romance.surface : p.shaabi.glow})`,
                boxShadow: `inset 0 0 0 1px ${trim}66`,
              }}
              initial={false}
              animate={opening === side ? { rotateY: i === 0 ? -105 : 105 } : { rotateY: 0 }}
              transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
            >
              <span className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full" style={{ [i === 0 ? "right" : "left"]: 8, background: trim, boxShadow: `0 0 10px ${trim}` }} />
              <span className="absolute inset-x-3 top-[20%] bottom-[46%] rounded-t-full border" style={{ borderColor: `${trim}66` }} />
              <span className="absolute inset-x-3 top-[60%] bottom-[10%] rounded-md border" style={{ borderColor: `${trim}66` }} />
            </m.span>
          ))}
        </button>
        <span className="f-names max-w-[42vw] text-center text-[21px] leading-tight" style={isBride ? { color: p.romance.accent } : neonText(p)}>
          {isBride ? "👰‍♀️ " : "🥁 "}
          {tr(duo[side].gateLabel)}
        </span>
      </div>
    );
  };

  return (
    <section
      className="relative flex h-[100svh] flex-col items-center justify-center gap-6 overflow-hidden px-3"
      style={{ background: `linear-gradient(${locale === "ar" ? 270 : 90}deg, ${p.romance.bg2} 0%, ${p.romance.bg} 46%, ${p.shaabi.glow} 54%, ${p.shaabi.bg} 100%)` }}
    >
      <CoupleBadge view={view} duo={duo} p={p} size={136} />
      <div className="flex items-start gap-3">
        {door("bride")}
        {/* Pillar divider */}
        <div className="flex h-[46svh] flex-col items-center justify-center gap-2" aria-hidden>
          <span className="w-[3px] flex-1 rounded-full" style={{ background: `linear-gradient(${p.romance.accent}, ${p.shaabi.accent})` }} />
          <span className="flex h-10 w-10 rotate-45 items-center justify-center rounded-md bg-white" style={{ boxShadow: `0 0 0 3px ${p.shaabi.accent}, 0 8px 20px rgba(0,0,0,0.35)` }}>
            <span className="f-display -rotate-45 text-[14px]" style={{ color: p.romance.ink }}>
              {tr(S.or)}
            </span>
          </span>
          <span className="w-[3px] flex-1 rounded-full" style={{ background: `linear-gradient(${p.shaabi.accent}, ${p.romance.accent})` }} />
        </div>
        {door("groom")}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gate 3: two festival tickets with a perforated "or" divider         */
/* ------------------------------------------------------------------ */

const TICKET_MASK =
  "radial-gradient(circle 13px at 74% 0, transparent 97%, #000) top / 100% 51% no-repeat, radial-gradient(circle 13px at 74% 100%, transparent 97%, #000) bottom / 100% 51% no-repeat";

function TicketsGate({ view, duo, p, onChoose }: GateProps) {
  const { tr, locale } = useLocale();
  const [tearing, setTearing] = useState<Side | null>(null);

  function pick(side: Side, e: MouseEvent) {
    if (tearing) return;
    setTearing(side);
    onChoose(side, e, 700);
  }

  const ticket = (side: Side) => {
    const isBride = side === "bride";
    const vars = isBride ? romanceVars(p) : shaabiVars(p);
    return (
      <m.button
        type="button"
        onClick={(e) => pick(side, e)}
        aria-label={tr(duo[side].gateLabel)}
        className="relative flex h-[150px] w-[88vw] max-w-[380px] overflow-hidden rounded-[18px] text-start"
        style={{ ...vars, WebkitMask: TICKET_MASK, mask: TICKET_MASK, rotate: isBride ? "-3deg" : "2deg" }}
        whileTap={{ scale: 0.97 }}
        animate={tearing === side ? { y: isBride ? -30 : 30, opacity: 0.9 } : {}}
      >
        {isBride ? <RomanceParticles few /> : <div className="duo-rays" aria-hidden />}
        <div className="relative flex w-[74%] flex-col justify-center gap-1 px-5">
          <span className="f-body text-[11px] tracking-[0.15em] uppercase" style={{ color: isBride ? p.romance.inkSoft : "rgba(255,255,255,0.85)" }}>
            {tr(S.admit)} ✦ {isBride ? "💗" : "🥁"}
          </span>
          <span className="f-names text-[25px] leading-tight" style={isBride ? { color: p.romance.accent } : neonText(p)}>
            {tr(duo[side].gateLabel)}
          </span>
          <span className="f-body text-[13px]" style={{ color: isBride ? p.romance.inkSoft : "rgba(255,255,255,0.9)" }}>
            {tr(S.enter)}
          </span>
        </div>
        {/* Perforation */}
        <span className="absolute inset-y-4 left-[74%] border-s-2 border-dashed" style={{ borderColor: isBride ? `${p.romance.accent}80` : `${p.shaabi.accent}99` }} aria-hidden />
        <m.div
          className="relative flex w-[26%] flex-col items-center justify-center"
          animate={tearing === side ? { x: locale === "ar" ? -60 : 60, rotate: locale === "ar" ? -18 : 18, opacity: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="f-display flex flex-col items-center text-[17px] leading-tight" style={{ color: isBride ? p.romance.ink : "#FFFFFF" }}>
            {view.main.numeric[locale].map((part, i) => (
              <span key={i}>{part}</span>
            ))}
          </span>
        </m.div>
      </m.button>
    );
  };

  return (
    <section
      className="relative flex h-[100svh] flex-col items-center justify-center gap-5 overflow-hidden px-4"
      style={{ background: `linear-gradient(180deg, ${p.romance.bg} 0%, ${p.romance.bg2} 36%, ${p.shaabi.glow} 64%, ${p.shaabi.bg2} 100%)` }}
    >
      <CoupleBadge view={view} duo={duo} p={p} size={128} />
      <div className="drop-shadow-[0_18px_22px_rgba(0,0,0,0.25)]">{ticket("bride")}</div>
      {/* "or" divider */}
      <div className="flex w-[88vw] max-w-[380px] items-center gap-3" aria-hidden>
        <span className="h-0 flex-1 border-t-2 border-dashed" style={{ borderColor: "#FFFFFF" }} />
        <span className="f-display flex h-11 w-11 items-center justify-center rounded-full bg-white text-[15px]" style={{ color: p.romance.ink, boxShadow: `0 0 0 3px ${p.shaabi.accent}` }}>
          {tr(S.or)}
        </span>
        <span className="h-0 flex-1 border-t-2 border-dashed" style={{ borderColor: "#FFFFFF" }} />
      </div>
      <div className="drop-shadow-[0_18px_22px_rgba(0,0,0,0.45)]">{ticket("groom")}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gate 4: side-by-side halves with a glowing zigzag seam              */
/* ------------------------------------------------------------------ */

function SplitGate({ view, duo, p, onChoose }: GateProps) {
  const { tr } = useLocale();
  const zig = Array.from({ length: 21 }, (_, i) => `${i % 2 ? 3 : -3},${i * 5}`).join(" ");
  return (
    <section className="relative flex h-[100svh] overflow-hidden">
      <button
        type="button"
        onClick={(e) => onChoose("bride", e)}
        className="relative flex w-1/2 flex-col items-center justify-center pt-[24svh] text-center"
        style={romanceVars(p)}
        aria-label={tr(duo.bride.gateLabel)}
      >
        <RomanceParticles few />
        <span className="relative text-[30px]" aria-hidden>
          👰‍♀️
        </span>
        <span className="f-names relative mt-2 px-3 text-[26px] leading-tight" style={{ color: p.romance.accent }}>
          {tr(duo.bride.gateLabel)}
        </span>
        <span className="f-body relative mt-2 text-[13px]" style={{ color: p.romance.inkSoft }}>
          ♡ {tr(S.tap)}
        </span>
      </button>
      <button
        type="button"
        onClick={(e) => onChoose("groom", e)}
        className="relative flex w-1/2 flex-col items-center justify-center overflow-hidden pt-[24svh] text-center"
        style={shaabiVars(p)}
        aria-label={tr(duo.groom.gateLabel)}
      >
        <div className="duo-rays" aria-hidden />
        <ShaabiLights colors={p.shaabi.bulbs} />
        <span className="duo-bounce relative text-[30px]" aria-hidden>
          🥁
        </span>
        <span className="f-names duo-flicker relative mt-2 px-3 text-[27px] leading-tight" style={neonText(p)}>
          {tr(duo.groom.gateLabel)}
        </span>
        <span className="f-body relative mt-2 text-[13px] text-white/90">✦ {tr(S.tap)}</span>
      </button>

      {/* Zigzag seam down the middle */}
      <svg className="pointer-events-none absolute inset-y-0 left-1/2 h-full w-6 -translate-x-1/2" viewBox="-6 0 12 100" preserveAspectRatio="none" aria-hidden>
        <polyline points={zig} fill="none" stroke="#FFFFFF" strokeWidth="7" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <polyline points={zig} fill="none" stroke={p.shaabi.accent} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeDasharray="10 7" className="duo-seam-dash" />
      </svg>

      <div className="pointer-events-none absolute top-[17svh] left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <CoupleBadge view={view} duo={duo} p={p} size={150} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The two worlds                                                      */
/* ------------------------------------------------------------------ */

function SharedDetails({ view, children }: { view: InvitationView; children: ReactNode }) {
  return (
    <div className="relative">
      <Countdown startsAt={view.main.startsAt} />
      <Events view={view} />
      <Details view={view} />
      <Rsvp view={view} />
      {children}
      <Footer view={view} />
      <div className="h-20" />
    </div>
  );
}

function RomanceWorld({ p, view, copy, onSwitch }: { p: DuoPalette; view: InvitationView; copy: DuoSideCopy; onSwitch: () => void }) {
  const { tr, locale } = useLocale();
  return (
    <div className="relative min-h-[100svh]" style={romanceVars(p)}>
      <div className="pointer-events-none fixed inset-0">
        <RomanceParticles />
      </div>
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-7 pt-20 pb-12 text-center">
        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="f-body rounded-full bg-white/70 px-4 py-1 text-[14px]"
          style={{ color: p.romance.accent }}
        >
          ♡ {tr(S.forBride)} ♡
        </m.p>
        <m.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1 }} className="f-display mt-6 text-[34px] leading-snug">
          {tr(copy.title)}
        </m.h1>
        <m.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, duration: 1.2 }} className="my-8 flex flex-col items-center">
          <span className="f-names text-[60px] leading-[1.1]">{tr(view.partner1)}</span>
          <span className="my-1 text-[30px]" style={{ color: p.romance.accent }}>
            ♥
          </span>
          <span className="f-names text-[60px] leading-[1.1]">{tr(view.partner2)}</span>
        </m.div>
        <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="f-body max-w-[330px] text-[17px] leading-relaxed" style={{ color: p.romance.inkSoft }}>
          {tr(copy.message)}
        </m.p>
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mt-8 rounded-[22px] bg-white/75 px-6 py-4"
          style={{ boxShadow: `0 10px 30px -15px ${p.romance.accent}` }}
        >
          <p className="f-display text-[24px]">
            <DateParts parts={view.main.numeric[locale]} />
          </p>
          <p className="f-body mt-1 text-[14px]" style={{ color: p.romance.inkSoft }}>
            {tr(view.main.date)}
            <Dot />
            {tr(view.main.time)}
          </p>
          {view.main.hijri && (
            <p className="f-body text-[13px]" style={{ color: p.romance.accent }}>
              {tr(view.main.hijri)}
            </p>
          )}
        </m.div>
      </section>
      <SharedDetails view={view}>
        <div className="flex justify-center px-5 pb-6">
          <button type="button" onClick={onSwitch} className="f-body rounded-full px-6 py-3 text-[15px] text-white" style={{ background: p.shaabi.bg, boxShadow: `0 0 0 2px ${p.shaabi.accent}, 0 10px 24px -8px rgba(0,0,0,0.5)` }}>
            {tr(S.switchToGroom)}
          </button>
        </div>
      </SharedDetails>
    </div>
  );
}

/** Dark world: every piece of text is white (accents only in glows and badges). */
function ShaabiWorld({ p, khayamiya, view, copy, onSwitch }: { p: DuoPalette; khayamiya: boolean; view: InvitationView; copy: DuoSideCopy; onSwitch: () => void }) {
  const { tr, locale } = useLocale();
  const marquee = tr(S.marquee);
  return (
    <div className="duo-shaabi-fonts relative min-h-[100svh] text-white" style={shaabiVars(p)}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="duo-rays" />
        {khayamiya && <div className="duo-khayamiya absolute inset-0 opacity-60" />}
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="duo-confetti"
            style={{ left: `${c.left}%`, background: p.shaabi.bulbs[i % p.shaabi.bulbs.length], animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, rotate: `${c.rot}deg` }}
          />
        ))}
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-10">
        <ShaabiLights colors={p.shaabi.bulbs} />
      </div>

      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 pt-24 pb-10 text-center">
        <m.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="f-body rounded-full px-4 py-1 text-[14px] font-semibold text-white"
          style={{ background: p.shaabi.hot, boxShadow: `0 0 20px ${p.shaabi.hot}99` }}
        >
          🎺 {tr(S.forGroom)} 🥁
        </m.p>
        <m.h1
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 120 }}
          className="f-display duo-flicker mt-6 text-[44px] leading-[1.2]"
          style={neonText(p)}
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
        <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="f-body max-w-[330px] text-[17px] leading-relaxed text-white">
          {tr(copy.message)}
        </m.p>
        <m.div
          initial={{ opacity: 0, rotate: -6 }}
          animate={{ opacity: 1, rotate: -3 }}
          transition={{ delay: 1.7, type: "spring" }}
          className="mt-8 rounded-2xl border-2 border-dashed px-6 py-3 text-white"
          style={{ background: p.shaabi.hot, borderColor: "#FFFFFF", boxShadow: `6px 6px 0 ${p.shaabi.accent}` }}
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
      <div className="relative -rotate-2 overflow-hidden border-y-2 border-white py-2" style={{ background: p.shaabi.accent, color: p.shaabi.bg }} aria-hidden>
        <div className="duo-marquee f-display gap-6 text-[22px] whitespace-nowrap">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i}>{marquee}</span>
          ))}
        </div>
      </div>

      <SharedDetails view={view}>
        <div className="flex justify-center px-5 pb-6">
          <button type="button" onClick={onSwitch} className="f-body rounded-full px-6 py-3 text-[15px] shadow-lg" style={{ background: p.romance.bg, color: p.romance.accent }}>
            {tr(S.switchToBride)}
          </button>
        </div>
      </SharedDetails>
    </div>
  );
}
