import type { Venue } from "./types";

export function googleMapsUrl(venue: Venue): string | null {
  if (venue.mapsUrl) return venue.mapsUrl;
  if (venue.lat == null || venue.lng == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`;
}

export function wazeUrl(venue: Venue): string | null {
  if (venue.lat == null || venue.lng == null) return null;
  return `https://waze.com/ul?ll=${venue.lat},${venue.lng}&navigate=yes`;
}

function toCalendarStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(opts: {
  title: string;
  startsAt: string;
  endsAt: string;
  details: string;
  location: string;
}): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${toCalendarStamp(opts.startsAt)}/${toCalendarStamp(opts.endsAt)}`,
    details: opts.details,
    location: opts.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** wa.me deep link. Without a phone number WhatsApp asks which chat to send to. */
export function whatsappUrl(text: string, phone?: string): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
