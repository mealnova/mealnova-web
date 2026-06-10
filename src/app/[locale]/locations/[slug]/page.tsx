import type { Metadata } from "next";
import { getBrandSettings, getLocation } from "@/lib/api";
import { buildRouteMetadata } from "@/lib/site-metadata";
import { LocationDetailPage } from "./location-detail-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const routePath = `/${locale}/locations/${slug}`;
  const [brand, location] = await Promise.all([
    getBrandSettings().catch(() => null),
    getLocation(slug),
  ]);

  if (!location) return {};

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: `${location.name}, ${location.city}`,
    description: `${location.type.replaceAll("_", " ")} location in ${location.city} with up to ${location.dailyCapacity}+ meals per day.`,
    modifiedTime: brand?.updatedAt,
  });
}

export default async function LocationDetailRoute({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  return <LocationDetailPage slug={slug} />;
}
