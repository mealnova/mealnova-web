import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { ButtonProps } from "@/components/ui/button";
import { getPageBySlug, type ContentPage } from "@/lib/api";
import { resolveTemplateValue } from "@/lib/content-templating";
import { logCmsRuntimeIssue } from "@/lib/cms-runtime";

export interface CmsAction {
  href: string;
  label: string;
  variant?: "default" | "outline" | "white" | "ghost";
}

export interface CmsMetric {
  value: string;
  label: string;
  detail?: string;
}

export interface CmsSectionHeader {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center" | "right";
}

export interface CmsCardItem {
  eyebrow?: string;
  title: string;
  description?: string;
  value?: string;
  href?: string;
  label?: string;
  detail?: string;
  items?: string[];
}

export interface CmsHeroContent {
  eyebrow: string;
  title: string;
  description: string;
  actions?: CmsAction[];
  metrics?: CmsMetric[];
  aside?: {
    eyebrow?: string;
    title: string;
    description?: string;
    badges?: string[];
    panels?: Array<{ label: string; description: string }>;
  };
}

export interface CmsCtaContent {
  eyebrow: string;
  title: string;
  description: string;
  actions: CmsAction[];
}

export interface CmsUnavailableContent {
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction?: CmsAction;
  secondaryAction?: CmsAction;
}

export function mapCmsActionVariant(
  variant?: CmsAction["variant"],
): ButtonProps["variant"] | undefined {
  switch (variant) {
    case "outline":
    case "white":
    case "ghost":
      return variant;
    case "default":
      return undefined;
    default:
      return undefined;
  }
}

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

export function resolveStructuredContent<T>(input: T, context: Record<string, unknown>): T {
  return resolveTemplateValue(input, context);
}

export async function getStructuredPageContent<T>(
  slug: string,
  locale: string,
  routePath?: string | null,
): Promise<T | null> {
  let page: ContentPage | null;
  try {
    page = await getPageBySlug(slug, { routePath });
  } catch (error) {
    logCmsRuntimeIssue(`structured-page-client:${slug}`, error);
    return null;
  }

  if (!page) return null;
  return parseStructuredContent<T>(localizedValue(page, locale));
}

export function useStructuredPageContent<T>(
  slug: string,
  options?: { initialData?: T | null; enabled?: boolean },
) {
  const locale = useLocale();

  return useQuery<T | null>({
    queryKey: ["content", "structured-page", slug, locale],
    queryFn: () => getStructuredPageContent<T>(slug, locale),
    initialData: options?.initialData,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useResolvedStructuredPageContent<T>(
  slug: string,
  context?: Record<string, unknown>,
  options?: { initialData?: T | null; enabled?: boolean },
) {
  const query = useStructuredPageContent<T>(slug, options);

  const data = useMemo(() => {
    if (!query.data) return null;
    if (!context) return query.data;
    return resolveStructuredContent(query.data, context);
  }, [context, query.data]);

  return { ...query, data };
}
