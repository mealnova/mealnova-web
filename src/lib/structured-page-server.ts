import { getBrandSettings, getPageBySlug, type ContentPage } from "@/lib/api";
import { resolveTemplateValue } from "@/lib/content-templating";
import { logCmsRuntimeIssue } from "@/lib/cms-runtime";
import { parseStructuredPageDocument } from "@mealnova/shared";

function localizedValue(page: ContentPage, locale: string): string {
  if (locale === "hi") {
    return page.contentHi || page.contentEn;
  }

  if (locale === "mr") {
    return page.contentMr || page.contentEn;
  }

  return page.contentEn;
}

function parseStructuredContent<T>(content: string): T | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

export async function loadStructuredPageContent<T>(
  slug: string,
  locale: string,
  routePath?: string | null,
): Promise<T | null> {
  let page: ContentPage | null;
  try {
    page = await getPageBySlug(slug, { routePath });
  } catch (error) {
    logCmsRuntimeIssue(`structured-page:${slug}:page`, error);
    return null;
  }

  if (!page) return null;

  let brand: Awaited<ReturnType<typeof getBrandSettings>> | null = null;
  try {
    brand = await getBrandSettings();
  } catch (error) {
    logCmsRuntimeIssue(`structured-page:${slug}:brand`, error);
  }

  const parsed = parseStructuredContent<T>(localizedValue(page, locale));
  if (!parsed) return null;

  return resolveTemplateValue(parsed, {
    brand: brand ?? {},
    date: {
      year: new Date().getFullYear(),
    },
  });
}

export interface StructuredPageSeo {
  title: string;
  summary?: string;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt?: string;
}

export async function loadStructuredPageSeo(
  slug: string,
  locale: string,
  routePath?: string | null,
): Promise<StructuredPageSeo | null> {
  let page: ContentPage | null;
  try {
    page = await getPageBySlug(slug, { routePath });
  } catch (error) {
    logCmsRuntimeIssue(`structured-page-seo:${slug}:page`, error);
    return null;
  }

  if (!page) return null;

  let brand: Awaited<ReturnType<typeof getBrandSettings>> | null = null;
  try {
    brand = await getBrandSettings();
  } catch (error) {
    logCmsRuntimeIssue(`structured-page-seo:${slug}:brand`, error);
  }

  const parsed = parseStructuredPageDocument(localizedValue(page, locale));
  if (!parsed.document) return null;

  const resolved = resolveTemplateValue(parsed.document, {
    brand: brand ?? {},
    date: {
      year: new Date().getFullYear(),
    },
  });

  return {
    title: resolved.title,
    summary: resolved.summary,
    metaTitle: resolved.metaTitle,
    metaDescription: resolved.metaDescription,
    updatedAt: page.updatedAt,
  };
}
