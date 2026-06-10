import type { Metadata } from "next";
import { CmsPage } from "@/components/site/cms-page";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { getBrandSettings } from "@/lib/api";
import { buildContentPageMetadata, loadResolvedContentPage } from "@/lib/content-pages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}/about`;
  const [page, brand] = await Promise.all([
    loadResolvedContentPage("about", locale, routePath),
    getBrandSettings().catch(() => null),
  ]);
  if (!page) return {};

  return buildContentPageMetadata(page, { locale, routePath, siteName: brand?.siteName });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await loadResolvedContentPage("about", locale, `/${locale}/about`);

  if (page) {
    return <CmsPage page={page} variant="story" />;
  }

  return <ContentUnavailable />;
}
