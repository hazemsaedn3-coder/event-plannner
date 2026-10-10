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

/** Google Maps turn-by-turn directions to the venue (opens the Maps app on phones). */
export function directionsUrl(venue: Venue, fallbackText?: string): string | null {
  const fromLink = venue.mapsUrl?.match(/[?&](?:query|q|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  const at = venue.lat != null && venue.lng != null ? `${venue.lat},${venue.lng}` : fromLink ? `${fromLink[1]},${fromLink[2]}` : fallbackText?.trim();
  return at ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(at)}` : null;
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
