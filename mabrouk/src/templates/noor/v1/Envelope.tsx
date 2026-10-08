"use client";

import { m, useAnimate, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ui } from "@/lib/i18n";
import type { InvitationView } from "@/lib/view";
import { useLocale } from "../../shared/LocaleContext";
import { DateParts, Star8 } from "./Ornaments";

/**
 * Full-screen intro: a sealed envelope. One tap cracks the wax seal, lifts the
 * flap, slides the letter out and reveals the invitation. The same tap starts
 * the music (browsers only allow audio after a user gesture).
 */
export function Envelope({ view, onOpen, onDone }: { view: InvitationView; onOpen: () => void; onDone: () => void }) {
  const { tr, locale } = useLocale();
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();
  const [opening, setOpening] = useState(false);
  const [first, second] = view.monogram[locale];

  async function open() {
    if (opening) return;
    setOpening(true);
    onOpen();
    if (reduce) {
      await animate(scope.current, { opacity: 0 }, { duration: 0.4 });
      onDone();
      return;
    }
    await animate("[data-hint]", { opacity: 0 }, { duration: 0.2 });
    await animate("[data-seal]", { scale: [1, 1.18, 0], rotate: [0, -8, 20], opacity: [1, 1, 0] }, { duration: 0.55, ease: "easeInOut" });
    await animate("[data-flap]", { rotateX: 180 }, { duration: 0.7, ease: [0.65, 0, 0.35, 1] });
    animate("[data-flap]", { zIndex: 0 }, { duration: 0 });
    await animate("[data-card]", { y: "-58%" }, { duration: 0.85, ease: [0.22, 1, 0.36, 1] });
    await animate(scope.current, { opacity: 0, scale: 1.06 }, { duration: 0.8, ease: "easeInOut", delay: 0.35 });
    onDone();
  }

  return (
    <m.div
      ref={scope}
      className="noor-bg fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden px-6"
      role="button"
      tabIndex={0}
      aria-label={tr(ui.tapToOpen)}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open()}
    >
      <div className="noor-pattern pointer-events-none absolute inset-0" aria-hidden />

      <m.p
        className="f-display mb-3 text-center text-[17px] text-[var(--accent)] ltr:text-[13px] ltr:tracking-[0.3em] ltr:uppercase"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        {tr(ui.youAreInvited)}
      </m.p>
      {view.guest && (
        <m.p
          className="f-body mb-8 text-center text-lg text-[var(--ink)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {tr(ui.dear)} {tr(view.guest.displayName)}
        </m.p>
      )}

      {/* Envelope */}
      <m.div
        className="relative aspect-[3/2] w-[84vw] max-w-[360px] [perspective:1200px]"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginTop: view.guest ? 0 : "2rem" }}
      >
        {/* back */}
        <div className="absolute inset-0 rounded-[6px] bg-[var(--env)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]" />

        {/* letter card */}
        <div
          data-card
          className="absolute inset-x-[6%] top-[6%] bottom-[4%] z-[1] flex flex-col items-center justify-center rounded-[4px] bg-[var(--card)] text-[var(--card-ink)] shadow-md"
        >
          <Star8 size={14} className="mb-2 text-[var(--accent)]" />
          <p className="f-names text-[30px] leading-tight">
            {tr(view.partner1)} <span className="text-[var(--accent)]">{locale === "ar" ? "و" : "&"}</span>{" "}
            {tr(view.partner2)}
          </p>
          <p className="f-display mt-1 text-[13px] opacity-70">
            <DateParts parts={view.main.numeric[locale]} className="gap-2" />
          </p>
        </div>

        {/* front pocket */}
        <div
          className="absolute inset-0 z-[2] rounded-[6px] bg-[var(--env-front)]"
          style={{ clipPath: "polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)" }}
        />
        <div
          className="absolute inset-0 z-[2] rounded-[6px] opacity-60"
          style={{
            clipPath: "polygon(0 100%, 50% 48%, 100% 100%)",
            background: "linear-gradient(to top, rgba(0,0,0,0.06), transparent)",
          }}
        />

        {/* flap */}
        <div
          data-flap
          className="absolute inset-x-0 top-0 z-[3] h-[62%] origin-top [transform-style:preserve-3d]"
        >
          <div
            className="absolute inset-0 bg-[var(--env)] [backface-visibility:hidden]"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.15))",
              backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.06))",
            }}
          />
        </div>

        {/* wax seal */}
        <div className="absolute top-[62%] left-1/2 z-[4] -translate-x-1/2 -translate-y-1/2">
          <div data-seal>
            <WaxSeal letters={[first, second]} />
          </div>
        </div>
      </m.div>

      <m.p
        data-hint
        className="f-body mt-10 text-center text-[15px] text-[var(--ink-soft)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        {tr(ui.tapToOpen)}
      </m.p>
    </m.div>
  );
}

function WaxSeal({ letters }: { letters: [string, string] }) {
  return (
    <div className="relative h-[74px] w-[74px]">
      {/* irregular wax edge */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)]" aria-hidden>
        <defs>
          <radialGradient id="wax" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="var(--seal)" stopOpacity="0.85" />
            <stop offset="55%" stopColor="var(--seal)" />
            <stop offset="100%" stopColor="var(--seal-dark)" />
          </radialGradient>
        </defs>
        <path
          fill="url(#wax)"
          d="M50 2c7 0 9 5 15 6s11-2 15 3 1 10 5 15 9 6 9 13-6 8-6 14 5 9 2 15-9 4-12 9-1 11-7 13-9-3-15-2-9 6-16 5-6-6-12-8-12 1-15-4 1-10-2-15-9-6-9-13 6-8 6-14-5-9-2-15 9-4 12-9 1-11 7-13 9 3 15 2 8-7 15-7z"
        />
        <circle cx="50" cy="50" r="30" fill="none" stroke="var(--seal-dark)" strokeOpacity="0.6" strokeWidth="2" />
        <circle cx="50" cy="50" r="27" fill="none" stroke="var(--seal-ink)" strokeOpacity="0.35" strokeWidth="0.8" />
      </svg>
      <div className="f-names absolute inset-0 flex items-center justify-center gap-[2px] text-[22px] leading-none text-[var(--seal-ink)] [text-shadow:0_1px_0_rgba(0,0,0,0.25)]">
        <span>{letters[0]}</span>
        <span className="text-[13px] opacity-80">·</span>
        <span>{letters[1]}</span>
      </div>
    </div>
  );
}
