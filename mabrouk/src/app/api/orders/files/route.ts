import { IMAGE_TYPES } from "@/catalog/types";
import { json, sameOrigin } from "@/lib/api";
import { getOrderStore, hashIp, newFileId, RateLimitError } from "@/orders/store";
import { MAX_ORDER_FILE_BYTES, type OrderFile } from "@/orders/types";

/**
 * POST /api/orders/files (multipart: file, kind) — a photo for an order that
 * is still being filled in. Images only (no SVG), ≤ 4 MB, 30 per client per
 * hour. Files stay private: only the admin panel can read them.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "no_file" }, 400);
  if (file.size > MAX_ORDER_FILE_BYTES) return json({ error: "too_large" }, 413);
  const mime = file.type;
  if (!IMAGE_TYPES.includes(mime) || mime === "image/svg+xml") return json({ error: "unsupported_type" }, 415);

  const data = Buffer.from(await file.arrayBuffer());
  // Check the bytes really are an image (JPEG, PNG, WebP, GIF, AVIF).
  const sig = data.subarray(0, 12).toString("hex");
  const looksLikeImage =
    sig.startsWith("ffd8ff") || sig.startsWith("89504e47") || sig.startsWith("47494638") || (sig.startsWith("52494646") && data.subarray(8, 12).toString() === "WEBP") || data.subarray(4, 12).toString().startsWith("ftypavi");
  if (!looksLikeImage) return json({ error: "unsupported_type" }, 415);

  const kindRaw = String(form?.get("kind") ?? "other");
  const meta: OrderFile = {
    id: newFileId(),
    kind: kindRaw === "couple" || kindRaw === "venue" ? kindRaw : "other",
    name: (file.name || "photo").replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 80) || "photo",
    mime,
    size: file.size,
    createdAt: new Date().toISOString(),
  };
  try {
    await getOrderStore().putFile(meta, data, hashIp(req));
  } catch (err) {
    if (err instanceof RateLimitError) return json({ error: "rate_limited" }, 429);
    console.error("[orders] file upload failed", err);
    return json({ error: "storage_error" }, 500);
  }
  return json({ ok: true, file: meta });
}
