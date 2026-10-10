import { getPublishedTemplate } from "@/catalog/read";
import { json, sameOrigin } from "@/lib/api";
import { getOrderStore, hashIp, newOrderId, newOrderRef, RateLimitError } from "@/orders/store";
import { orderInputSchema, type Order } from "@/orders/types";

/**
 * POST /api/orders — the public order form.
 * Validated with zod, rate limited per client (5/hour), honeypot-protected.
 * Returns the confirmation id (unguessable) and the human reference.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 64 * 1024) return json({ error: "too_large" }, 413);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const parsed = orderInputSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json({ error: "invalid", field: issue?.path.join("."), message: issue?.message }, 400);
  }
  const input = parsed.data;
  // Honeypot: pretend success so bots don't retry.
  if (input.website) return json({ ok: true, id: "thanks", ref: "MBK-000000" });

  const template = await getPublishedTemplate(input.templateId);
  if (!template) return json({ error: "invalid", field: "templateId" }, 400);

  const now = new Date().toISOString();
  const { website: _hp, fileIds, ...rest } = input;
  void _hp;
  const order: Order = {
    ...rest,
    id: newOrderId(),
    ref: newOrderRef(),
    status: "new",
    templateName: template.name,
    files: [],
    whatsappVerified: false,
    adminNotes: "",
    history: [{ at: now, by: "customer", status: "new", note: "Order submitted online" }],
    createdAt: now,
    updatedAt: now,
  };

  const store = getOrderStore();
  try {
    await store.create(order, hashIp(req), fileIds);
    if (fileIds.length) {
      const files = await store.listFiles(order.id);
      if (files.length) await store.save({ ...order, files });
    }
  } catch (err) {
    if (err instanceof RateLimitError) return json({ error: "rate_limited" }, 429);
    console.error("[orders] create failed", err);
    return json({ error: "storage_error" }, 500);
  }
  return json({ ok: true, id: order.id, ref: order.ref });
}
