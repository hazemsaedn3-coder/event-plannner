import { buildDemoPayload } from "@/catalog/demo";
import { getCatalogStore } from "@/catalog/store";
import { templateSchema } from "@/catalog/types";
import { json } from "@/lib/api";
import { isAdmin } from "@/lib/admin-auth";

/** POST /api/admin/preview { template, mode } → the view model of an unsaved design (real-time editor preview). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  const body = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse({ ...(body?.template ?? {}), updatedAt: new Date().toISOString() });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json({ error: `${issue?.path.join(".") || "design"}: ${issue?.message}` }, 400);
  }
  const t = parsed.data;
  if (t.kind !== "html" && !t.noor) return json({ error: "Missing invitation content" }, 400);
  const media = await getCatalogStore()
    .listMedia()
    .catch(() => []);
  const payload = buildDemoPayload(t, Object.fromEntries(media.map((m) => [m.id, m])), { path: `/demo/${t.id}`, now: new Date() });
  // Live invitations preview without the order button (still a demo: RSVPs aren't stored).
  return json({ payload: { ...payload, mode: body?.mode === "live" ? "live" : "demo" } });
}
