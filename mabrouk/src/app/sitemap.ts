import type { MetadataRoute } from "next";
import { DEFAULT_TEMPLATES } from "@/catalog/defaults";
import { siteConfig } from "@/config/site";

/** Marketing pages, the order form and the public design demos. Invitations are never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${siteConfig.url}${p}`;
  const pair = (ar: string, en: string) => ({ languages: { ar: u(ar), en: u(en) } });
  return [
    { url: u("/"), alternates: pair("/", "/en"), priority: 1 },
    { url: u("/en"), alternates: pair("/", "/en"), priority: 0.9 },
    { url: u("/order"), alternates: pair("/order", "/en/order"), priority: 0.8 },
    { url: u("/en/order"), alternates: pair("/order", "/en/order"), priority: 0.7 },
    ...DEFAULT_TEMPLATES.filter((t) => t.status === "published").map((t) => ({ url: u(`/demo/${t.id}`), priority: 0.6 })),
  ];
}
