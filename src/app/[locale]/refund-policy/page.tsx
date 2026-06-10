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
  const routePath = `/${locale}/refund-policy`;
  const [page, brand] = await Promise.all([
    loadResolvedContentPage("refund-policy", locale, routePath),
    getBrandSettings().catch(() => null),
  ]);
  if (!page) return {};

  return buildContentPageMetadata(page, { locale, routePath, siteName: brand?.siteName });
}

export default async function RefundPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await loadResolvedContentPage("refund-policy", locale, `/${locale}/refund-policy`);

  if (page) {
    return <CmsPage page={page} />;
  }

  return <ContentUnavailable />;
}
