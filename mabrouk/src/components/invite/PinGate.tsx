"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { dirOf, t, ui } from "@/lib/i18n";
import type { Locale, ThemeId } from "@/lib/types";
import { noorThemes, themeStyle } from "@/templates/noor/v1/themes";

/** PIN screen for private (GCC) invitations. The invitation content is not in this page. */
export function PinGate({ slug, themeId, initialLocale }: { slug: string; themeId: ThemeId; initialLocale: Locale }) {
  const router = useRouter();
  const [locale, setLocale] = useState(initialLocale);
  const [pin, setPin] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "wrong">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("checking");
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, pin }),
    }).catch(() => null);
    if (res?.ok) {
      router.refresh();
    } else {
      setState("wrong");
    }
  }

  return (
    <main
      lang={locale}
      dir={dirOf(locale)}
      className="noor-bg relative flex min-h-[100svh] flex-col items-center justify-center px-8 text-center text-[var(--ink)]"
      style={themeStyle(noorThemes[themeId]) as CSSProperties}
    >
      <button
        type="button"
        onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
        className="absolute top-4 end-4 rounded-full border border-[var(--line)] px-4 py-2 text-[14px] text-[var(--accent)]"
      >
        {t(ui.language, locale)}
      </button>
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--line)] text-[var(--accent)]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <h1 className="f-display mt-5 text-[30px]">{t(ui.pinTitle, locale)}</h1>
      <p className="f-body mt-2 max-w-[280px] text-[15px] text-[var(--ink-soft)]">{t(ui.pinBody, locale)}</p>
      <form onSubmit={submit} className="mt-8 flex w-full max-w-[280px] flex-col gap-3">
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 8));
            setState("idle");
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          dir="ltr"
          aria-label={t(ui.pinTitle, locale)}
          className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5 text-center font-mono text-[24px] tracking-[0.5em] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
        />
        {state === "wrong" && (
          <p className="f-body text-[14px] text-red-500" role="alert">
            {t(ui.pinWrong, locale)}
          </p>
        )}
        <button
          type="submit"
          disabled={pin.length < 4 || state === "checking"}
          className="f-display rounded-full bg-[var(--accent)] px-6 py-3.5 text-[19px] text-[var(--bg)] disabled:opacity-40"
        >
          {t(ui.pinOpen, locale)}
        </button>
      </form>
    </main>
  );
}
