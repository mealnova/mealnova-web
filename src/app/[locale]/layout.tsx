import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PreviewBanner } from "@/components/site/preview-banner";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/lib/providers/query-provider";
import { getBrandSettings } from "@/lib/api";
import { logCmsRuntimeIssue } from "@/lib/cms-runtime";
import { getServerPreviewSession } from "@/lib/cms-preview";
import { isSeoEnabledLocale } from "@/lib/locale-paths";
import { resolveActiveTheme } from "@/lib/theme-resolver";
import { loadStructuredPageContent } from "@/lib/structured-page-server";
import { buildOrganizationJsonLd, buildWebsiteJsonLd, getSiteOrigin, getSiteUrl } from "@/lib/site-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let brand: Awaited<ReturnType<typeof getBrandSettings>> | null = null;
  try {
    brand = await getBrandSettings();
  } catch (error) {
    logCmsRuntimeIssue("layout:metadata:brand", error);
    return {
      metadataBase: new URL(getSiteOrigin()),
      title: "Content unavailable",
      description: "Content is temporarily unavailable.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
  const siteName = brand.siteName?.trim() ?? "";
  const tagline = brand.tagline?.trim() ?? "";
  const defaultTitle = siteName && tagline ? `${siteName} - ${tagline}` : siteName || tagline || "";
  const seoEnabledLocale = isSeoEnabledLocale(locale);

  return {
    metadataBase: new URL(getSiteOrigin()),
    applicationName: siteName || "Mealnova",
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION
        ? { google: process.env.GOOGLE_SITE_VERIFICATION }
        : {}),
    },
    title: {
      default: defaultTitle,
      template: siteName ? `%s | ${siteName}` : "%s",
    },
    description: tagline || undefined,
    keywords: [
      "corporate catering",
      "event catering",
      "cafeteria management",
      "office meals",
      "Mealnova",
    ],
    category: "Food services",
    referrer: "origin-when-cross-origin",
    icons: {
      icon: "/icon.svg",
      shortcut: "/icon.svg",
      apple: "/icon.svg",
    },
    openGraph: {
      type: "website",
      locale: locale === "hi" ? "hi_IN" : locale === "mr" ? "mr_IN" : "en_IN",
      siteName: siteName || undefined,
      title: defaultTitle || undefined,
      description: tagline || undefined,
      images: [
        {
          url: getSiteUrl("/opengraph-image"),
          width: 1200,
          height: 630,
          alt: defaultTitle || siteName || "Mealnova",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle || undefined,
      description: tagline || undefined,
      images: [getSiteUrl("/twitter-image")],
    },
    robots: {
      index: seoEnabledLocale,
      follow: seoEnabledLocale,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "hi" | "mr")) {
    notFound();
  }

  const [messages, themeResult, headerContent, footerContent, previewSession] = await Promise.all([
    import(`../../../messages/${locale}.json`).then((m) => m.default),
    resolveActiveTheme(),
    loadStructuredPageContent("site-header", locale),
    loadStructuredPageContent("site-footer", locale),
    getServerPreviewSession(),
  ]);

  const { brandSettings, themeCss } = themeResult;
  const cmsShellUnavailable = !brandSettings;
  const organizationJsonLd = buildOrganizationJsonLd(brandSettings ?? null);
  const websiteJsonLd = buildWebsiteJsonLd(brandSettings ?? null);

  return (
    <>
      {themeCss ? <style dangerouslySetInnerHTML={{ __html: `:root { ${themeCss} }` }} /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <QueryProvider
          initialBrandSettings={brandSettings ?? undefined}
          initialStructuredPages={{
            "site-header": headerContent,
            "site-footer": footerContent,
          }}
          locale={locale}
        >
          {previewSession ? <PreviewBanner routePath={previewSession.routePath} /> : null}
          {cmsShellUnavailable ? (
            <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
              Content is temporarily unavailable. Core CMS settings could not be loaded for this request.
            </div>
          ) : (
            <Header />
          )}
          <main>{children}</main>
          {cmsShellUnavailable ? null : <Footer />}
        </QueryProvider>
      </NextIntlClientProvider>
    </>
  );
}
