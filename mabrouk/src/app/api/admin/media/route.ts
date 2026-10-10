import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/catalog/read";
import { getCatalogStore, newId } from "@/catalog/store";
import { AUDIO_TYPES, IMAGE_TYPES, MAX_MEDIA_BYTES, MAX_UPLOAD_BYTES, type MediaMeta } from "@/catalog/types";
import { json } from "@/lib/api";
import { isAdmin } from "@/lib/admin-auth";

/**
 * POST /api/admin/media (multipart: file, name?, total?) — upload a music
 * track or an image. Files over 4 MB are sent in pieces: this request
 * carries the first piece and `total`, then /api/admin/media/<id>/append
 * receives the rest.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "Choose a file to upload" }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: "Pieces must be 4 MB or smaller" }, 400);
  const total = Number(form?.get("total") || file.size);
  if (!Number.isInteger(total) || total < file.size || total > MAX_MEDIA_BYTES) return json({ error: "Files must be 12 MB or smaller" }, 400);

  const mime = file.type || "application/octet-stream";
  const kind = AUDIO_TYPES.includes(mime) ? "audio" : IMAGE_TYPES.includes(mime) ? "image" : null;
  if (!kind) return json({ error: `Unsupported file type (${mime}). Use MP3/M4A/OGG/WAV or JPG/PNG/WebP/SVG.` }, 400);

  const label = String(form?.get("name") || "").trim() || file.name.replace(/\.[a-z0-9]+$/i, "");
  const meta: MediaMeta = {
    id: newId(),
    kind,
    name: label.slice(0, 80),
    mime: mime === "audio/mp3" ? "audio/mpeg" : mime,
    size: total,
    createdAt: new Date().toISOString(),
  };
  try {
    await getCatalogStore().putMedia(meta, Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error("[media] upload failed", err);
    return json({ error: "Upload failed, please try again" }, 500);
  }
  revalidateTag(CATALOG_TAG, { expire: 0 });
  return json({ ok: true, media: meta, url: `/media/${meta.id}` });
}
