import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/en/order",
          "/hi/order",
          "/mr/order",
        ],
      },
    ],
    sitemap: `${getSiteOrigin()}/sitemap.xml`,
    host: getSiteOrigin(),
  };
}
