import "server-only";
import { formatTime } from "@/lib/dates";
import { buildInvitationView } from "@/lib/invitations";
import { directionsUrl, googleMapsUrl } from "@/lib/links";
import type { InvitationContent } from "@/lib/types";
import type { InvitationView } from "@/lib/view";
import { deriveNoorColors } from "./colors";
import { hasText, resolveNoor } from "./content";
import type { LinkOverrides, ShowcaseTemplate } from "./types";

/** "2027-06-17T20:00" in Africa/Cairo → "2027-06-17T20:00:00+03:00". */
export function zonedToIso(local: string, timeZone: string): string {
  const [d, t] = local.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  const offsetMinutes = (at: number) => {
    const name =
      new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
        .formatToParts(new Date(at))
        .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
    const m = name.match(/GMT([+-])(\d{2}):?(\d{2})?/);
    return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
  };
  const off = offsetMinutes(guess - offsetMinutes(guess) * 60_000);
  const sign = off < 0 ? "-" : "+";
  const abs = Math.abs(off);
  return `${local}:00${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/**
 * A catalog design (+ optional client overrides) as typed invitation content.
 * Demos and client previews use `slug: "demo-…", isDemo: true`; production
 * invitations pass their real slug and host key so RSVPs are stored.
 */
export function buildNoorContent(
  t: ShowcaseTemplate,
  o: LinkOverrides = {},
  live?: { slug: string; hostKey: string; expiresAt?: string },
): InvitationContent {
  const c = resolveNoor(t.noor!);
  const f = c.features;
  const startsAt = zonedToIso(o.date ?? c.date, c.timeZone);
  const deadline = c.rsvpSettings.deadline ? zonedToIso(`${c.rsvpSettings.deadline}T23:59`, c.timeZone) : undefined;
  const giftAccounts = c.gifts.accounts.filter((a) => a.value.trim());
  return {
    slug: live?.slug ?? `demo-${t.id}`,
    templateId: "noor",
    templateVersion: 1,
    themeId: c.baseTheme,
    market: c.market,
    tone: c.tone,
    defaultLocale: c.defaultLocale,
    status: "live",
    isDemo: !live,
    timeZone: c.timeZone,
    showHijri: c.showHijri,
    partner1: { name: o.partner1 ?? c.partner1, latinName: o.latin1 ?? c.latin1 },
    partner2: { name: o.partner2 ?? c.partner2, latinName: o.latin2 ?? c.latin2 },
    opening: hasText(c.opening) ? c.opening : undefined,
    hostsLine: c.hostsLine,
    inviteLine: c.inviteLine,
    mainEventId: "main",
    subEvents: [
      {
        id: "main",
        kind: "wedding",
        startsAt,
        venue: { name: c.venueName, address: c.venueAddress, mapsUrl: c.mapsUrl || undefined },
        audience: "mixed",
        visibility: "public",
      },
    ],
    dressCode: f.dressCode && hasText(c.dressCode) ? c.dressCode : undefined,
    gifts:
      f.gifts && (hasText(c.gifts.message) || giftAccounts.length)
        ? { message: c.gifts.message, accounts: giftAccounts }
        : undefined,
    gallery: f.gallery
      ? c.gallery.map((src, i) => ({ src, alt: { ar: `صورة ${i + 1}`, en: `Photo ${i + 1}` }, width: 900, height: 1200 }))
      : [],
    rsvp: { enabled: f.rsvp, deadline, maxHeadcountGeneral: c.rsvpSettings.maxHeadcount },
    // Demos never expire and never store anything.
    expiresAt: live?.expiresAt ?? "2999-01-01T00:00:00Z",
    hostKey: live?.hostKey ?? "demo",
    guests: [],
  };
}

/** Noor/Farah design → the view object the templates render. */
export function buildNoorView(
  t: ShowcaseTemplate,
  opts: { overrides?: LinkOverrides; now?: Date; live?: { slug: string; hostKey: string }; shareUrl?: string } = {},
): InvitationView {
  const c = resolveNoor(t.noor!);
  const f = c.features;
  const content = buildNoorContent(t, opts.overrides, opts.live);
  const view = buildInvitationView(content, null, opts.now ?? new Date());
  const main = content.subEvents[0];
  const both = (fn: (l: "ar" | "en") => string) => ({ ar: fn("ar"), en: fn("en") });
  const day = (opts.overrides?.date ?? c.date).slice(0, 10);

  const coupleImages = f.couplePhotos ? c.couple.images.filter(Boolean) : [];
  const venueImages = f.venueImages ? c.venueShowcase.images.filter(Boolean) : [];
  const venueText = [c.venueName.en || c.venueName.ar, c.venueAddress.en || c.venueAddress.ar].filter(Boolean).join(", ");

  return {
    ...view,
    // The venue card can be switched off; maps buttons separately.
    subEvents: f.venue
      ? view.subEvents.map((e) => (f.mapsButton ? e : { ...e, mapsUrl: null, wazeUrl: null }))
      : [],
    music: { external: true },
    themeColors: c.colorsMode === "custom" ? deriveNoorColors(t.colors) : undefined,
    heroImage: c.couple.layout === "arch" ? coupleImages[0] : undefined,
    features: f,
    couple: coupleImages.length ? { images: coupleImages, layout: c.couple.layout } : undefined,
    galleryLayout: c.galleryLayout,
    venueShowcase:
      venueImages.length || hasText(c.venueShowcase.story)
        ? {
            images: venueImages,
            layout: c.venueShowcase.layout,
            title: hasText(c.venueShowcase.title) ? c.venueShowcase.title : undefined,
            story: hasText(c.venueShowcase.story) ? c.venueShowcase.story : undefined,
            mapsUrl: f.mapsButton ? googleMapsUrl(main.venue) : null,
            directionsUrl: f.mapsButton ? directionsUrl(main.venue, venueText) : null,
            venueName: c.venueName,
            venueAddress: hasText(c.venueAddress) ? c.venueAddress : undefined,
          }
        : undefined,
    timeline: f.timeline
      ? [...c.timeline]
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((s) => ({
            time: both((l) => formatTime(zonedToIso(`${day}T${s.time}`, c.timeZone), l, c.market, c.timeZone)),
            title: s.title,
            note: hasText(s.note) ? s.note : undefined,
          }))
      : undefined,
    contacts: f.contact ? c.contacts.filter((x) => x.phone && hasText(x.name)) : undefined,
    notes: f.notes && hasText(c.notes.body) ? { title: hasText(c.notes.title) ? c.notes.title : undefined, body: c.notes.body } : undefined,
    countdown: { title: hasText(c.countdown.title) ? c.countdown.title : undefined, showSeconds: c.countdown.showSeconds },
    shareUrl: f.share ? opts.shareUrl : undefined,
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/**
 * HTML template → one self-contained document for a sandboxed iframe.
 * `{{key}}` placeholders are replaced with HTML-escaped values; the five
 * template colors are exposed as CSS variables.
 */
export function buildHtmlDocument(t: ShowcaseTemplate, o: LinkOverrides = {}): string {
  const h = t.html ?? { html: "", css: "", js: "", baseUrl: "" };
  const vars = { ...t.variables, ...(o.variables ?? {}) };
  const fill = (s: string) => s.replace(/\{\{\s*([a-zA-Z0-9_]{1,40})\s*\}\}/g, (m, k) => (k in vars ? escapeHtml(vars[k]) : m));

  const colorVars = `:root{--mbk-background:${t.colors.background};--mbk-surface:${t.colors.surface};--mbk-text:${t.colors.text};--mbk-accent:${t.colors.accent};--mbk-seal:${t.colors.seal}}`;
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    h.baseUrl ? `<base href="${escapeHtml(h.baseUrl)}">` : "",
    `<style>${colorVars}</style>`,
    h.css ? `<style>${h.css.replace(/<\/style/gi, "<\\/style")}</style>` : "",
  ].join("");
  const script = h.js ? `<script>${h.js.replace(/<\/script/gi, "<\\/script")}</script>` : "";
  const body = fill(h.html);

  if (/<html[\s>]/i.test(body)) {
    // A full document: inject into its <head> and before </body>.
    let doc = /<head[^>]*>/i.test(body) ? body.replace(/<head[^>]*>/i, (m) => m + head) : body.replace(/<html[^>]*>/i, (m) => `${m}<head>${head}</head>`);
    doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, `${script}</body>`) : doc + script;
    return doc;
  }
  return `<!doctype html><html><head>${head}</head><body>${body}${script}</body></html>`;
}
