import { routing } from "@/i18n/routing";

const LOCALE_SET = new Set(routing.locales);

export const SEO_ENABLED_LOCALES = [routing.defaultLocale] as const;

export function hasLocalePrefix(pathname: string) {
  const [, firstSegment] = pathname.split("/");
  return LOCALE_SET.has(firstSegment as (typeof routing.locales)[number]);
}

export function getPathLocale(pathname?: string | null) {
  if (!pathname) {
    return routing.defaultLocale;
  }

  const [, firstSegment] = pathname.split("/");
  return LOCALE_SET.has(firstSegment as (typeof routing.locales)[number])
    ? (firstSegment as (typeof routing.locales)[number])
    : routing.defaultLocale;
}

export function localizeHref(href: string, locale: string) {
  if (!href || href.startsWith("#") || !href.startsWith("/") || href.startsWith("//")) {
    return href;
  }

  const [pathWithQuery, hashFragment] = href.split("#");
  const [pathname, queryString] = pathWithQuery.split("?");

  if (hasLocalePrefix(pathname)) {
    return href;
  }

  const localizedPath = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const search = queryString ? `?${queryString}` : "";
  const hash = hashFragment ? `#${hashFragment}` : "";
  return `${localizedPath}${search}${hash}`;
}

export function isSeoEnabledLocale(locale: string) {
  return SEO_ENABLED_LOCALES.includes(locale as (typeof SEO_ENABLED_LOCALES)[number]);
}
