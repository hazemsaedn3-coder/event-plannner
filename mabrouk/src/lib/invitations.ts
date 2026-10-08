import "server-only";
import { invitations } from "@/content/invitations";
import { siteConfig } from "@/config/site";
import {
  defaultEndsAt,
  expiryOf,
  formatGregorianDate,
  formatHijriDate,
  numericDateParts,
  formatTime,
  mainEvent,
} from "./dates";
import { subEventKindLabel, t } from "./i18n";
import { googleCalendarUrl, googleMapsUrl, wazeUrl } from "./links";
import type { Guest, InvitationContent, L10n, Locale, SubEvent } from "./types";
import type { InvitationView, SubEventView } from "./view";

const bySlug = new Map(invitations.map((inv) => [inv.slug, inv]));

/** Live invitation by slug, or null (drafts and unknown slugs 404). */
export function getInvitation(slug: string): InvitationContent | null {
  const inv = bySlug.get(slug);
  return inv && inv.status === "live" ? inv : null;
}

export function listLiveInvitations(): InvitationContent[] {
  return invitations.filter((inv) => inv.status === "live");
}

export function getGuest(inv: InvitationContent, code: string): Guest | null {
  return inv.guests.find((g) => g.code === code) ?? null;
}

/** General link: public events only. Personal link: the guest's own list. */
export function visibleSubEvents(inv: InvitationContent, guest?: Guest | null): SubEvent[] {
  const events = guest?.subEventIds
    ? inv.subEvents.filter((e) => guest.subEventIds!.includes(e.id))
    : inv.subEvents.filter((e) => e.visibility === "public");
  return [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function both(fn: (locale: Locale) => string): L10n {
  return { ar: fn("ar"), en: fn("en") };
}

function firstLetter(s: string): string {
  return Array.from(s.replace(/^(ال)/, "").trim())[0] ?? "";
}

function subEventView(inv: InvitationContent, e: SubEvent): SubEventView {
  const title = e.title ?? subEventKindLabel[e.kind];
  const couple = both((l) => `${t(inv.partner1.name, l)} & ${t(inv.partner2.name, l)}`);
  return {
    id: e.id,
    kind: e.kind,
    title,
    audience: e.audience,
    startsAt: e.startsAt,
    date: both((l) => formatGregorianDate(e.startsAt, l, inv.market, inv.timeZone)),
    time: both((l) => formatTime(e.startsAt, l, inv.market, inv.timeZone)),
    hijri: inv.showHijri ? both((l) => formatHijriDate(e.startsAt, l, inv.market, inv.timeZone)) : undefined,
    venueName: e.venue.name,
    venueAddress: e.venue.address,
    mapsUrl: googleMapsUrl(e.venue),
    wazeUrl: wazeUrl(e.venue),
    calendarUrl: both((l) =>
      googleCalendarUrl({
        title: `${t(title, l)} · ${t(couple, l)}`,
        startsAt: e.startsAt,
        endsAt: defaultEndsAt(e),
        details: `${t(couple, l)}`,
        location: [t(e.venue.name, l), e.venue.address ? t(e.venue.address, l) : ""].filter(Boolean).join(", "),
      }),
    ),
    dressCode: e.dressCode,
    note: e.note,
  };
}

/**
 * Build the public view of an invitation. `now` is passed in so callers decide
 * where time is read (see the cached loader in app/(invite)).
 */
export function buildInvitationView(inv: InvitationContent, guest: Guest | null, now: Date): InvitationView {
  const main = mainEvent(inv);
  const events = visibleSubEvents(inv, guest);
  const deadline = inv.rsvp.deadline;
  const expired = now > expiryOf(inv, siteConfig.operations.liveMonthsAfterWedding);

  return {
    slug: inv.slug,
    templateId: inv.templateId,
    templateVersion: inv.templateVersion,
    themeId: inv.themeId,
    market: inv.market,
    tone: inv.tone,
    initialLocale: guest?.locale ?? inv.defaultLocale,
    isDemo: Boolean(inv.isDemo),

    partner1: inv.partner1.name,
    partner2: inv.partner2.name,
    monogram: {
      ar: [firstLetter(inv.partner1.name.ar), firstLetter(inv.partner2.name.ar)],
      en: [firstLetter(inv.partner1.latinName), firstLetter(inv.partner2.latinName)],
    },
    opening: inv.opening,
    hostsLine: inv.hostsLine,
    inviteLine: inv.inviteLine,

    main: {
      startsAt: main.startsAt,
      date: both((l) => formatGregorianDate(main.startsAt, l, inv.market, inv.timeZone)),
      numeric: {
        ar: numericDateParts(main.startsAt, "ar", inv.market, inv.timeZone),
        en: numericDateParts(main.startsAt, "en", inv.market, inv.timeZone),
      },
      time: both((l) => formatTime(main.startsAt, l, inv.market, inv.timeZone)),
      hijri: inv.showHijri ? both((l) => formatHijriDate(main.startsAt, l, inv.market, inv.timeZone)) : undefined,
    },
    subEvents: events.map((e) => subEventView(inv, e)),

    story: inv.story,
    dressCode: inv.dressCode,
    gifts: inv.gifts,
    gallery: inv.gallery,
    music: { src: inv.music?.src },

    rsvp: {
      enabled: inv.rsvp.enabled,
      open: inv.rsvp.enabled && (!deadline || now <= new Date(deadline)),
      deadline: deadline
        ? both((l) => formatGregorianDate(deadline, l, inv.market, inv.timeZone))
        : undefined,
      maxHeadcount: guest ? guest.seats : inv.rsvp.maxHeadcountGeneral,
    },

    guest: guest ? { code: guest.code, displayName: guest.displayName, seats: guest.seats } : undefined,

    expired,
  };
}
