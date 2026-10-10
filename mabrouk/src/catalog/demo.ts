import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { absoluteUrl, siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/links";
import type { InvitationView } from "@/lib/view";
import { CATALOG_TAG, getMediaIndex, getPreviewLink, getPublishedTemplate, resolveTracks, type TrackInfo } from "./read";
import { buildHtmlDocument, buildNoorDemoView } from "./render";
import type { DuoConfig, LinkOverrides, ShowcaseTemplate } from "./types";

export interface DemoPayload {
  template: Pick<ShowcaseTemplate, "id" | "kind" | "name" | "ctaText" | "colors">;
  locale: "ar" | "en";
  noorView?: InvitationView;
  /** Two-entrance template: per-side texts and songs. */
  duo?: DuoConfig;
  htmlDoc?: string;
  tracks: TrackInfo[];
  shareUrl: string;
  orderUrl: string;
  clientName?: string;
}

export function orderMessage(name: string, locale: "ar" | "en", url: string) {
  return locale === "ar"
    ? `مرحباً مبروك 👋\nأريد هذا التصميم: «${name}»\n${url}`
    : `Hi Mabrouk 👋\nI'd like this design: “${name}”\n${url}`;
}

export function buildDemoPayload(
  t: ShowcaseTemplate,
  media: Parameters<typeof resolveTracks>[1],
  opts: { path: string; overrides?: LinkOverrides; clientName?: string; now?: Date },
): DemoPayload {
  const locale = t.kind === "html" ? "en" : t.noor!.defaultLocale;
  const shareUrl = absoluteUrl(opts.path);
  return {
    template: { id: t.id, kind: t.kind, name: t.name, ctaText: t.ctaText, colors: t.colors },
    locale,
    noorView: t.kind === "html" ? undefined : buildNoorDemoView(t, opts.overrides, opts.now),
    duo: t.kind === "duo" ? t.duo : undefined,
    htmlDoc: t.kind === "html" ? buildHtmlDocument(t, opts.overrides) : undefined,
    tracks: resolveTracks(t, media),
    shareUrl,
    orderUrl: whatsappUrl(orderMessage(t.name[locale], locale, shareUrl), siteConfig.whatsappNumber),
    clientName: opts.clientName,
  };
}

/** Public demo: /demo/<id>. Cached; refreshed when the admin saves. */
export async function getDemoPayload(id: string): Promise<DemoPayload | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);
  const t = await getPublishedTemplate(id);
  if (!t) return null;
  return buildDemoPayload(t, await getMediaIndex(), { path: `/demo/${t.id}`, now: new Date() });
}

/** Personalised client preview: /p/<token>. */
export async function getLinkPayload(token: string): Promise<DemoPayload | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);
  const found = await getPreviewLink(token).catch(() => null);
  if (!found) return null;
  return buildDemoPayload(found.template, await getMediaIndex(), {
    path: `/p/${token}`,
    overrides: found.link.overrides,
    clientName: found.link.clientName || undefined,
    now: new Date(),
  });
}
