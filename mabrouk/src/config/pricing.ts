/**
 * All prices live here. Change a number, redeploy, and the landing page,
 * FAQ and WhatsApp order messages update everywhere.
 */
export type Currency = "EGP" | "USD";

export interface Price {
  EGP: number;
  USD: number;
}

export const pricing = {
  base: { EGP: 500, USD: 20 } satisfies Price,
  addOns: {
    guestLinks: { EGP: 250, USD: 10 } satisfies Price,
    rush24h: { EGP: 150, USD: 5 } satisfies Price,
    // The brief only fixes the EGP price; USD defaults to $4 (≈ same ratio).
    extraRevision: { EGP: 100, USD: 4 } satisfies Price,
  },
} as const;

export type AddOnId = keyof typeof pricing.addOns;

export const addOnLabels: Record<AddOnId, { ar: string; en: string }> = {
  guestLinks: { ar: "روابط شخصية لكل ضيف", en: "Personal guest links" },
  rush24h: { ar: "تسليم مستعجل خلال ٢٤ ساعة", en: "24-hour rush delivery" },
  extraRevision: { ar: "جولة تعديلات إضافية", en: "Extra revision round" },
};

export function formatPrice(amount: number, currency: Currency, locale: "ar" | "en"): string {
  if (currency === "EGP") {
    return locale === "ar"
      ? `${amount.toLocaleString("ar-EG")} جنيه`
      : `${amount.toLocaleString("en-US")} EGP`;
  }
  return locale === "ar" ? `${amount.toLocaleString("ar-EG")} دولار` : `$${amount}`;
}
