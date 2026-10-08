import { accessibleInvitation, cleanText, json, sameOrigin } from "@/lib/api";
import { getGuest } from "@/lib/invitations";
import type { Locale } from "@/lib/types";
import { getStorage } from "@/storage";

/**
 * POST /api/rsvp
 * { slug, guestCode?, name?, attending, headcount, message?, locale }
 *
 * Personal links: the name comes from the guest list and headcount is capped
 * by the guest's seats. General link: name required, capped by
 * rsvp.maxHeadcountGeneral.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // Honeypot: pretend success so bots don't retry.
  if (cleanText(body.website, 100)) return json({ ok: true });

  const inv = await accessibleInvitation(body.slug);
  if (!inv) return json({ error: "not_found" }, 404);
  if (!inv.rsvp.enabled) return json({ error: "rsvp_disabled" }, 400);
  if (inv.rsvp.deadline && new Date() > new Date(inv.rsvp.deadline)) return json({ error: "rsvp_closed" }, 400);

  const guestCode = typeof body.guestCode === "string" && body.guestCode ? body.guestCode : undefined;
  const guest = guestCode ? getGuest(inv, guestCode) : null;
  if (guestCode && !guest) return json({ error: "unknown_guest" }, 404);

  if (typeof body.attending !== "boolean") return json({ error: "attending_required" }, 400);
  const attending = body.attending;

  const max = guest ? guest.seats : inv.rsvp.maxHeadcountGeneral;
  const headcount = attending ? Number(body.headcount) : 0;
  if (attending && (!Number.isInteger(headcount) || headcount < 1 || headcount > max)) {
    return json({ error: "headcount_out_of_range", max }, 400);
  }

  const name = guest ? guest.displayName.ar : cleanText(body.name, 80);
  if (!name) return json({ error: "name_required" }, 400);

  const locale: Locale = body.locale === "en" ? "en" : "ar";
  const message = cleanText(body.message, 500) || undefined;

  // Demo invitations behave normally for the visitor but store nothing.
  if (inv.isDemo) return json({ ok: true, demo: true });

  try {
    await getStorage().saveRsvp({
      invitationSlug: inv.slug,
      guestCode: guest?.code,
      name,
      attending,
      headcount,
      message,
      locale,
    });
  } catch (err) {
    console.error("[rsvp] save failed", err);
    return json({ error: "storage_error" }, 500);
  }
  return json({ ok: true });
}
