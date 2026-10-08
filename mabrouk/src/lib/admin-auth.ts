import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "./admin-session";

/** For admin pages and server actions: redirect to login without a valid session. */
export async function requireAdmin(): Promise<void> {
  // Session checks read the clock, so they must run at request time.
  await connection();
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) redirect("/admin/login");
}

/** For admin route handlers: true when the request carries a valid session. */
export async function isAdmin(): Promise<boolean> {
  await connection();
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}
