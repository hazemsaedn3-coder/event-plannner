import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Only the marketing pages. Invitations are never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteConfig.url}/`, alternates: { languages: { ar: `${siteConfig.url}/`, en: `${siteConfig.url}/en` } } },
    { url: `${siteConfig.url}/en`, alternates: { languages: { ar: `${siteConfig.url}/`, en: `${siteConfig.url}/en` } } },
  ];
}
