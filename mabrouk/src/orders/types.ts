import { z } from "zod";
import type { L10n } from "@/lib/types";

export const ORDER_STATUSES = [
  { id: "new", label: "New", ar: "جديد", tone: "bg-sky-50 text-sky-800 ring-sky-200" },
  { id: "pending_review", label: "Pending review", ar: "قيد المراجعة", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
  { id: "waiting_customer", label: "Waiting for customer", ar: "بانتظار العميل", tone: "bg-orange-50 text-orange-800 ring-orange-200" },
  { id: "approved", label: "Approved", ar: "تمت الموافقة", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  { id: "in_production", label: "In production", ar: "قيد التنفيذ", tone: "bg-violet-50 text-violet-800 ring-violet-200" },
  { id: "completed", label: "Completed", ar: "مكتمل", tone: "bg-stone-100 text-stone-800 ring-stone-300" },
  { id: "cancelled", label: "Cancelled", ar: "ملغي", tone: "bg-rose-50 text-rose-700 ring-rose-200" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["id"];
export const orderStatusIds = ORDER_STATUSES.map((s) => s.id) as [OrderStatus, ...OrderStatus[]];
export const statusInfo = (id: string) => ORDER_STATUSES.find((s) => s.id === id) ?? ORDER_STATUSES[0];

export const EVENT_TYPES = [
  { id: "wedding", ar: "فرح", en: "Wedding" },
  { id: "engagement", ar: "خطوبة", en: "Engagement" },
  { id: "katb-el-kitab", ar: "كتب كتاب", en: "Katb el-Kitab" },
  { id: "henna", ar: "حنة", en: "Henna night" },
  { id: "other", ar: "مناسبة أخرى", en: "Other" },
] as const;

export const MUSIC_CHOICES = [
  { id: "romantic", ar: "رومانسي", en: "Romantic" },
  { id: "shaabi", ar: "شعبي", en: "Shaabi" },
  { id: "classic", ar: "كلاسيك هادي", en: "Soft classic" },
  { id: "custom", ar: "أغنية من اختيارنا", en: "Our own song" },
  { id: "none", ar: "بدون موسيقى", en: "No music" },
] as const;

/** Sections the customer can ask for (subset of the admin feature switches). */
export const ORDER_SECTIONS = [
  { id: "countdown", ar: "عدّ تنازلي", en: "Countdown" },
  { id: "couplePhotos", ar: "صور العروسين", en: "Couple photos" },
  { id: "venueImages", ar: "صور القاعة", en: "Venue photos" },
  { id: "timeline", ar: "برنامج الحفل", en: "Event schedule" },
  { id: "gallery", ar: "معرض صور", en: "Photo gallery" },
  { id: "rsvp", ar: "تأكيد الحضور", en: "RSVP" },
  { id: "gifts", ar: "معلومات الهدايا", en: "Gift details" },
  { id: "music", ar: "موسيقى", en: "Music" },
] as const;

const digits = (s: string) => s.replace(/[^\d]/g, "");
const text = (max: number) => z.string().trim().max(max);

/** What the public order form sends (validated on the server). */
export const orderInputSchema = z.object({
  templateId: z.string().regex(/^[a-z0-9-]{2,60}$/),
  groomName: text(80).min(2),
  brideName: text(80).min(2),
  whatsapp: z
    .string()
    .transform(digits)
    .pipe(z.string().min(8, "invalid_phone").max(15, "invalid_phone")),
  email: z.union([z.literal(""), z.string().trim().email().max(120)]),
  event: z.object({
    type: z.enum(["wedding", "engagement", "katb-el-kitab", "henna", "other"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/)]),
    city: text(80),
    venueName: text(120),
    venueAddress: text(200),
    mapsUrl: z.union([z.literal(""), z.string().trim().url().max(500).refine((u) => /^https:\/\//.test(u), "https only")]),
    guests: z.union([z.literal(""), z.coerce.number().int().min(1).max(5000)]),
  }),
  preferences: z.object({
    language: z.enum(["ar", "en", "both"]),
    music: z.enum(["romantic", "shaabi", "classic", "custom", "none"]),
    sections: z.array(z.enum(["countdown", "couplePhotos", "venueImages", "timeline", "gallery", "rsvp", "gifts", "music"])).max(8),
    colors: text(300),
    wording: text(1000),
  }),
  notes: text(2000),
  fileIds: z.array(z.string().regex(/^[a-z0-9]{6,40}$/)).max(16),
  locale: z.enum(["ar", "en"]),
  /** Honeypot: real people leave it empty. */
  website: z.string().max(200).optional(),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

export interface OrderFile {
  id: string;
  orderId?: string | null;
  kind: "couple" | "venue" | "other";
  name: string;
  mime: string;
  size: number;
  createdAt: string;
}

export interface OrderEvent {
  at: string;
  by: "customer" | "admin";
  status?: OrderStatus;
  note?: string;
}

export interface Order extends Omit<OrderInput, "website" | "fileIds"> {
  id: string;
  ref: string;
  status: OrderStatus;
  templateName: L10n;
  files: OrderFile[];
  whatsappVerified: boolean;
  verifiedAt?: string;
  adminNotes: string;
  /** Production invitation made for this order. */
  invitationSlug?: string;
  history: OrderEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderList {
  items: Order[];
  total: number;
  counts: Partial<Record<OrderStatus, number>>;
}

export const MAX_ORDER_FILES = 16;
export const MAX_ORDER_FILE_BYTES = 4 * 1024 * 1024;
