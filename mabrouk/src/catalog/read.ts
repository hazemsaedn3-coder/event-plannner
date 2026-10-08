import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_TEMPLATES } from "./defaults";
import { getCatalogStore } from "./store";
import { BUILTIN_TRACK, type MediaMeta, type PreviewLink, type ShowcaseTemplate } from "./types";

/** Every public read is tagged "catalog"; admin writes call updateTag("catalog"). */
export const CATALOG_TAG = "catalog";

export async function getPublishedTemplates(): Promise<ShowcaseTemplate[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);
  try {
    return (await getCatalogStore().listTemplates()).filter((t) => t.status === "published");
  } catch (err) {
    // The landing page must never break: fall back to the built-in designs.
    console.error("[catalog] list failed, using defaults", err);
    return DEFAULT_TEMPLATES;
  }
}

export async function getPublishedTemplate(id: string): Promise<ShowcaseTemplate | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);
  try {
    const t = await getCatalogStore().getTemplate(id);
    return t && t.status === "published" ? t : null;
  } catch (err) {
    console.error("[catalog] get failed", err);
    return DEFAULT_TEMPLATES.find((t) => t.id === id) ?? null;
  }
}

export async function getPreviewLink(token: string): Promise<{ link: PreviewLink; template: ShowcaseTemplate } | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);
  const store = getCatalogStore();
  const link = await store.getLink(token);
  if (!link) return null;
  // Client links work for drafts too: the admin may share a design before publishing it.
  const template = await store.getTemplate(link.templateId);
  return template ? { link, template } : null;
}

export async function getMediaIndex(): Promise<Record<string, MediaMeta>> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);
  try {
    return Object.fromEntries((await getCatalogStore().listMedia()).map((m) => [m.id, m]));
  } catch {
    return {};
  }
}

export interface TrackInfo {
  id: string;
  title: string;
  /** Audio URL; absent for the built-in synthesized music box. */
  src?: string;
}

export function resolveTracks(t: ShowcaseTemplate, media: Record<string, MediaMeta>): TrackInfo[] {
  const tracks: TrackInfo[] = [];
  for (const id of t.music.trackIds) {
    if (id === BUILTIN_TRACK) tracks.push({ id, title: "Mabrouk Music Box" });
    else if (media[id]?.kind === "audio") tracks.push({ id, title: media[id].name, src: `/media/${id}` });
  }
  // Put the default track first.
  const i = tracks.findIndex((x) => x.id === t.music.defaultTrackId);
  if (i > 0) tracks.unshift(...tracks.splice(i, 1));
  return tracks;
}
