import { getCatalogStore } from "@/catalog/store";

/**
 * GET /media/<id> — uploaded audio and images.
 * Ids are random and files are never edited in place, so responses are
 * cached "forever" by browsers and the CDN. Supports Range requests
 * (Safari won't play audio without them).
 */
export async function GET(req: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{6,40}$/.test(id)) return new Response("Not found", { status: 404 });

  const found = await getCatalogStore()
    .getMedia(id)
    .catch(() => null);
  if (!found) return new Response("Not found", { status: 404 });

  const { meta, data } = found;
  const headers: Record<string, string> = {
    "Content-Type": meta.mime,
    "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    // Uploaded SVGs must never run scripts on this origin.
    "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
  };

  const range = req.headers.get("range");
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] || m[2])) {
    const size = data.length;
    let start = m[1] ? Number(m[1]) : size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) {
      return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    }
    return new Response(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Length": String(data.length) } });
}
