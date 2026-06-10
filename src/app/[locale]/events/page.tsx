import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/api";
import { cmsGalleryItems } from "@/lib/cms-api";
import { safeCmsLoad } from "@/lib/cms-runtime";
import {
  buildBreadcrumbJsonLd,
  buildCateringServiceJsonLd,
  buildFaqJsonLd,
  buildRouteMetadata,
} from "@/lib/site-metadata";
import { loadStructuredPageContent } from "@/lib/structured-page-server";
import EventsPageClient, { type EventsPageContent } from "./page-client";

const EVENTS_SEO = {
  title: "Pure Vegetarian Event Catering in Pune",
  description:
    "Pure vegetarian catering in Pune for weddings, corporate events, conferences, family functions, live counters, and celebrations.",
  keywords: [
    "event catering pune",
    "wedding catering pune",
    "corporate event catering pune",
    "vegetarian catering pune",
    "buffet catering pune",
  ],
  serviceTypes: [
    "Event catering",
    "Wedding catering",
    "Corporate event catering",
    "Vegetarian buffet catering",
  ],
} as const;
const EVENTS_FAQ_ENTRIES = [
  {
    question: "Do you provide event catering services in Pune?",
    answer:
      "Yes. Hanuman Caterers provides pure vegetarian catering in Pune for weddings, receptions, corporate events, launches, conferences, and family celebrations.",
  },
  {
    question: "Can I share event details online before speaking to the team?",
    answer:
      "Yes. Share the date, venue, guest count, and menu preferences so the first call can focus on availability, service style, and the right menu plan.",
  },
  {
    question: "Do you support vegetarian catering and buffet planning?",
    answer:
      "Yes. We plan vegetarian buffet service, live counters, Jain-friendly options, staff flow, and timing for Pune celebrations and corporate gatherings.",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}/events`;
  const brand = await getBrandSettings().catch(() => null);

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: EVENTS_SEO.title,
    description: EVENTS_SEO.description,
    keywords: [...EVENTS_SEO.keywords],
    modifiedTime: brand?.updatedAt,
  });
}

export default async function EventsPageRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const routePath = `/${locale}/events`;
  const [brand, initialContent, initialHeroGalleryItems] = await Promise.all([
    getBrandSettings().catch(() => null),
    loadStructuredPageContent<EventsPageContent>("events", locale, routePath),
    safeCmsLoad("events:hero-gallery", () => cmsGalleryItems(undefined, routePath), []),
  ]);
  const serviceJsonLd = buildCateringServiceJsonLd(brand, {
    routePath,
    description: EVENTS_SEO.description,
    serviceTypes: [...EVENTS_SEO.serviceTypes],
  });
  const faqJsonLd = locale === "en" ? buildFaqJsonLd([...EVENTS_FAQ_ENTRIES]) : null;
  const breadcrumbJsonLd =
    locale === "en"
      ? buildBreadcrumbJsonLd([
          { name: brand?.siteName ?? "Hanuman Caterers", path: "/en" },
          { name: "Pure Vegetarian Event Catering in Pune", path: routePath },
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
      <EventsPageClient
        locale={locale}
        initialContent={initialContent}
        initialHeroGalleryItems={initialHeroGalleryItems}
      />
    </>
  );
}
