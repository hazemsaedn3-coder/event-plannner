import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "mabrouk-dev-secret-change-me";

function secret(): string {
  const s = process.env.MABROUK_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    console.warn("[mabrouk] MABROUK_SECRET is not set; PIN cookies use an insecure default.");
  }
  return s || DEV_SECRET;
}

/** Constant-time string comparison (hashes first so lengths never leak). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function pinCookieName(slug: string): string {
  return `mbk_pin_${slug}`;
}

/** Cookie value proving the PIN was entered. Changing the PIN invalidates old cookies. */
export function pinToken(slug: string, pin: string): string {
  return createHmac("sha256", secret()).update(`${slug}:${pin}`).digest("base64url");
}
