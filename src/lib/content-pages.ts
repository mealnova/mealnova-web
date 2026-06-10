import type { Metadata } from "next";
import { getBrandSettings, getPageBySlug, type ContentPage } from "@/lib/api";
import { resolveTemplateValue } from "@/lib/content-templating";
import { logCmsRuntimeIssue } from "@/lib/cms-runtime";
import { buildRouteMetadata } from "@/lib/site-metadata";

export interface ResolvedContentPage {
  raw: ContentPage;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
}

function localizedValue(
  page: ContentPage,
  locale: string,
  kind: "title" | "content",
): string {
  if (locale === "hi") {
    return (kind === "title" ? page.titleHi : page.contentHi) || (kind === "title" ? page.titleEn : page.contentEn);
  }

  if (locale === "mr") {
    return (kind === "title" ? page.titleMr : page.contentMr) || (kind === "title" ? page.titleEn : page.contentEn);
  }

  return kind === "title" ? page.titleEn : page.contentEn;
}

export async function loadResolvedContentPage(
  slug: string,
  locale: string,
  routePath?: string | null,
): Promise<ResolvedContentPage | null> {
  let page: ContentPage | null;
  try {
    page = await getPageBySlug(slug, { routePath });
  } catch (error) {
    logCmsRuntimeIssue(`content-page:${slug}:page`, error);
    return null;
  }

  if (!page) return null;

  let brand: Awaited<ReturnType<typeof getBrandSettings>> | null = null;
  try {
    brand = await getBrandSettings();
  } catch (error) {
    logCmsRuntimeIssue(`content-page:${slug}:brand`, error);
  }

  const context = {
    brand: brand ?? {},
    date: {
      year: new Date().getFullYear(),
    },
  };

  return {
    raw: page,
    slug: page.slug,
    title: resolveTemplateValue(localizedValue(page, locale, "title"), context),
    content: resolveTemplateValue(localizedValue(page, locale, "content"), context),
    metaTitle: page.metaTitle ? resolveTemplateValue(page.metaTitle, context) : page.metaTitle,
    metaDescription: page.metaDescription
      ? resolveTemplateValue(page.metaDescription, context)
      : page.metaDescription,
    publishedAt: page.publishedAt,
    updatedAt: page.updatedAt,
  };
}

export function buildContentPageMetadata(
  page: ResolvedContentPage,
  options?: {
    fallback?: {
      title: string;
      description: string;
    };
    locale?: string;
    routePath?: string;
    siteName?: string | null;
  },
): Metadata {
  const title = page.metaTitle || page.title || options?.fallback?.title;
  const description = page.metaDescription || options?.fallback?.description;

  if (options?.locale && options?.routePath) {
    return buildRouteMetadata({
      locale: options.locale,
      routePath: options.routePath,
      siteName: options.siteName,
      title,
      description,
      modifiedTime: page.updatedAt,
    });
  }

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    },
  };
}
