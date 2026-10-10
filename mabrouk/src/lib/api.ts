import "server-only";
import { cookies } from "next/headers";
import { liveContent } from "@/live/read";
import { getInvitation } from "./invitations";
import { pinCookieName, pinToken, safeEqual } from "./security";
import type { InvitationContent } from "./types";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Reject cross-site form posts (light CSRF guard; browsers always send Origin on POST). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host || origin === process.env.NEXT_PUBLIC_SITE_URL;
  } catch {
    return false;
  }
}

/** Live invitation the caller may access (PIN cookie checked for private invitations). */
export async function accessibleInvitation(slug: unknown): Promise<InvitationContent | null> {
  if (typeof slug !== "string" || slug.length > 100) return null;
  const inv = getInvitation(slug);
  // Not a hand-written invitation: try the production invitations made in the admin.
  if (!inv) return liveContent(slug);
  if (inv.pin) {
    const token = (await cookies()).get(pinCookieName(slug))?.value ?? "";
    if (!safeEqual(token, pinToken(slug, inv.pin))) return null;
  }
  return inv;
}

export function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, max) : "";
}
