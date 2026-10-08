import { revalidateTag } from "next/cache";
import { fetchForImport, templateFromCode, templateFromJson } from "@/catalog/import";
import { CATALOG_TAG } from "@/catalog/read";
import { getCatalogStore } from "@/catalog/store";
import { json } from "@/lib/api";
import { isAdmin } from "@/lib/admin-auth";

const MAX_FILE = 2 * 1024 * 1024;

/**
 * POST /api/admin/import
 *  - multipart "files": one .json, or .html (+ optional .css / .js)
 *  - multipart "url": an http(s) page or JSON file
 * Creates a draft template and returns its id.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  const form = await req.formData().catch(() => null);
  if (!form) return json({ error: "Nothing to import" }, 400);

  try {
    let template;
    const url = String(form.get("url") ?? "").trim();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

    if (url) {
      const { body, contentType, finalUrl } = await fetchForImport(url);
      const name = new URL(finalUrl).hostname;
      if (contentType.includes("json") || /\.json($|\?)/i.test(finalUrl) || /^\s*[{[]/.test(body)) {
        template = templateFromJson(JSON.parse(body), name);
      } else {
        // Keep relative images/styles working via <base href>.
        template = templateFromCode(name, { html: body, baseUrl: finalUrl });
      }
    } else if (files.length) {
      if (files.some((f) => f.size > MAX_FILE)) return json({ error: "Each file must be 2 MB or smaller" }, 400);
      const byExt = (re: RegExp) => files.find((f) => re.test(f.name));
      const jsonFile = byExt(/\.json$/i);
      if (jsonFile) {
        template = templateFromJson(JSON.parse(await jsonFile.text()), jsonFile.name.replace(/\.json$/i, ""));
      } else {
        const html = byExt(/\.html?$/i);
        if (!html) return json({ error: "Upload a .json file, or an .html file (with optional .css and .js)" }, 400);
        template = templateFromCode(html.name.replace(/\.html?$/i, ""), {
          html: await html.text(),
          css: (await byExt(/\.css$/i)?.text()) ?? "",
          js: (await byExt(/\.js$/i)?.text()) ?? "",
        });
      }
    } else {
      return json({ error: "Add a URL or choose files" }, 400);
    }

    await getCatalogStore().saveTemplate(template);
    revalidateTag(CATALOG_TAG, { expire: 0 });
    return json({ ok: true, id: template.id });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Import failed" }, 400);
  }
}
