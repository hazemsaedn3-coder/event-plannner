import "server-only";
import { buildInvitationView } from "@/lib/invitations";
import type { InvitationContent } from "@/lib/types";
import type { InvitationView } from "@/lib/view";
import { deriveNoorColors } from "./colors";
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

/** Noor template → the same view object a real invitation produces (always a demo). */
export function buildNoorDemoView(t: ShowcaseTemplate, o: LinkOverrides = {}, now = new Date()): InvitationView {
  const c = t.noor!;
  const startsAt = zonedToIso(o.date ?? c.date, c.timeZone);
  const content: InvitationContent = {
    slug: `demo-${t.id}`,
    templateId: "noor",
    templateVersion: 1,
    themeId: c.baseTheme,
    market: c.market,
    tone: c.tone,
    defaultLocale: c.defaultLocale,
    status: "live",
    isDemo: true,
    timeZone: c.timeZone,
    showHijri: c.showHijri,
    partner1: { name: o.partner1 ?? c.partner1, latinName: o.latin1 ?? c.latin1 },
    partner2: { name: o.partner2 ?? c.partner2, latinName: o.latin2 ?? c.latin2 },
    opening: c.opening.ar || c.opening.en ? c.opening : undefined,
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
    dressCode: c.dressCode.ar || c.dressCode.en ? c.dressCode : undefined,
    gallery: c.gallery.map((src, i) => ({
      src,
      alt: { ar: `صورة ${i + 1}`, en: `Photo ${i + 1}` },
      width: 900,
      height: 1200,
    })),
    rsvp: { enabled: true, maxHeadcountGeneral: 2 },
    // Demos never expire and never store anything.
    expiresAt: "2999-01-01T00:00:00Z",
    hostKey: "demo",
    guests: [],
  };
  const view = buildInvitationView(content, null, now);
  return {
    ...view,
    music: { external: true },
    themeColors: c.colorsMode === "custom" ? deriveNoorColors(t.colors) : undefined,
    heroImage: c.heroImage || undefined,
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
