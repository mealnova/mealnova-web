import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/api";
import { cmsCareerOpenings } from "@/lib/cms-api";
import { buildRouteMetadata } from "@/lib/site-metadata";
import { safeCmsLoad } from "@/lib/cms-runtime";
import { loadStructuredPageContent, loadStructuredPageSeo } from "@/lib/structured-page-server";
import { CareersClient, type CareersPageContent } from "./careers-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}/careers`;
  const [brand, seo] = await Promise.all([
    getBrandSettings().catch(() => null),
    loadStructuredPageSeo("careers", locale, routePath),
  ]);

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: seo?.metaTitle || seo?.title || "Careers",
    description: seo?.metaDescription || seo?.summary || brand?.tagline,
    modifiedTime: seo?.updatedAt || brand?.updatedAt,
  });
}

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const routePath = `/${locale}/careers`;
  const openings = await safeCmsLoad("careers:collection", () => cmsCareerOpenings(routePath), []);
  const initialContent = await loadStructuredPageContent<CareersPageContent>("careers", locale, routePath);
  return <CareersClient initialOpenings={openings} initialContent={initialContent} />;
}
