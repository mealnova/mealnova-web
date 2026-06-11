import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

export default function nextConfig(phase: string) {
  const config: NextConfig = {
    // Keep dev (.next) and production builds (.next-prod) isolated so a build
    // can run while the dev server is serving — they corrupt each other in a
    // shared directory. (Next 15's dev server is unstable with a custom dev
    // distDir, so dev stays on the default.)
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next" : ".next-prod",
    poweredByHeader: false,
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**.mealnova.com",
        },
        {
          protocol: "https",
          hostname: "mealnova.in",
        },
        {
          protocol: "https",
          hostname: "**.mealnova.in",
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com",
        },
      ],
    },
  };

  return withNextIntl(config);
}
