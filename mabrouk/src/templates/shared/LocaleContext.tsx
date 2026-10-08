"use client";

import { createContext, useContext } from "react";
import type { L10n, Locale } from "@/lib/types";

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Pick the current language from a bilingual text. */
  tr: (text: L10n) => string;
}

export const LocaleContext = createContext<LocaleState | null>(null);

export function useLocale(): LocaleState {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleContext>");
  return ctx;
}
