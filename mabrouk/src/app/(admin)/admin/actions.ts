"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { blankTemplate, slugify } from "@/catalog/import";
import { CATALOG_TAG } from "@/catalog/read";
import { getCatalogStore, newId } from "@/catalog/store";
import { linkOverridesSchema, templateIdSchema, templateSchema, type PreviewLink, type ShowcaseTemplate } from "@/catalog/types";
import { requireAdmin } from "@/lib/admin-auth";
import { ADMIN_COOKIE, ADMIN_SESSION_HOURS, checkCredentials, createSessionToken } from "@/lib/admin-session";

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export async function login(
  _prev: { error?: string; username?: string } | undefined,
  form: FormData,
): Promise<{ error?: string; username?: string }> {
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!checkCredentials(username, password)) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 700));
    // Echo the username back so the form keeps it after React resets the inputs.
    return { error: "Wrong username or password", username };
  }
  (await cookies()).set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_HOURS * 3600,
  });
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export async function createTemplate(kind: "noor" | "html" | "duo" | "layali") {
  await requireAdmin();
  const t = blankTemplate(kind, `${kind === "html" ? "design" : kind === "duo" ? "farah" : kind}-${newId(3)}`);
  await getCatalogStore().saveTemplate(t);
  updateTag(CATALOG_TAG);
  redirect(`/admin/templates/${t.id}`);
}

export type SaveResult = { ok: true; id: string; updatedAt: string } | { ok: false; error: string };

/** Saves an edited template. `originalId` lets the admin rename the URL id. */
export async function saveTemplate(originalId: string, data: ShowcaseTemplate): Promise<SaveResult> {
  await requireAdmin();
  const parsed = templateSchema.safeParse({ ...data, updatedAt: new Date().toISOString() });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(".") || "template"}: ${issue.message}` };
  }
  const t = parsed.data;
  if (t.kind !== "html" && !t.noor) return { ok: false, error: "Missing invitation content" };
  if (t.kind === "duo" && !t.duo) return { ok: false, error: "Missing bride/groom sides" };
  if (t.kind === "layali" && !t.layali) return { ok: false, error: "Missing cinematic look" };
  if (t.kind === "html" && !t.html) return { ok: false, error: "Missing HTML content" };

  const store = getCatalogStore();
  if (t.id !== originalId) {
    if (await store.getTemplate(t.id)) return { ok: false, error: `The id "${t.id}" is already used` };
    await store.saveTemplate(t);
    // Move client links to the new id, then remove the old template.
    for (const link of await store.listLinks(originalId)) await store.saveLink({ ...link, templateId: t.id });
    await store.deleteTemplate(originalId);
  } else {
    await store.saveTemplate(t);
  }
  updateTag(CATALOG_TAG);
  return { ok: true, id: t.id, updatedAt: t.updatedAt };
}

export async function deleteTemplate(id: string) {
  await requireAdmin();
  await getCatalogStore().deleteTemplate(id);
  updateTag(CATALOG_TAG);
  redirect("/admin");
}

export async function duplicateTemplate(id: string) {
  await requireAdmin();
  const store = getCatalogStore();
  const t = await store.getTemplate(id);
  if (!t) redirect("/admin");
  const copy: ShowcaseTemplate = {
    ...structuredClone(t),
    id: `${slugify(t.id).slice(0, 40)}-copy-${newId(2)}`,
    status: "draft",
    name: { ar: `${t.name.ar} (نسخة)`, en: `${t.name.en} (copy)` },
    updatedAt: new Date().toISOString(),
  };
  await store.saveTemplate(copy);
  updateTag(CATALOG_TAG);
  redirect(`/admin/templates/${copy.id}`);
}

export async function setTemplateStatus(id: string, status: "published" | "draft") {
  await requireAdmin();
  const store = getCatalogStore();
  const t = await store.getTemplate(id);
  if (!t) return;
  await store.saveTemplate({ ...t, status, updatedAt: new Date().toISOString() });
  updateTag(CATALOG_TAG);
}

/* ------------------------------------------------------------------ */
/* Client preview links                                                */
/* ------------------------------------------------------------------ */

export async function createLink(
  templateId: string,
  input: { clientName: string; note: string; overrides: unknown },
): Promise<{ ok: true; link: PreviewLink } | { ok: false; error: string }> {
  await requireAdmin();
  if (!templateIdSchema.safeParse(templateId).success) return { ok: false, error: "Bad template id" };
  const overrides = linkOverridesSchema.safeParse(input.overrides);
  if (!overrides.success) return { ok: false, error: overrides.error.issues[0]?.message ?? "Invalid overrides" };
  const link: PreviewLink = {
    token: newId(9),
    templateId,
    clientName: String(input.clientName ?? "").slice(0, 80),
    note: String(input.note ?? "").slice(0, 300),
    overrides: overrides.data,
    createdAt: new Date().toISOString(),
  };
  await getCatalogStore().saveLink(link);
  updateTag(CATALOG_TAG);
  return { ok: true, link };
}

export async function deleteLink(token: string) {
  await requireAdmin();
  await getCatalogStore().deleteLink(token);
  updateTag(CATALOG_TAG);
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export async function deleteMedia(id: string) {
  await requireAdmin();
  await getCatalogStore().deleteMedia(id);
  updateTag(CATALOG_TAG);
}
