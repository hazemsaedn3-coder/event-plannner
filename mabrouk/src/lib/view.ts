import type {
  Audience,
  GalleryImage,
  GiftAccount,
  L10n,
  Locale,
  Market,
  StoryItem,
  SubEventKind,
  TemplateId,
  ThemeId,
  Tone,
} from "./types";

/**
 * What a template receives: the public, pre-formatted projection of an
 * invitation. It never contains the PIN, the host key or the guest list,
 * so it is safe to serialize to the browser.
 */
export interface SubEventView {
  id: string;
  kind: SubEventKind;
  title: L10n;
  audience: Audience;
  startsAt: string;
  date: L10n;
  time: L10n;
  hijri?: L10n;
  venueName: L10n;
  venueAddress?: L10n;
  mapsUrl: string | null;
  wazeUrl: string | null;
  calendarUrl: L10n;
  dressCode?: L10n;
  note?: L10n;
}

export interface InvitationView {
  slug: string;
  templateId: TemplateId;
  templateVersion: number;
  themeId: ThemeId;
  market: Market;
  tone: Tone;
  initialLocale: Locale;
  isDemo: boolean;

  partner1: L10n;
  partner2: L10n;
  /** Initials for the wax seal monogram (kept apart so Arabic letters don't join). */
  monogram: Record<Locale, [string, string]>;
  opening?: L10n;
  hostsLine: L10n;
  inviteLine: L10n;

  main: {
    startsAt: string;
    date: L10n;
    numeric: Record<Locale, [string, string, string]>;
    time: L10n;
    hijri?: L10n;
  };
  subEvents: SubEventView[];

  story?: StoryItem[];
  dressCode?: L10n;
  gifts?: { message: L10n; accounts?: GiftAccount[] };
  gallery?: GalleryImage[];
  /**
   * Music source. `external: true` means a host page (the template demo
   * player) controls audio, so the template hides its own music button.
   */
  music: { src?: string; external?: boolean };
  /** Full color override (catalog templates with custom colors). */
  themeColors?: Record<
    | "bg" | "bg2" | "surface" | "ink" | "inkSoft" | "accent" | "accentSoft" | "line"
    | "envelope" | "envelopeFront" | "card" | "cardInk" | "seal" | "sealDark" | "sealInk",
    string
  >;
  /** Optional couple photo shown inside the hero arch. */
  heroImage?: string;

  /**
   * Section switches set by the admin. Missing = everything on (hand-written
   * invitations in src/content). Read through `shows(view, key)`.
   */
  features?: Partial<Record<FeatureKey, boolean>>;
  couple?: { images: string[]; layout: "arch" | "polaroid" | "filmstrip" | "mosaic" };
  galleryLayout?: "carousel" | "grid" | "masonry" | "coverflow";
  venueShowcase?: {
    images: string[];
    layout: "hero" | "carousel" | "grid";
    title?: L10n;
    story?: L10n;
    mapsUrl: string | null;
    /** Turn-by-turn directions (Google Maps "dir" link). */
    directionsUrl: string | null;
    venueName: L10n;
    venueAddress?: L10n;
  };
  timeline?: { time: L10n; title: L10n; note?: L10n }[];
  contacts?: { name: L10n; phone: string }[];
  notes?: { title?: L10n; body: L10n };
  countdown?: { title?: L10n; showSeconds: boolean };
  /** Public URL guests can share (social sharing section). */
  shareUrl?: string;

  rsvp: {
    enabled: boolean;
    open: boolean;
    deadline?: L10n;
    maxHeadcount: number;
  };

  guest?: {
    code: string;
    displayName: L10n;
    seats: number;
  };

  expired: boolean;
}

export type FeatureKey =
  | "countdown" | "couplePhotos" | "music" | "venue" | "timeline" | "venueImages" | "mapsButton"
  | "gallery" | "rsvp" | "dressCode" | "gifts" | "contact" | "notes" | "share" | "animations";

/** Is this section switched on? (Missing switch = on.) */
export function shows(view: Pick<InvitationView, "features">, key: FeatureKey): boolean {
  return view.features?.[key] !== false;
}
