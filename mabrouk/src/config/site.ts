/**
 * Site-wide settings. Edit these before launch.
 */
export const siteConfig = {
  brand: { ar: "مبروك", en: "Mabrouk" },
  tagline: {
    ar: "دعوات زفاف رقمية فاخرة… برابط واحد",
    en: "Premium digital wedding invitations, in one link",
  },
  /**
   * Public base URL, used for absolute links (OG images, WhatsApp messages).
   * Set NEXT_PUBLIC_SITE_URL in production (falls back to Vercel's production domain).
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  /**
   * TODO(before launch): replace with the real WhatsApp Business number.
   * International format, digits only (no +, no spaces). 20 = Egypt.
   */
  whatsappNumber: "201000000000",
  instagram: "https://instagram.com/mabrouk.invites", // placeholder handle
  tiktok: "https://tiktok.com/@mabrouk.invites", // placeholder handle
  /** Operations defaults (see docs/PRODUCT_BRIEF.md). */
  operations: {
    deliveryHours: 72,
    includedRevisions: 2,
    liveMonthsAfterWedding: 6,
  },
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
