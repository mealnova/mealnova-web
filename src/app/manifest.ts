import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mealnova",
    short_name: "Mealnova",
    description:
      "Corporate catering services in Pune, office meal programs, cafeteria management, and vegetarian event catering.",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1e293b",
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
