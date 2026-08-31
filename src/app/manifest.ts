import type { MetadataRoute } from "next";
import { getBrandSettings } from "@/lib/api";
import { getSiteOrigin } from "@/lib/site-metadata";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Brand-driven (CMS) with the resilience fallback chain behind it —
  // getBrandSettings never throws (live → snapshot → defaults).
  const brand = await getBrandSettings();

  return {
    name: brand.siteName,
    short_name: brand.siteName,
    description:
      "Corporate catering services in Pune, office meal programs, cafeteria management, and event catering.",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    background_color: brand.colorSurface,
    theme_color: brand.colorPrimary600,
    categories: ["food", "business"],
    icons: [
      {
        src: `${getSiteOrigin()}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
