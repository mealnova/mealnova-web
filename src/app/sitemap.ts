import type { MetadataRoute } from "next";
import { getBlogPosts, getLocations } from "@/lib/api";
import { SEO_ENABLED_LOCALES } from "@/lib/locale-paths";
import { getSiteOrigin } from "@/lib/site-metadata";

const STATIC_ROUTE_SUFFIXES = [
  "",
  "/about",
  "/blog",
  "/careers",
  "/contact",
  "/corporate",
  "/events",
  "/faq",
  "/gallery",
  "/locations",
  "/menu",
  "/menu/daily",
  "/menu/packages",
  "/privacy-policy",
  "/refund-policy",
  "/terms-of-service",
  "/testimonials",
] as const;

function buildUrl(pathname: string) {
  return new URL(pathname, `${getSiteOrigin()}/`).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [locationsResult, postsResult] = await Promise.allSettled([
    getLocations(),
    getBlogPosts(),
  ]);

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of SEO_ENABLED_LOCALES) {
    for (const suffix of STATIC_ROUTE_SUFFIXES) {
      entries.push({
        url: buildUrl(`/${locale}${suffix}`),
        lastModified: now,
        changeFrequency: suffix === "" ? "daily" : "weekly",
        priority: suffix === "" ? 1 : suffix === "/corporate" || suffix === "/events" || suffix === "/menu" ? 0.9 : 0.7,
      });
    }
  }

  if (locationsResult.status === "fulfilled") {
    for (const location of locationsResult.value.data) {
      for (const locale of SEO_ENABLED_LOCALES) {
        entries.push({
          url: buildUrl(`/${locale}/locations/${location.slug}`),
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  }

  if (postsResult.status === "fulfilled") {
    for (const post of postsResult.value.data) {
      const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
      // Guard against malformed CMS dates — an Invalid Date here would crash
      // the whole sitemap export (RangeError in toISOString).
      const lastModified =
        publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : now;
      for (const locale of SEO_ENABLED_LOCALES) {
        entries.push({
          url: buildUrl(`/${locale}/blog/${post.slug}`),
          lastModified,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  return entries;
}
