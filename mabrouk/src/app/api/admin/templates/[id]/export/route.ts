import { getCatalogStore } from "@/catalog/store";
import { json } from "@/lib/api";
import { isAdmin } from "@/lib/admin-auth";

/** GET /api/admin/templates/<id>/export — download a template as JSON (re-importable). */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/templates/[id]/export">) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  const t = await getCatalogStore().getTemplate(id);
  if (!t) return json({ error: "not_found" }, 404);
  return new Response(JSON.stringify({ format: "mabrouk-template", version: 1, template: t }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${t.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
