import "server-only";
import { absoluteUrl } from "@/config/site";
import { getStorage } from "@/storage";
import { getInvitation } from "./invitations";
import { t } from "./i18n";
import { whatsappUrl } from "./links";
import { safeEqual } from "./security";
import type { Guest, InvitationContent, Locale, RsvpRecord } from "./types";

export function authorizeHost(slug: string, key: unknown): InvitationContent | null {
  const inv = getInvitation(slug);
  if (!inv || typeof key !== "string" || !key) return null;
  return safeEqual(key, inv.hostKey) ? inv : null;
}

export function guestLink(inv: InvitationContent, guest: Guest): string {
  return absoluteUrl(`/i/${inv.slug}/${guest.code}`);
}

/** The personal WhatsApp message the host sends to each guest. */
export function guestWhatsappMessage(inv: InvitationContent, guest: Guest): string {
  const l: Locale = guest.locale ?? inv.defaultLocale;
  const couple = l === "ar" ? `${inv.partner1.name.ar} و${inv.partner2.name.ar}` : `${inv.partner1.name.en} & ${inv.partner2.name.en}`;
  const link = guestLink(inv, guest);
  const pinLine = inv.pin ? (l === "ar" ? `\nرمز الدخول: ${inv.pin}` : `\nAccess code: ${inv.pin}`) : "";
  return l === "ar"
    ? `${t(guest.displayName, l)}، السلام عليكم 🤍\nيسعدنا دعوتكم لحفل زفاف ${couple}.\nتفاصيل الدعوة وتأكيد الحضور من هنا:\n${link}${pinLine}`
    : `Dear ${t(guest.displayName, l)} 🤍\nWe would be honoured to celebrate the wedding of ${couple} with you.\nYour invitation & RSVP:\n${link}${pinLine}`;
}

export function guestWhatsappUrl(inv: InvitationContent, guest: Guest): string {
  return whatsappUrl(guestWhatsappMessage(inv, guest), guest.phone);
}

export interface HostData {
  inv: InvitationContent;
  rsvps: RsvpRecord[];
  views: { total: number; byGuest: Record<string, number> };
  totals: {
    replies: number;
    attendingReplies: number;
    declinedReplies: number;
    attendingHeadcount: number;
    invitedSeats: number;
    guestsPending: number;
  };
  storageKind: "local" | "supabase";
}

export async function loadHostData(inv: InvitationContent): Promise<HostData> {
  const storage = getStorage();
  const [rsvps, views] = await Promise.all([storage.listRsvps(inv.slug), storage.countViews(inv.slug)]);
  const answered = new Set(rsvps.map((r) => r.guestCode).filter(Boolean));
  const attending = rsvps.filter((r) => r.attending);
  return {
    inv,
    rsvps,
    views,
    totals: {
      replies: rsvps.length,
      attendingReplies: attending.length,
      declinedReplies: rsvps.length - attending.length,
      attendingHeadcount: attending.reduce((s, r) => s + r.headcount, 0),
      invitedSeats: inv.guests.reduce((s, g) => s + g.seats, 0),
      guestsPending: inv.guests.filter((g) => !answered.has(g.code)).length,
    },
    storageKind: storage.kind,
  };
}

/** CSV with a BOM so Excel opens Arabic correctly; formula-injection safe. */
export function rsvpsToCsv(inv: InvitationContent, rsvps: RsvpRecord[]): string {
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = ["name", "guest_code", "guest_seats", "attending", "headcount", "message", "language", "replied_at"];
  const rows = rsvps.map((r) => {
    const guest = r.guestCode ? inv.guests.find((g) => g.code === r.guestCode) : undefined;
    return [
      guest ? `${guest.displayName.ar} / ${guest.displayName.en}` : r.name,
      r.guestCode ?? "",
      guest?.seats ?? "",
      r.attending ? "yes" : "no",
      r.headcount,
      r.message ?? "",
      r.locale,
      r.updatedAt,
    ];
  });
  return "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}
