import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/catalog/read";
import { getCatalogStore } from "@/catalog/store";
import { MAX_UPLOAD_BYTES } from "@/catalog/types";
import { json } from "@/lib/api";
import { isAdmin } from "@/lib/admin-auth";

/** POST /api/admin/media/<id>/append (multipart: file) — the next piece of a large upload. */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/media/[id]/append">) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{6,40}$/.test(id)) return json({ error: "not_found" }, 404);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return json({ error: "Missing piece" }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: "Pieces must be 4 MB or smaller" }, 400);

  try {
    await getCatalogStore().appendMedia(id, Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error("[media] append failed", err);
    return json({ error: "Upload failed, please try again" }, 500);
  }
  if (form?.get("last") === "1") revalidateTag(CATALOG_TAG, { expire: 0 });
  return json({ ok: true });
}
