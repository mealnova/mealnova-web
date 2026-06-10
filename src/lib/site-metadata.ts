import type { Metadata } from "next";
import type { BrandSettings } from "@/lib/api";
import { routing } from "@/i18n/routing";
import { SEO_ENABLED_LOCALES, isSeoEnabledLocale } from "@/lib/locale-paths";

const DEFAULT_SITE_ORIGIN = "https://mealnova.in";
const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

function normalizeOrigin(raw: string) {
  const trimmed = raw.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return candidate.replace(/\/+$/, "");
}

function normalizePath(path: string) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function getSiteOrigin() {
  const configured = process.env.WEB_URL || process.env.NEXTAUTH_URL || DEFAULT_SITE_ORIGIN;
  return normalizeOrigin(configured);
}

export function getSiteUrl(path = "/") {
  return new URL(normalizePath(path), `${getSiteOrigin()}/`).toString();
}

export function toAbsoluteUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    return new URL(value).toString();
  } catch {
    return getSiteUrl(value);
  }
}

export function getOpenGraphLocale(locale: string) {
  if (locale === "hi") return "hi_IN";
  if (locale === "mr") return "mr_IN";
  return "en_IN";
}

export function buildLocaleAlternates(routePath: string) {
  const normalized = normalizePath(routePath);
  const segments = normalized.split("/");
  const currentLocale = segments[1];

  const languages = Object.fromEntries(
    SEO_ENABLED_LOCALES.map((locale) => {
      if (currentLocale && routing.locales.includes(currentLocale as (typeof routing.locales)[number])) {
        const localizedSegments = [...segments];
        localizedSegments[1] = locale;
        return [locale, localizedSegments.join("/") || `/${locale}`];
      }

      return [locale, normalized === "/" ? `/${locale}` : `/${locale}${normalized}`];
    }),
  ) as Record<string, string>;

  languages["x-default"] = languages[routing.defaultLocale];
  return languages;
}

function resolveMetadataTitle(title: string | undefined, siteName?: string | null) {
  if (!title) return undefined;
  if (siteName && title.toLowerCase().includes(siteName.toLowerCase())) {
    return { absolute: title };
  }
  return title;
}

function resolveOpenGraphTitle(title: string | undefined, siteName?: string | null) {
  if (!title) return undefined;
  if (siteName && !title.toLowerCase().includes(siteName.toLowerCase())) {
    return `${title} | ${siteName}`;
  }
  return title;
}

interface BuildRouteMetadataInput {
  locale: string;
  routePath: string;
  title?: string | null;
  description?: string | null;
  siteName?: string | null;
  image?: string | null;
  noIndex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

export function buildRouteMetadata({
  locale,
  routePath,
  title,
  description,
  siteName,
  image,
  noIndex,
  keywords,
  type = "website",
  publishedTime,
  modifiedTime,
}: BuildRouteMetadataInput): Metadata {
  const normalizedTitle = title?.trim() || undefined;
  const normalizedDescription = description?.trim() || undefined;
  const imageUrl = toAbsoluteUrl(image) ?? getSiteUrl(DEFAULT_OG_IMAGE_PATH);
  const openGraphTitle = resolveOpenGraphTitle(normalizedTitle, siteName);

  return {
    ...(resolveMetadataTitle(normalizedTitle, siteName)
      ? { title: resolveMetadataTitle(normalizedTitle, siteName) }
      : {}),
    ...(normalizedDescription ? { description: normalizedDescription } : {}),
    ...(keywords?.length ? { keywords } : {}),
    alternates: {
      canonical: routePath,
      languages: buildLocaleAlternates(routePath),
    },
    openGraph: {
      type,
      url: routePath,
      locale: getOpenGraphLocale(locale),
      ...(siteName ? { siteName } : {}),
      ...(openGraphTitle ? { title: openGraphTitle } : {}),
      ...(normalizedDescription ? { description: normalizedDescription } : {}),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: openGraphTitle || siteName || "Mealnova",
        },
      ],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(openGraphTitle ? { title: openGraphTitle } : {}),
      ...(normalizedDescription ? { description: normalizedDescription } : {}),
      images: [imageUrl],
    },
    ...(noIndex || !isSeoEnabledLocale(locale)
      ? {
          robots: {
            index: false,
            follow: false,
            nocache: true,
            googleBot: {
              index: false,
              follow: false,
              noimageindex: true,
            },
          },
        }
      : {}),
  };
}

export function buildOrganizationJsonLd(brand: BrandSettings | null) {
  const siteName = brand?.siteName?.trim() || "Mealnova";
  const address = brand?.address?.trim();
  const email = brand?.email?.trim();
  const phone = brand?.phone?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: getSiteOrigin(),
    ...(email ? { email } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: address,
            addressCountry: "IN",
          },
        }
      : {}),
  };
}

export function buildCateringServiceJsonLd(
  brand: BrandSettings | null,
  options?: {
    routePath?: string;
    description?: string;
    serviceTypes?: string[];
  },
) {
  const siteName = brand?.siteName?.trim() || "Mealnova";
  const address = brand?.address?.trim() || "Pune, Maharashtra";
  const email = brand?.email?.trim();
  const phone = brand?.phone?.trim();
  const description =
    options?.description?.trim() ||
    brand?.tagline?.trim() ||
    "Corporate catering services, office meals, cafeteria management, and event catering in Pune.";

  return {
    "@context": "https://schema.org",
    "@type": "CateringService",
    name: siteName,
    url: getSiteUrl(options?.routePath || "/en"),
    image: getSiteUrl(DEFAULT_OG_IMAGE_PATH),
    description,
    ...(email ? { email } : {}),
    ...(phone ? { telephone: phone } : {}),
    priceRange: "INR",
    servesCuisine: ["Vegetarian", "Indian"],
    areaServed: [
      "Pune",
      "Baner",
      "Balewadi",
      "Hinjewadi",
      "Wakad",
      "Kharadi",
      "Magarpatta",
    ],
    serviceType:
      options?.serviceTypes ?? [
        "Corporate catering",
        "Office meal service",
        "Cafeteria management",
        "Event catering",
      ],
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "20:00",
      },
    ],
  };
}

export function buildWebsiteJsonLd(brand: BrandSettings | null) {
  const siteName = brand?.siteName?.trim() || "Mealnova";
  const tagline = brand?.tagline?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: getSiteOrigin(),
    inLanguage: ["en-IN", "hi-IN", "mr-IN"],
    ...(tagline ? { description: tagline } : {}),
  };
}

export function buildFaqJsonLd(
  entries: Array<{ question: string; answer: string }>,
) {
  const mainEntity = entries
    .filter((entry) => entry.question.trim() && entry.answer.trim())
    .map((entry) => ({
      "@type": "Question",
      name: entry.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer.trim(),
      },
    }));

  if (mainEntity.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  const itemListElement = items
    .filter((item) => item.name.trim() && item.path.trim())
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name.trim(),
      item: getSiteUrl(item.path),
    }));

  if (itemListElement.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}
