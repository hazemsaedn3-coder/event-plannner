import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/en", "/demo/"], disallow: ["/i/", "/host/", "/api/", "/admin", "/p/"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
