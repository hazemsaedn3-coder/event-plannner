import { json } from "@/lib/api";
import { authorizeHost, rsvpsToCsv } from "@/lib/host";
import { getStorage } from "@/storage";

/** GET /api/host/[slug]/rsvps?key=… — CSV export of all replies. */
export async function GET(req: Request, ctx: RouteContext<"/api/host/[slug]/rsvps">) {
  const { slug } = await ctx.params;
  const inv = authorizeHost(slug, new URL(req.url).searchParams.get("key"));
  if (!inv) return json({ error: "not_found" }, 404);

  const rsvps = await getStorage().listRsvps(inv.slug);
  return new Response(rsvpsToCsv(inv, rsvps), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rsvps-${inv.slug}.csv"`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
