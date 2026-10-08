"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createMusicPlayer, type MusicPlayer } from "@/templates/shared/music";

export interface DemoTrack {
  id: string;
  title: string;
  src?: string;
}

const T = {
  ar: {
    play: "تشغيل الموسيقى",
    pause: "إيقاف الموسيقى",
    mute: "كتم الصوت",
    unmute: "تشغيل الصوت",
    track: "اختر المقطع",
    share: "مشاركة",
    copy: "نسخ الرابط",
    copied: "تم النسخ ✓",
    whatsapp: "إرسال على واتساب",
    more: "مشاركة عبر…",
    designs: "كل التصاميم",
    hint: "اضغط ▶ للموسيقى",
    preparedFor: "معاينة خاصة لـ",
    order: "اطلب",
  },
  en: {
    play: "Play music",
    pause: "Pause music",
    mute: "Mute",
    unmute: "Unmute",
    track: "Choose track",
    share: "Share",
    copy: "Copy link",
    copied: "Copied ✓",
    whatsapp: "Send on WhatsApp",
    more: "Share via…",
    designs: "All designs",
    hint: "Tap ▶ for music",
    preparedFor: "Private preview for",
    order: "Order",
  },
};

/**
 * Wraps a live template demo with an accessible audio dock (play / pause /
 * mute / track selector), a share sheet for the demo's own URL, and the
 * WhatsApp order button.
 */
export function DemoShell({
  children,
  tracks,
  shareUrl,
  orderUrl,
  ctaLabel,
  shareText,
  galleryHref,
  locale,
  clientName,
  autoStartOnTap,
}: {
  children: ReactNode;
  tracks: DemoTrack[];
  shareUrl: string;
  orderUrl: string;
  ctaLabel: string;
  shareText: string;
  galleryHref: string;
  locale: "ar" | "en";
  clientName?: string;
  /** Start music on the first tap anywhere on the page (the envelope tap). */
  autoStartOnTap: boolean;
}) {
  const t = T[locale];
  const [trackId, setTrackId] = useState(tracks[0]?.id ?? "");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const player = useRef<MusicPlayer | null>(null);
  const userPaused = useRef(false);

  const track = tracks.find((x) => x.id === trackId) ?? tracks[0];

  const play = useCallback(async () => {
    if (!track) return;
    player.current ??= createMusicPlayer(track.src);
    player.current.setMuted(muted);
    try {
      await player.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [track, muted]);

  const pause = useCallback(() => {
    player.current?.pause();
    setPlaying(false);
  }, []);

  // Browsers block autoplay: start on the visitor's first tap.
  useEffect(() => {
    if (!autoStartOnTap) return;
    const onFirstTap = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.("[data-demo-dock]")) return;
      if (!userPaused.current && !player.current?.playing) void play();
      document.removeEventListener("pointerdown", onFirstTap, true);
    };
    document.addEventListener("pointerdown", onFirstTap, true);
    return () => document.removeEventListener("pointerdown", onFirstTap, true);
  }, [autoStartOnTap, play]);

  // Pause when the tab is hidden; release audio on unmount.
  useEffect(() => {
    const onHide = () => document.hidden && pause();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      player.current?.dispose();
    };
  }, [pause]);

  function selectTrack(id: string) {
    const wasPlaying = player.current?.playing;
    player.current?.dispose();
    player.current = null;
    setTrackId(id);
    setPlaying(false);
    const next = tracks.find((x) => x.id === id);
    if (wasPlaying && next) {
      const p = createMusicPlayer(next.src);
      p.setMuted(muted);
      player.current = p;
      p.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    player.current?.setMuted(next);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt(t.copy, shareUrl);
    }
  }

  const iconBtn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <>
      {children}

      {clientName && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4" dir={locale === "ar" ? "rtl" : "ltr"}>
          <p className="rounded-full bg-black/55 px-4 py-1.5 text-[13px] text-white backdrop-blur-md">
            {t.preparedFor} <strong>{clientName}</strong>
          </p>
        </div>
      )}

      <div
        data-demo-dock
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <div className="relative flex w-full max-w-[520px] items-center gap-1 rounded-full bg-[#141210]/85 p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl">
          <a href={galleryHref} className={iconBtn} aria-label={t.designs} title={t.designs}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
            </svg>
          </a>

          {tracks.length > 0 && (
            <>
              <button
                type="button"
                className={`${iconBtn} ${playing ? "bg-white/15" : "animate-pulse bg-white/10"}`}
                onClick={() => {
                  if (playing) {
                    userPaused.current = true;
                    pause();
                  } else {
                    userPaused.current = false;
                    void play();
                  }
                }}
                aria-label={playing ? t.pause : t.play}
                aria-pressed={playing}
                title={playing ? t.pause : t.play}
              >
                {playing ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                className={iconBtn}
                onClick={toggleMute}
                aria-label={muted ? t.unmute : t.mute}
                aria-pressed={muted}
                title={muted ? t.unmute : t.mute}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="currentColor" stroke="none" />
                  {muted ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />}
                </svg>
              </button>

              <label className="min-w-0 flex-1">
                <span className="sr-only">{t.track}</span>
                {tracks.length > 1 ? (
                  <select
                    value={trackId}
                    onChange={(e) => selectTrack(e.target.value)}
                    className="h-11 w-full min-w-0 cursor-pointer truncate rounded-full bg-white/10 px-3 text-[13px] text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {tracks.map((x) => (
                      <option key={x.id} value={x.id} className="text-black">
                        ♪ {x.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="block truncate px-2 text-[13px] text-white/80">
                    {playing ? `♪ ${track?.title}` : t.hint}
                  </span>
                )}
              </label>
            </>
          )}
          {tracks.length === 0 && <span className="flex-1" />}

          <button
            type="button"
            className={iconBtn}
            onClick={() => setShareOpen((v) => !v)}
            aria-label={t.share}
            aria-expanded={shareOpen}
            title={t.share}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="18" cy="5.5" r="2.5" />
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="18.5" r="2.5" />
              <path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" />
            </svg>
          </button>

          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#1f9d55] px-4 text-[14px] font-semibold text-white transition hover:bg-[#1a8a4a]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" />
            </svg>
            <span className="hidden min-[400px]:inline">{ctaLabel}</span>
            <span className="min-[400px]:hidden">{t.order}</span>
          </a>

          {shareOpen && (
            <div className="absolute bottom-[calc(100%+10px)] end-2 w-60 rounded-2xl bg-[#141210]/95 p-2 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <p className="truncate px-3 pt-1 pb-2 text-[12px] text-white/60" dir="ltr">
                {shareUrl.replace(/^https?:\/\//, "")}
              </p>
              <button type="button" onClick={copyLink} className="w-full rounded-xl px-3 py-2.5 text-start text-[14px] hover:bg-white/10">
                {copied ? t.copied : t.copy}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl px-3 py-2.5 text-[14px] hover:bg-white/10"
              >
                {t.whatsapp}
              </a>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  type="button"
                  onClick={() => navigator.share({ title: shareText, url: shareUrl }).catch(() => undefined)}
                  className="w-full rounded-xl px-3 py-2.5 text-start text-[14px] hover:bg-white/10"
                >
                  {t.more}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
