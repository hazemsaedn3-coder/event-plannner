"use client";

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { dirOf, t, ui } from "@/lib/i18n";
import type { L10n, Locale } from "@/lib/types";
import type { InvitationView } from "@/lib/view";
import { LocaleContext } from "../../shared/LocaleContext";
import { createMusicPlayer, type MusicPlayer } from "../../shared/music";
import { Envelope } from "./Envelope";
import { Icon } from "./Ornaments";
import { Rsvp } from "./Rsvp";
import { Countdown, Details, Events, Footer, Gallery, Hero, Story } from "./Sections";
import { noorThemes, themeStyle } from "./themes";

/**
 * Noor v1 — typographic, ornamental, photo-free by default.
 * Pinned by invitations as { templateId: "noor", templateVersion: 1 }.
 */
export default function NoorInvitation({ view }: { view: InvitationView }) {
  const preset = noorThemes[view.themeId];
  const theme = view.themeColors ? { ...preset, colors: view.themeColors } : preset;
  const externalMusic = Boolean(view.music.external);
  const [locale, setLocale] = useState<Locale>(view.initialLocale);
  const [stage, setStage] = useState<"sealed" | "opening" | "open">("sealed");
  const [playing, setPlaying] = useState(false);
  const player = useRef<MusicPlayer | null>(null);

  // Keep <html lang/dir> in sync with the toggle (screen readers, fonts, bidi).
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);

  // Lock scrolling while the envelope covers the page.
  useEffect(() => {
    document.body.style.overflow = stage === "open" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage]);

  // Pause music when the tab is hidden (phone locked, app switched).
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && player.current?.playing) {
        player.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
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

  const toggleMusic = useCallback(() => {
    if (player.current?.playing) {
      player.current.pause();
      setPlaying(false);
    } else {
      void startMusic();
    }
  }, [startMusic]);

  const slug = view.slug;
  const guestCode = view.guest?.code;
  const onOpen = useCallback(() => {
    setStage("opening");
    if (!externalMusic) void startMusic();
    // Count the open for the host dashboard (fire-and-forget).
    const body = JSON.stringify({ slug, guestCode, locale });
    try {
      if (!navigator.sendBeacon?.("/api/view", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/view", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      /* analytics must never break the invitation */
    }
  }, [setStage, startMusic, externalMusic, slug, guestCode, locale]);

  const ctx = useMemo(() => ({ locale, setLocale, tr: (text: L10n) => t(text, locale) }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={ctx}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <div
            lang={locale}
            dir={dirOf(locale)}
            className="noor noor-bg relative min-h-[100svh] overflow-x-clip text-[var(--ink)]"
            style={themeStyle(theme) as CSSProperties}
          >
            <div className="noor-pattern pointer-events-none fixed inset-0" aria-hidden />

            <Controls
              showMusic={!externalMusic}
              playing={playing}
              onToggleMusic={toggleMusic}
              locale={locale}
              onToggleLocale={() => setLocale((l) => (l === "ar" ? "en" : "ar"))}
            />

            <main className="relative">
              <Hero view={view} revealed={stage === "open"} />
              <Countdown startsAt={view.main.startsAt} />
              <Story view={view} />
              <Events view={view} />
              <Details view={view} />
              <Gallery view={view} />
              <Rsvp view={view} />
              <Footer view={view} />
            </main>

            <AnimatePresence>
              {stage !== "open" && <Envelope key="envelope" view={view} onOpen={onOpen} onDone={() => setStage("open")} />}
            </AnimatePresence>
          </div>
        </MotionConfig>
      </LazyMotion>
    </LocaleContext.Provider>
  );
}

function Controls({
  showMusic,
  playing,
  onToggleMusic,
  locale,
  onToggleLocale,
}: {
  showMusic: boolean;
  playing: boolean;
  onToggleMusic: () => void;
  locale: Locale;
  onToggleLocale: () => void;
}) {
  const btn =
    "flex h-11 min-w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)]/85 text-[var(--accent)] shadow-sm backdrop-blur-md transition active:scale-95";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-between p-3.5">
      {showMusic ? (
        <button
          type="button"
          className={`${btn} pointer-events-auto`}
          onClick={onToggleMusic}
          aria-pressed={playing}
          aria-label={t(ui.music, locale)}
        >
          {playing ? <Bars /> : <Icon name="music-off" className="h-5 w-5" />}
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        className={`${btn} pointer-events-auto px-4 text-[14px] ${locale === "ar" ? "font-[family-name:var(--font-cormorant)]" : "font-[family-name:var(--font-amiri)]"}`}
        onClick={onToggleLocale}
        lang={locale === "ar" ? "en" : "ar"}
      >
        {t(ui.language, locale)}
      </button>
    </div>
  );
}

/** Animated equalizer bars while music plays. */
function Bars() {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="noor-bar w-[3px] rounded-full bg-current"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}
