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
  music: { src?: string };

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
