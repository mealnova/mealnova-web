import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/api";
import {
  buildBreadcrumbJsonLd,
  buildCateringServiceJsonLd,
  buildFaqJsonLd,
  buildRouteMetadata,
} from "@/lib/site-metadata";
import { loadStructuredPageContent } from "@/lib/structured-page-server";
import CorporatePageClient, { type CorporatePageContent } from "./page-client";

const CORPORATE_SEO = {
  title: "Corporate Catering in Pune",
  description:
    "Corporate catering in Pune for offices, campuses, and teams. Managed cafeteria services, daily office meals, employee meal programs, and GST-ready billing.",
  keywords: [
    "corporate catering pune",
    "office catering pune",
    "cafeteria management pune",
    "employee meal service pune",
    "office meals pune",
  ],
  serviceTypes: [
    "Corporate catering",
    "Office meal service",
    "Cafeteria management",
    "Employee meal programs",
  ],
} as const;
const CORPORATE_FAQ_ENTRIES = [
  {
    question: "Do you provide corporate catering in Pune for offices and tech parks?",
    answer:
      "Yes. Mealnova positions corporate catering in Pune around offices, campuses, and business parks with daily meals, cafeteria support, and managed service planning.",
  },
  {
    question: "Can companies onboard online before ordering?",
    answer:
      "Yes. Companies can submit onboarding details online, share meal volumes and billing preferences, and then receive ordering access after review and approval.",
  },
  {
    question: "What kinds of corporate meal programs are supported?",
    answer:
      "The corporate flow is designed for daily office lunches, scheduled meal slots, employee meal programs, cafeteria management, and GST-ready invoicing.",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}/corporate`;
  const brand = await getBrandSettings().catch(() => null);

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: CORPORATE_SEO.title,
    description: CORPORATE_SEO.description,
    keywords: [...CORPORATE_SEO.keywords],
    modifiedTime: brand?.updatedAt,
  });
}

export default async function CorporatePageRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const routePath = `/${locale}/corporate`;
  const [brand, initialContent] = await Promise.all([
    getBrandSettings().catch(() => null),
    loadStructuredPageContent<CorporatePageContent>("corporate", locale, routePath),
  ]);
  const serviceJsonLd = buildCateringServiceJsonLd(brand, {
    routePath,
    description: CORPORATE_SEO.description,
    serviceTypes: [...CORPORATE_SEO.serviceTypes],
  });
  const faqJsonLd = locale === "en" ? buildFaqJsonLd([...CORPORATE_FAQ_ENTRIES]) : null;
  const breadcrumbJsonLd =
    locale === "en"
      ? buildBreadcrumbJsonLd([
          { name: "Mealnova", path: "/en" },
          { name: "Corporate Catering in Pune", path: routePath },
        ])
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}
      {breadcrumbJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      ) : null}
      <CorporatePageClient locale={locale} initialContent={initialContent} />
    </>
  );
}
