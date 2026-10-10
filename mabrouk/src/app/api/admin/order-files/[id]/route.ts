import { isAdmin } from "@/lib/admin-auth";
import { getOrderStore } from "@/orders/store";

/** GET /api/admin/order-files/<id> — a customer's photo, admins only (never cached publicly). */
export async function GET(req: Request, ctx: RouteContext<"/api/admin/order-files/[id]">) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{6,40}$/.test(id)) return new Response("Not found", { status: 404 });
  const found = await getOrderStore()
    .getFile(id)
    .catch(() => null);
  if (!found) return new Response("Not found", { status: 404 });
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(found.data), {
    headers: {
      "Content-Type": found.meta.mime,
      "Content-Length": String(found.data.length),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; sandbox",
      ...(download ? { "Content-Disposition": `attachment; filename="${encodeURIComponent(found.meta.name)}"` } : {}),
    },
  });
}
