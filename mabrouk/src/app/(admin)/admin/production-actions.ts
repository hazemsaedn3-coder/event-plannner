"use server";

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { resolveNoor } from "@/catalog/content";
import { slugify } from "@/catalog/import";
import { CATALOG_TAG } from "@/catalog/read";
import { getCatalogStore, newId } from "@/catalog/store";
import { templateSchema, type MediaMeta, type ShowcaseTemplate } from "@/catalog/types";
import { requireAdmin } from "@/lib/admin-auth";
import { computeWindow, contentOf, LIVE_TAG, liveTag } from "@/live/read";
import { getLiveStore } from "@/live/store";
import { SLUG_RE, validitySchema, type LiveInvitation, type Validity } from "@/live/types";
import { getOrderStore } from "@/orders/store";
import { orderStatusIds, type Order, type OrderStatus } from "@/orders/types";
import { getStorage } from "@/storage";

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

async function loadOrder(id: string): Promise<Order> {
  const order = await getOrderStore().get(id);
  if (!order) throw new Error("Order not found");
  return order;
}

export async function updateOrder(
  id: string,
  patch: { status?: OrderStatus; note?: string; whatsappVerified?: boolean; adminNotes?: string },
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  await requireAdmin();
  if (patch.status && !orderStatusIds.includes(patch.status)) return { ok: false, error: "Unknown status" };
  const order = await loadOrder(id);
  const now = new Date().toISOString();
  const note = patch.note?.trim().slice(0, 500);
  const next: Order = {
    ...order,
    status: patch.status ?? order.status,
    whatsappVerified: patch.whatsappVerified ?? order.whatsappVerified,
    verifiedAt: patch.whatsappVerified ? now : patch.whatsappVerified === false ? undefined : order.verifiedAt,
    adminNotes: patch.adminNotes !== undefined ? patch.adminNotes.slice(0, 4000) : order.adminNotes,
    updatedAt: now,
  };
  const changedStatus = patch.status && patch.status !== order.status;
  if (changedStatus || note || patch.whatsappVerified !== undefined) {
    next.history = [
      ...order.history,
      {
        at: now,
        by: "admin",
        ...(changedStatus ? { status: patch.status } : {}),
        note: note || (patch.whatsappVerified !== undefined ? (patch.whatsappVerified ? "WhatsApp number verified" : "WhatsApp verification removed") : undefined),
      },
    ];
  }
  await getOrderStore().save(next);
  return { ok: true, order: next };
}

/** Copies a customer's private upload into the media library so it can be used in a design. */
async function promoteOrderFile(fileId: string): Promise<string | null> {
  const found = await getOrderStore()
    .getFile(fileId)
    .catch(() => null);
  if (!found) return null;
  const meta: MediaMeta = {
    id: newId(),
    kind: "image",
    name: `Order photo · ${found.meta.name}`.slice(0, 80),
    mime: found.meta.mime,
    size: found.data.length,
    createdAt: new Date().toISOString(),
  };
  await getCatalogStore().putMedia(meta, found.data);
  return `/media/${meta.id}`;
}

export async function addOrderPhotoToLibrary(fileId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const url = await promoteOrderFile(fileId);
  updateTag(CATALOG_TAG);
  return url ? { ok: true, url } : { ok: false, error: "Photo not found" };
}

/* ------------------------------------------------------------------ */
/* Production invitations                                              */
/* ------------------------------------------------------------------ */

const latin = (s: string) => (/^[\x20-\x7E]+$/.test(s.trim()) ? s.trim() : "");

async function uniqueSlug(base: string): Promise<string> {
  const store = getLiveStore();
  const root = slugify(base).slice(0, 40) || "farah";
  for (let i = 0; i < 5; i++) {
    // A random tail keeps links unguessable even when names are known.
    const slug = `${root}-${randomBytes(3).toString("hex")}`;
    if (!(await store.get(slug))) return slug;
  }
  return `${root}-${newId(6)}`;
}

function blankInvitation(template: ShowcaseTemplate, slug: string): LiveInvitation {
  const now = new Date().toISOString();
  const t: ShowcaseTemplate = {
    ...structuredClone(template),
    noor: template.noor ? resolveNoor(template.noor) : undefined,
    updatedAt: now,
  };
  const validity: Validity = { mode: "event", graceDays: 0 };
  return {
    slug,
    status: "inactive",
    templateId: template.id,
    template: t,
    clientName: "",
    clientPhone: "",
    validity,
    ...computeWindow(validity, t),
    hostKey: randomBytes(18).toString("base64url"),
    createdAt: now,
    updatedAt: now,
  };
}

async function persist(inv: LiveInvitation) {
  await getLiveStore().save(inv);
  // Mirror into the RSVP tables so replies and opens can be stored against it.
  try {
    await getStorage().syncInvitation(contentOf(inv));
  } catch (err) {
    console.error("[live] mirror for RSVPs failed", err);
  }
  updateTag(LIVE_TAG);
  updateTag(liveTag(inv.slug));
}

export async function createInvitation(templateId: string, orderId?: string) {
  await requireAdmin();
  const template = await getCatalogStore().getTemplate(templateId);
  if (!template) throw new Error("Design not found");
  const order = orderId ? await getOrderStore().get(orderId) : null;
  const slug = await uniqueSlug(order ? `${latin(order.groomName) || "farah"}-${latin(order.brideName)}` : template.id);
  const inv = blankInvitation(template, slug);
  if (order) await applyOrder(inv, order);
  await persist(inv);
  if (order) {
    await getOrderStore().save({
      ...order,
      invitationSlug: slug,
      status: order.status === "new" || order.status === "pending_review" || order.status === "approved" ? "in_production" : order.status,
      history: [...order.history, { at: new Date().toISOString(), by: "admin", status: "in_production", note: `Invitation /i/${slug} created` }],
      updatedAt: new Date().toISOString(),
    });
  }
  redirect(`/admin/invitations/${slug}`);
}

/** Pre-fills a new invitation from a customer's order (names, date, venue, wishes, photos). */
async function applyOrder(inv: LiveInvitation, order: Order) {
  const n = inv.template.noor;
  inv.orderId = order.id;
  inv.clientName = `${order.groomName} & ${order.brideName}`;
  inv.clientPhone = order.whatsapp;
  if (!n) return;
  const both = (s: string) => ({ ar: s, en: s });
  n.partner1 = both(order.groomName);
  n.partner2 = both(order.brideName);
  n.latin1 = latin(order.groomName);
  n.latin2 = latin(order.brideName);
  n.date = `${order.event.date}T${order.event.time || "20:00"}`;
  if (order.event.venueName) n.venueName = both(order.event.venueName);
  n.venueAddress = both([order.event.venueAddress, order.event.city].filter(Boolean).join("، "));
  n.mapsUrl = order.event.mapsUrl;
  n.defaultLocale = order.preferences.language === "en" ? "en" : "ar";
  const wanted = new Set(order.preferences.sections);
  const f = resolveNoor(n).features;
  for (const k of ["countdown", "couplePhotos", "venueImages", "timeline", "gallery", "rsvp", "gifts"] as const) f[k] = wanted.has(k);
  f.music = order.preferences.music !== "none" && wanted.has("music");
  n.features = f;
  const track = { romantic: "builtin:romantic-one", shaabi: "builtin:shaabi-one", classic: "builtin:musicbox" }[order.preferences.music as "romantic" | "shaabi" | "classic"];
  if (track && inv.template.kind !== "duo") inv.template.music = { trackIds: [...new Set([track, ...inv.template.music.trackIds])], defaultTrackId: track };

  // Customer photos → media library → couple / venue sections.
  const files = order.files.length ? order.files : await getOrderStore().listFiles(order.id);
  const couple: string[] = [];
  const venue: string[] = [];
  for (const file of files) {
    const url = await promoteOrderFile(file.id).catch(() => null);
    if (url) (file.kind === "venue" ? venue : couple).push(url);
  }
  const r = resolveNoor(n);
  if (couple.length) n.couple = { ...r.couple, images: couple.slice(0, 12) };
  if (venue.length) n.venueShowcase = { ...r.venueShowcase, images: venue.slice(0, 16) };
  if (couple.length || venue.length) updateTag(CATALOG_TAG);
  const period = computeWindow(inv.validity, inv.template);
  inv.validFrom = period.validFrom;
  inv.validUntil = period.validUntil;
}

export type SaveInvitationInput = {
  template: ShowcaseTemplate;
  clientName: string;
  clientPhone: string;
  validity: Validity;
  status: LiveInvitation["status"];
  slug: string;
};

export async function saveInvitation(
  originalSlug: string,
  input: SaveInvitationInput,
): Promise<{ ok: true; invitation: LiveInvitation } | { ok: false; error: string }> {
  await requireAdmin();
  const store = getLiveStore();
  const existing = await store.get(originalSlug);
  if (!existing) return { ok: false, error: "Invitation not found" };

  const parsed = templateSchema.safeParse({ ...input.template, updatedAt: new Date().toISOString() });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(".") || "design"}: ${issue.message}` };
  }
  const validity = validitySchema.safeParse(input.validity);
  if (!validity.success) return { ok: false, error: "Check the active period dates" };
  if (validity.data.mode === "range" && validity.data.until < validity.data.from) return { ok: false, error: "The end date is before the start date" };

  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug) || slug.length < 3 || slug.length > 80) return { ok: false, error: "Link name: lowercase letters, digits and dashes (3–80)" };
  if (slug !== originalSlug && (await store.get(slug))) return { ok: false, error: `The link /i/${slug} is already used` };

  const template = parsed.data;
  const inv: LiveInvitation = {
    ...existing,
    slug,
    status: input.status === "active" ? "active" : "inactive",
    template,
    clientName: String(input.clientName ?? "").slice(0, 120),
    clientPhone: String(input.clientPhone ?? "").replace(/\D/g, "").slice(0, 15),
    validity: validity.data,
    ...computeWindow(validity.data, template),
    updatedAt: new Date().toISOString(),
  };
  await persist(inv);
  if (slug !== originalSlug) {
    await store.delete(originalSlug);
    updateTag(liveTag(originalSlug));
    if (inv.orderId) {
      const order = await getOrderStore().get(inv.orderId);
      if (order) await getOrderStore().save({ ...order, invitationSlug: slug, updatedAt: new Date().toISOString() });
    }
  }
  return { ok: true, invitation: inv };
}

export async function setInvitationStatus(slug: string, status: "active" | "inactive") {
  await requireAdmin();
  const store = getLiveStore();
  const inv = await store.get(slug);
  if (!inv) return;
  await persist({ ...inv, status, updatedAt: new Date().toISOString() });
}

export async function deleteInvitation(slug: string) {
  await requireAdmin();
  await getLiveStore().delete(slug);
  updateTag(LIVE_TAG);
  updateTag(liveTag(slug));
  redirect("/admin/invitations");
}
