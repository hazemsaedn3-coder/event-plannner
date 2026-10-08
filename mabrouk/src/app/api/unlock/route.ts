import { cookies } from "next/headers";
import { json, sameOrigin } from "@/lib/api";
import { getInvitation } from "@/lib/invitations";
import { pinCookieName, pinToken, safeEqual } from "@/lib/security";

/** POST /api/unlock { slug, pin } — sets an httpOnly cookie proving the PIN was entered. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const inv = typeof body.slug === "string" ? getInvitation(body.slug) : null;
  if (!inv?.pin) return json({ error: "not_found" }, 404);

  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  if (!safeEqual(pin, inv.pin)) {
    // Small fixed delay slows down brute-force attempts.
    await new Promise((r) => setTimeout(r, 600));
    return json({ error: "wrong_pin" }, 401);
  }

  (await cookies()).set(pinCookieName(inv.slug), pinToken(inv.slug, inv.pin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 240, // ~8 months: covers the wedding + 6 months
  });
  return json({ ok: true });
}
