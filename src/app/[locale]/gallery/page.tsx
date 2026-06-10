import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/api";
import { cmsGalleryItems } from "@/lib/cms-api";
import { buildRouteMetadata } from "@/lib/site-metadata";
import { safeCmsLoad } from "@/lib/cms-runtime";
import { loadStructuredPageContent, loadStructuredPageSeo } from "@/lib/structured-page-server";
import { GalleryClient, type GalleryPageContent } from "./gallery-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}/gallery`;
  const [brand, seo] = await Promise.all([
    getBrandSettings().catch(() => null),
    loadStructuredPageSeo("gallery", locale, routePath),
  ]);

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: seo?.metaTitle || seo?.title || "Gallery",
    description: seo?.metaDescription || seo?.summary || brand?.tagline,
    modifiedTime: seo?.updatedAt || brand?.updatedAt,
  });
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const routePath = `/${locale}/gallery`;
  const items = await safeCmsLoad("gallery:collection", () => cmsGalleryItems(undefined, routePath), []);
  const initialContent = await loadStructuredPageContent<GalleryPageContent>("gallery", locale, routePath);
  return <GalleryClient initialItems={items} initialContent={initialContent} />;
}
