import type { InvitationContent, Locale, Market, SubEvent } from "./types";

/**
 * Date formatting happens on the server only, then the strings are passed to
 * client components. This avoids hydration mismatches between the server's and
 * the phone's ICU data (Hijri output in particular differs between engines).
 */

function intlLocale(locale: Locale, market: Market): string {
  if (locale === "en") return "en-GB";
  return market === "GCC" ? "ar-SA" : "ar-EG";
}

export function formatGregorianDate(iso: string, locale: Locale, market: Market, timeZone: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale, market), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
    calendar: "gregory",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale, market: Market, timeZone: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale, market), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(new Date(iso));
}

/** Hijri date using the Umm al-Qura calendar (official in Saudi Arabia). */
export function formatHijriDate(iso: string, locale: Locale, market: Market, timeZone: string): string {
  const base = locale === "en" ? "en-GB" : market === "EG" ? "ar-EG" : "ar-SA";
  return new Intl.DateTimeFormat(`${base}-u-ca-islamic-umalqura`, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(iso));
}

/** Day, month, year as separate strings (rendered with ornaments between them). */
export function numericDateParts(iso: string, locale: Locale, market: Market, timeZone: string): [string, string, string] {
  const parts = new Intl.DateTimeFormat(intlLocale(locale, market), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
    calendar: "gregory",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return [get("day"), get("month"), get("year")];
}

/** Latin "17 · 06 · 2027" (OG images). Never use "·" with Arabic-Indic digits: it reads as zero. */
export function formatNumericDate(iso: string, locale: Locale, market: Market, timeZone: string): string {
  return numericDateParts(iso, locale, market, timeZone).join(" · ");
}

export function defaultEndsAt(event: SubEvent): string {
  return event.endsAt ?? new Date(new Date(event.startsAt).getTime() + 4 * 3600_000).toISOString();
}

export function mainEvent(inv: InvitationContent): SubEvent {
  return inv.subEvents.find((e) => e.id === inv.mainEventId) ?? inv.subEvents[0];
}

/** Links stay live 6 months after the wedding unless set explicitly. */
export function expiryOf(inv: InvitationContent, liveMonths: number): Date {
  if (inv.expiresAt) return new Date(inv.expiresAt);
  const d = new Date(mainEvent(inv).startsAt);
  d.setUTCMonth(d.getUTCMonth() + liveMonths);
  return d;
}
