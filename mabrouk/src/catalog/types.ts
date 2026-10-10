import { z } from "zod";

/**
 * The template catalog: what the landing page shows and the admin panel edits.
 *
 * Two kinds of template:
 * - "noor": rendered by the built-in Noor engine (envelope, RSVP, countdown…),
 *   customised through `noor` (texts, date, venue, images) and `colors`.
 * - "html": imported HTML/CSS/JS, rendered in a sandboxed iframe. `{{key}}`
 *   placeholders are filled from `variables`; colors are exposed as CSS
 *   variables (--mbk-background, --mbk-surface, --mbk-text, --mbk-accent, --mbk-seal).
 */

const l10n = z.object({ ar: z.string().max(400), en: z.string().max(400) });
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a #RRGGBB color");
/** A media reference: "/media/<id>" (uploaded), "/demo/…" (bundled sample photos) or an absolute https URL. */
const assetUrl = z
  .string()
  .max(2000)
  .refine((s) => s === "" || s.startsWith("/media/") || /^\/demo\/[a-z0-9-]+\.(webp|jpg|png)$/.test(s) || /^https:\/\//.test(s), "Use an uploaded file or an https URL");

export { BUILTIN_TRACK, BUILTIN_TRACKS } from "./builtin-tracks";

export const templateIdSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits and dashes only");

export const colorsSchema = z.object({
  background: color,
  surface: color,
  text: color,
  accent: color,
  seal: color,
});

const l10nLong = z.object({ ar: z.string().max(2000), en: z.string().max(2000) });

/**
 * Every section an invitation can show. The admin switches them on/off per
 * template and per invitation; templates hide switched-off sections and
 * close the gap (no empty spaces).
 */
export const FEATURES = [
  { key: "countdown", label: "Countdown timer" },
  { key: "couplePhotos", label: "Bride & groom photos" },
  { key: "music", label: "Background music" },
  { key: "venue", label: "Date, time & venue card" },
  { key: "timeline", label: "Event schedule / timeline" },
  { key: "venueImages", label: "Wedding location images" },
  { key: "mapsButton", label: "Google Maps & directions buttons" },
  { key: "gallery", label: "Photo gallery" },
  { key: "rsvp", label: "RSVP form" },
  { key: "dressCode", label: "Dress code" },
  { key: "gifts", label: "Gift information" },
  { key: "contact", label: "Contact information" },
  { key: "notes", label: "Additional notes" },
  { key: "share", label: "Social sharing" },
  { key: "animations", label: "Animated visual effects" },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];
export type Features = Record<FeatureKey, boolean>;

export const featuresSchema = z.object({
  countdown: z.boolean(),
  couplePhotos: z.boolean(),
  music: z.boolean(),
  venue: z.boolean(),
  timeline: z.boolean(),
  venueImages: z.boolean(),
  mapsButton: z.boolean(),
  gallery: z.boolean(),
  rsvp: z.boolean(),
  dressCode: z.boolean(),
  gifts: z.boolean(),
  contact: z.boolean(),
  notes: z.boolean(),
  share: z.boolean(),
  animations: z.boolean(),
}) satisfies z.ZodType<Features>;

export const noorConfigSchema = z.object({
  baseTheme: z.enum(["ivory-gold", "emerald-night", "blush-rose"]),
  /** "preset" keeps the hand-tuned theme colors; "custom" derives them from `colors`. */
  colorsMode: z.enum(["preset", "custom"]),
  market: z.enum(["EG", "GCC", "OTHER"]),
  tone: z.enum(["romantic", "formal"]),
  defaultLocale: z.enum(["ar", "en"]),
  partner1: l10n,
  partner2: l10n,
  latin1: z.string().max(60),
  latin2: z.string().max(60),
  opening: l10n,
  hostsLine: l10n,
  inviteLine: l10n,
  /** Local date-time of the main event, "YYYY-MM-DDTHH:mm". */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  timeZone: z.string().max(60),
  showHijri: z.boolean(),
  venueName: l10n,
  venueAddress: l10n,
  mapsUrl: z.string().max(2000),
  dressCode: l10n,
  heroImage: assetUrl,
  gallery: z.array(assetUrl).max(12),

  /* ---- Everything below is optional so designs saved earlier stay valid;
     resolveNoor() in ./content.ts fills in the defaults. ---- */

  /** Section switches (the "feature manager"). Missing key = on. */
  features: featuresSchema.partial().optional(),
  galleryLayout: z.enum(["carousel", "grid", "masonry", "coverflow"]).optional(),
  /** Couple photos: none, one or many, in the chosen layout. */
  couple: z
    .object({
      images: z.array(assetUrl).max(12),
      layout: z.enum(["arch", "polaroid", "filmstrip", "mosaic"]),
    })
    .optional(),
  /** Venue showcase: photos/screenshots of the hall, with a short story. */
  venueShowcase: z
    .object({
      images: z.array(assetUrl).max(16),
      layout: z.enum(["hero", "carousel", "grid"]),
      title: l10n,
      story: l10nLong,
    })
    .optional(),
  /** The evening's schedule, e.g. 20:00 guests arrive, 21:00 zaffa. */
  timeline: z
    .array(z.object({ time: z.string().regex(/^\d{2}:\d{2}$/), title: l10n, note: l10n }))
    .max(12)
    .optional(),
  gifts: z
    .object({
      message: l10nLong,
      accounts: z.array(z.object({ label: l10n, value: z.string().max(120) })).max(4),
    })
    .optional(),
  contacts: z
    .array(z.object({ name: l10n, phone: z.string().regex(/^\+?\d{6,16}$|^$/, "Digits only, with country code") }))
    .max(4)
    .optional(),
  notes: z.object({ title: l10n, body: l10nLong }).optional(),
  rsvpSettings: z
    .object({
      /** "YYYY-MM-DD" or "" for no deadline. */
      deadline: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
      maxHeadcount: z.number().int().min(1).max(20),
    })
    .optional(),
  countdown: z.object({ title: l10n, showSeconds: z.boolean() }).optional(),
});

/**
 * "duo": one invitation, two entrances. The bride's friends get a romantic
 * world, the groom's friends a shaabi (Egyptian street-wedding) one; each
 * side has its own song and texts. Shared details (names, date, venue…)
 * come from the `noor` config.
 */
const duoSideSchema = z.object({
  /** Gate button, e.g. "صحاب العروسة يجوا هنا". */
  gateLabel: l10n,
  /** Big title on the side, e.g. "يا بنات… الليلة ليلتنا". */
  title: l10n,
  /** Personal message for that group of friends. */
  message: l10n,
  /** Track played when this side is chosen (media id or builtin:*). */
  trackId: z.string().max(80),
});

export const duoConfigSchema = z.object({
  bride: duoSideSchema,
  groom: duoSideSchema,
  /** Question shown on the entrance gate. */
  gateQuestion: l10n,
  /** Entrance layout. Missing = "diagonal" (templates saved before styles existed). */
  style: z.enum(["diagonal", "doors", "tickets", "split"]).optional(),
  /** Color worlds for both sides. Missing = "classic". */
  palette: z.enum(["classic", "royal", "night", "sunset"]).optional(),
});

export type DuoConfig = z.infer<typeof duoConfigSchema>;

/** "layali": cinematic template (embossed 3D envelope + film-like hero). Content comes from `noor`. */
export const layaliConfigSchema = z.object({
  look: z.enum(["velvet", "royal", "midnight", "garden", "khaliji", "saeedi"]),
});

export type LayaliConfig = z.infer<typeof layaliConfigSchema>;

export const htmlConfigSchema = z.object({
  html: z.string().max(1_500_000),
  css: z.string().max(500_000),
  js: z.string().max(500_000),
  /** Where relative links in imported HTML should resolve (set on URL import). */
  baseUrl: z.string().max(2000),
});

export const templateSchema = z.object({
  id: templateIdSchema,
  kind: z.enum(["noor", "html", "duo", "layali"]),
  status: z.enum(["published", "draft"]),
  sortOrder: z.number().int().min(0).max(9999),
  name: l10n,
  description: l10n,
  thumbnail: assetUrl,
  colors: colorsSchema,
  noor: noorConfigSchema.optional(),
  html: htmlConfigSchema.optional(),
  duo: duoConfigSchema.optional(),
  layali: layaliConfigSchema.optional(),
  /** `{{key}}` → value, for html templates. */
  variables: z.record(z.string().regex(/^[a-zA-Z0-9_]{1,40}$/), z.string().max(2000)),
  music: z.object({
    /** Media ids of uploaded tracks, or BUILTIN_TRACK. */
    trackIds: z.array(z.string().max(80)).max(20),
    defaultTrackId: z.string().max(80),
  }),
  ctaText: l10n,
  updatedAt: z.string(),
});

export type ShowcaseTemplate = z.infer<typeof templateSchema>;
export type NoorDemoConfig = z.infer<typeof noorConfigSchema>;
export type TemplateColors = z.infer<typeof colorsSchema>;

/* ------------------------------------------------------------------ */

export interface MediaMeta {
  id: string;
  kind: "audio" | "image";
  name: string;
  mime: string;
  size: number;
  createdAt: string;
}

export const linkOverridesSchema = z.object({
  partner1: l10n.optional(),
  partner2: l10n.optional(),
  latin1: z.string().max(60).optional(),
  latin2: z.string().max(60).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .optional(),
  variables: z.record(z.string(), z.string().max(2000)).optional(),
});

export type LinkOverrides = z.infer<typeof linkOverridesSchema>;

/** A personalised preview sent to one client: /p/<token>. */
export interface PreviewLink {
  token: string;
  templateId: string;
  clientName: string;
  note: string;
  overrides: LinkOverrides;
  createdAt: string;
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // per request: Vercel request body limit is 4.5 MB
/** Whole file (bigger files are uploaded in pieces of at most MAX_UPLOAD_BYTES). */
export const MAX_MEDIA_BYTES = 12 * 1024 * 1024;

export const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/wav", "audio/webm"];
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"];
