import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { buildDemoPayload, type DemoPayload } from "@/catalog/demo";
import { getMediaIndex } from "@/catalog/read";
import { buildNoorContent, zonedToIso } from "@/catalog/render";
import type { ShowcaseTemplate } from "@/catalog/types";
import type { InvitationContent } from "@/lib/types";
import { getLiveStore } from "./store";
import type { LiveInvitation, Validity } from "./types";

/** Every production-invitation read is tagged; admin saves expire it. */
export const LIVE_TAG = "live";
export const liveTag = (slug: string) => `live:${slug}`;

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Validity rules → concrete start/end instants in the event's time zone. */
export function computeWindow(validity: Validity, t: ShowcaseTemplate): { validFrom: string | null; validUntil: string | null } {
  const tz = t.noor?.timeZone ?? "Africa/Cairo";
  if (validity.mode === "range") {
    return { validFrom: zonedToIso(`${validity.from}T00:00`, tz), validUntil: zonedToIso(`${validity.until}T23:59`, tz) };
  }
  if (!t.noor) return { validFrom: null, validUntil: null };
  const eventDay = t.noor.date.slice(0, 10);
  return { validFrom: null, validUntil: zonedToIso(`${addDays(eventDay, 1 + validity.graceDays)}T23:59`, tz) };
}

/** Cached raw record (or null). */
export async function getLiveInvitation(slug: string): Promise<LiveInvitation | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(LIVE_TAG, liveTag(slug));
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) return null;
  try {
    return await getLiveStore().get(slug);
  } catch (err) {
    console.error("[live] get failed", err);
    return null;
  }
}

export interface LivePage {
  status: LiveInvitation["status"];
  validFrom: string | null;
  validUntil: string | null;
  payload: DemoPayload;
  title: string;
  description: string;
  timeZone: string;
}

/** Everything the public page needs, cached until the admin changes it. */
export async function getLivePage(slug: string): Promise<LivePage | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(LIVE_TAG, liveTag(slug));
  const inv = await getLiveInvitation(slug);
  if (!inv) return null;
  const payload = buildDemoPayload(inv.template, await getMediaIndex(), {
    path: `/i/${inv.slug}`,
    now: new Date(),
    live: { slug: inv.slug, hostKey: inv.hostKey },
  });
  const n = inv.template.noor;
  const title = n ? `دعوة فرح ${n.partner1.ar} و${n.partner2.ar}` : inv.template.name.ar || inv.clientName;
  const description = n ? `${n.inviteLine.ar} 💌 ${n.latin1} & ${n.latin2}` : inv.template.description.ar;
  return { status: inv.status, validFrom: inv.validFrom, validUntil: inv.validUntil, payload, title, description, timeZone: n?.timeZone ?? "Africa/Cairo" };
}

/**
 * Typed content for the RSVP/view APIs and the couple's dashboard, or null
 * when the invitation is unknown, switched off or outside its live window.
 */
export async function liveContent(slug: string, now = new Date(), opts: { ignoreWindow?: boolean } = {}): Promise<InvitationContent | null> {
  const inv = await getLiveInvitation(slug);
  if (!inv) return null;
  if (!opts.ignoreWindow) {
    if (inv.status !== "active") return null;
    if (inv.validFrom && now < new Date(inv.validFrom)) return null;
    if (inv.validUntil && now > new Date(inv.validUntil)) return null;
  }
  return contentOf(inv);
}

export function contentOf(inv: LiveInvitation): InvitationContent {
  const live = { slug: inv.slug, hostKey: inv.hostKey, expiresAt: inv.validUntil ?? undefined };
  if (inv.template.kind !== "html" && inv.template.noor) return buildNoorContent(inv.template, {}, live);
  // Imported HTML designs: no RSVP form, but opens are still counted.
  const name = { ar: inv.clientName || inv.template.name.ar, en: inv.clientName || inv.template.name.en };
  return {
    slug: inv.slug,
    templateId: "noor",
    templateVersion: 1,
    themeId: "ivory-gold",
    market: "EG",
    tone: "romantic",
    defaultLocale: "ar",
    status: "live",
    timeZone: "Africa/Cairo",
    showHijri: false,
    partner1: { name, latinName: inv.clientName },
    partner2: { name: { ar: "", en: "" }, latinName: "" },
    hostsLine: { ar: "", en: "" },
    inviteLine: { ar: "", en: "" },
    mainEventId: "main",
    subEvents: [
      {
        id: "main",
        kind: "wedding",
        startsAt: inv.validUntil ?? inv.createdAt,
        venue: { name: { ar: "", en: "" } },
        audience: "mixed",
        visibility: "public",
      },
    ],
    rsvp: { enabled: false, maxHeadcountGeneral: 1 },
    hostKey: inv.hostKey,
    expiresAt: inv.validUntil ?? undefined,
    guests: [],
  };
}
