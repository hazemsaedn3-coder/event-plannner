import { accessibleInvitation, json } from "@/lib/api";
import { getGuest } from "@/lib/invitations";
import { getStorage } from "@/storage";

/** POST /api/view — counts envelope opens for the host dashboard. Sent via sendBeacon. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const inv = await accessibleInvitation(body.slug);
  if (!inv) return json({ error: "not_found" }, 404);
  if (inv.isDemo) return json({ ok: true });

  const guestCode = typeof body.guestCode === "string" && getGuest(inv, body.guestCode) ? body.guestCode : undefined;
  try {
    await getStorage().recordView({
      invitationSlug: inv.slug,
      guestCode,
      kind: "open",
      locale: body.locale === "en" ? "en" : "ar",
    });
  } catch (err) {
    console.error("[view] record failed", err);
  }
  return json({ ok: true });
}
