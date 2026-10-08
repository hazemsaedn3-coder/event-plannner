/**
 * Admin session token: "<expiresAtMs>.<hmac>" signed with MABROUK_SECRET.
 * Uses Web Crypto only, so it runs both in the proxy and in route code.
 */

export const ADMIN_COOKIE = "mbk_admin";
export const ADMIN_SESSION_HOURS = 24 * 7;

const DEV_SECRET = "mabrouk-dev-secret-change-me";

function secret(): string {
  return process.env.MABROUK_SECRET || DEV_SECRET;
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`admin:${message}`));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Length-safe constant-time comparison of two strings. */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const exp = String(now + ADMIN_SESSION_HOURS * 3600_000);
  return `${exp}.${await hmac(exp)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  return timingSafeEqualStr(sig, await hmac(exp));
}

/** Static credentials from the brief; override with ADMIN_USERNAME / ADMIN_PASSWORD. */
export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME || "tahahazem";
  const p = process.env.ADMIN_PASSWORD || "hazemtaha";
  // Evaluate both comparisons so timing doesn't reveal which one failed.
  const okU = timingSafeEqualStr(username, u);
  const okP = timingSafeEqualStr(password, p);
  return okU && okP;
}
