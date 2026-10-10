import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { absoluteUrl } from "@/config/site";
import type { InvitationView } from "@/lib/view";
import { resolveNoor } from "./content";
import { CATALOG_TAG, getMediaIndex, getPreviewLink, getPublishedTemplate, resolveTracks, type TrackInfo } from "./read";
import { buildHtmlDocument, buildNoorView } from "./render";
import type { DuoConfig, LinkOverrides, ShowcaseTemplate } from "./types";

export interface DemoPayload {
  template: Pick<ShowcaseTemplate, "id" | "kind" | "name" | "ctaText" | "colors">;
  locale: "ar" | "en";
  /** "demo": catalog demo / client preview (order button). "live": a client's real invitation. */
  mode: "demo" | "live";
  noorView?: InvitationView;
  /** Two-entrance template: per-side texts and songs. */
  duo?: DuoConfig;
  htmlDoc?: string;
  tracks: TrackInfo[];
  shareUrl: string;
  /** Online order form for this design (demo mode). */
  orderUrl: string;
  clientName?: string;
}

export function buildDemoPayload(
  t: ShowcaseTemplate,
  media: Parameters<typeof resolveTracks>[1],
  opts: {
    path: string;
    overrides?: LinkOverrides;
    clientName?: string;
    now?: Date;
    live?: { slug: string; hostKey: string };
  },
): DemoPayload {
  const locale = t.kind === "html" ? "en" : t.noor!.defaultLocale;
  const shareUrl = absoluteUrl(opts.path);
  const musicOn = t.kind === "html" || resolveNoor(t.noor!).features.music;
  return {
    template: { id: t.id, kind: t.kind, name: t.name, ctaText: t.ctaText, colors: t.colors },
    locale,
    mode: opts.live ? "live" : "demo",
    noorView:
      t.kind === "html" ? undefined : buildNoorView(t, { overrides: opts.overrides, now: opts.now, live: opts.live, shareUrl }),
    duo: t.kind === "duo" ? t.duo : undefined,
    htmlDoc: t.kind === "html" ? buildHtmlDocument(t, opts.overrides) : undefined,
    tracks: musicOn ? resolveTracks(t, media) : [],
    shareUrl,
    orderUrl: `${locale === "ar" ? "" : "/en"}/order?template=${encodeURIComponent(t.id)}`,
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
