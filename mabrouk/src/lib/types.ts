/**
 * The Mabrouk data model.
 *
 *   invitation = templateId (+ pinned templateVersion) + themeId + typed content
 *
 * Every human-readable text field is bilingual ({ ar, en }). Arabic is the
 * default locale. Cultural variants (Egypt vs GCC) are expressed as data, not
 * as separate templates.
 */

export type Locale = "ar" | "en";
export const LOCALES: readonly Locale[] = ["ar", "en"] as const;

/** A bilingual text. Both languages are required so the toggle never shows blanks. */
export interface L10n {
  ar: string;
  en: string;
}

/** Egypt first, then the Gulf. "other" covers the rest of the Middle East / diaspora. */
export type Market = "EG" | "GCC" | "OTHER";

/**
 * Wording register.
 * - "romantic": modern Egyptian tone, the couple speaks ("We're getting married").
 * - "formal": GCC tone, the families invite you ("The families of … are honoured to invite you").
 */
export type Tone = "romantic" | "formal";

export type SubEventKind = "engagement" | "katb-el-kitab" | "henna" | "wedding";

/** GCC weddings often have separate men-only and women-only receptions. */
export type Audience = "mixed" | "men" | "women";

export type TemplateId = "noor";
export type ThemeId = "ivory-gold" | "emerald-night" | "blush-rose";

export interface Person {
  /** Display name in each language. */
  name: L10n;
  /**
   * Latin-script name used where Arabic shaping isn't available
   * (OpenGraph images are rendered with Satori, which can't shape Arabic).
   */
  latinName: string;
}

export interface Venue {
  name: L10n;
  address?: L10n;
  /** Coordinates power the Google Maps and Waze buttons. */
  lat?: number;
  lng?: number;
  /** Optional explicit Google Maps link (e.g. a shared place link). Wins over lat/lng. */
  mapsUrl?: string;
}

export interface SubEvent {
  /** Stable id, referenced by guests' invitation lists. */
  id: string;
  kind: SubEventKind;
  /** Optional custom title; defaults to the localized kind name. */
  title?: L10n;
  /** ISO 8601 with offset, e.g. "2026-12-17T19:30:00+02:00". */
  startsAt: string;
  /** ISO 8601 with offset. Defaults to startsAt + 4h for calendar links. */
  endsAt?: string;
  venue: Venue;
  audience: Audience;
  /**
   * "public": shown on the general link.
   * "guests-only": shown only on personal links of guests invited to it
   * (e.g. a women-only reception with its own guest list).
   */
  visibility: "public" | "guests-only";
  dressCode?: L10n;
  note?: L10n;
}

export interface StoryItem {
  /** Free text date label, e.g. { ar: "صيف ٢٠٢٣", en: "Summer 2023" }. */
  when?: L10n;
  title: L10n;
  body: L10n;
}

export interface GiftAccount {
  label: L10n;
  /** E.g. an InstaPay handle or IBAN. Shown with a copy button. */
  value: string;
}

export interface GalleryImage {
  /** Path under /public or an absolute https URL. */
  src: string;
  alt: L10n;
  width: number;
  height: number;
}

export interface Guest {
  /** Unguessable code used in /i/[slug]/[guestCode]. */
  code: string;
  /** How the invitation greets them, e.g. { ar: "أحمد وعائلته", en: "Ahmed & Family" }. */
  displayName: L10n;
  /** Latin name for OG images. */
  latinName: string;
  /** Max headcount this guest may RSVP for (enforced server-side). */
  seats: number;
  /**
   * Which sub-events this guest is invited to. Omit = all public events.
   * This is how GCC men-only / women-only guest lists are expressed.
   */
  subEventIds?: string[];
  /** Digits only, international format. Used for the host's one-tap wa.me link. */
  phone?: string;
  /** Preferred language for their personal link and WhatsApp message. */
  locale?: Locale;
  /** Free note for the host (never shown to the guest). */
  hostNote?: string;
}

export interface MusicConfig {
  /**
   * Royalty-free audio file under /public (mp3/m4a). If omitted, the built-in
   * synthesized music box (generated in the browser, zero bytes) is used.
   */
  src?: string;
  credit?: string;
}

export interface InvitationContent {
  /** Unguessable URL slug, e.g. "omar-laila-7k2mq9". */
  slug: string;
  templateId: TemplateId;
  /** Pinned template version — improving a template never changes published invitations. */
  templateVersion: number;
  themeId: ThemeId;

  market: Market;
  tone: Tone;
  defaultLocale: Locale;

  /** "live" invitations are served; "draft" ones 404. */
  status: "draft" | "live";
  /** Demo invitations accept RSVPs in the UI but never store them. */
  isDemo?: boolean;

  /** IANA time zone used to format every date, e.g. "Africa/Cairo", "Asia/Riyadh". */
  timeZone: string;
  /** Show the Hijri (Umm al-Qura) date next to the Gregorian one. */
  showHijri: boolean;

  /** Order of names follows local custom; partner1 is shown first. */
  partner1: Person;
  partner2: Person;
  /** Optional opening line, e.g. Basmala or a Quran verse. */
  opening?: L10n;
  /** "Together with their families" / "The families of … invite you". */
  hostsLine: L10n;
  /** Main invitation sentence under the names. */
  inviteLine: L10n;

  /** The headline event used by the countdown. Must match a sub-event id. */
  mainEventId: string;
  subEvents: SubEvent[];

  story?: StoryItem[];
  dressCode?: L10n;
  gifts?: { message: L10n; accounts?: GiftAccount[] };
  /** Photos are optional; templates must look premium without them. */
  gallery?: GalleryImage[];
  music?: MusicConfig;

  rsvp: {
    enabled: boolean;
    /** ISO date. After it, the form closes. */
    deadline?: string;
    /** Max headcount on the general (non-personal) link. */
    maxHeadcountGeneral: number;
  };

  /**
   * Optional PIN gate (GCC request): forwarded links can't be opened without it.
   * Stored server-side only; never sent to the browser.
   */
  pin?: string;
  /** Secret key for the host dashboard: /host/[slug]?key=… Server-side only. */
  hostKey: string;
  /** ISO date. Defaults to the main event + 6 months. */
  expiresAt?: string;

  guests: Guest[];
}

/* ------------------------------------------------------------------ */
/* Storage records                                                     */
/* ------------------------------------------------------------------ */

export interface RsvpInput {
  invitationSlug: string;
  guestCode?: string;
  name: string;
  attending: boolean;
  headcount: number;
  message?: string;
  locale: Locale;
}

export interface RsvpRecord extends RsvpInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ViewEventInput {
  invitationSlug: string;
  guestCode?: string;
  kind: "open";
  locale: Locale;
}
