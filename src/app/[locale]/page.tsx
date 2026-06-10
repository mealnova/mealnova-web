import type { Metadata } from "next";
import { HomePage as HomePageView, type HomePageContent } from "@/components/site/home-page";
import {
  cmsClientLogos,
  cmsServiceOfferings,
  cmsTestimonials,
} from "@/lib/cms-api";
import { getBrandSettings } from "@/lib/api";
import { safeCmsLoad } from "@/lib/cms-runtime";
import {
  buildCateringServiceJsonLd,
  buildFaqJsonLd,
  buildRouteMetadata,
} from "@/lib/site-metadata";
import { loadStructuredPageContent, loadStructuredPageSeo } from "@/lib/structured-page-server";

const HOME_SEO = {
  title: "Corporate Catering Services in Pune",
  description:
    "Mealnova provides corporate catering services in Pune, office meal programs, cafeteria management, and vegetarian event catering across Baner, Balewadi, Hinjewadi, Wakad, Kharadi, and Magarpatta.",
  keywords: [
    "corporate catering pune",
    "catering services pune",
    "office catering pune",
    "cafeteria management pune",
    "event catering pune",
    "vegetarian catering pune",
  ],
} as const;
const HOME_FAQ_ENTRIES = [
  {
    question: "Do you provide corporate catering services in Pune?",
    answer:
      "Mealnova provides corporate catering services in Pune with office meals, employee meal programs, cafeteria management, and scheduled workplace catering.",
  },
  {
    question: "Which Pune areas does Mealnova serve?",
    answer:
      "The public site highlights service coverage across Baner, Balewadi, Hinjewadi, Wakad, Kharadi, Magarpatta, and nearby Pune business districts.",
  },
  {
    question: "Can I request event catering or start corporate onboarding online?",
    answer:
      "Yes. Event clients can build a catering request online, and companies can start corporate onboarding online before approved ordering access is issued.",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}`;
  const [brand, seo] = await Promise.all([
    getBrandSettings().catch(() => null),
    loadStructuredPageSeo("home", locale, routePath),
  ]);

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: locale === "en" ? seo?.metaTitle || HOME_SEO.title : seo?.metaTitle || seo?.title || undefined,
    description:
      locale === "en"
        ? seo?.metaDescription || HOME_SEO.description
        : seo?.metaDescription || seo?.summary || brand?.tagline,
    keywords: locale === "en" ? [...HOME_SEO.keywords] : undefined,
    modifiedTime: seo?.updatedAt || brand?.updatedAt,
  });
}

export default async function HomePageRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const routePath = `/${locale}`;
  const [brand, initialContent, initialServices, initialClientLogos, initialTestimonials] =
    await Promise.all([
      getBrandSettings().catch(() => null),
      loadStructuredPageContent<HomePageContent>("home", locale, routePath),
      safeCmsLoad("home:services", () => cmsServiceOfferings(routePath), []),
      safeCmsLoad("home:client-logos", () => cmsClientLogos(routePath), []),
      safeCmsLoad("home:testimonials", () => cmsTestimonials(routePath), []),
    ]);
  const cateringServiceJsonLd =
    locale === "en"
      ? buildCateringServiceJsonLd(brand, {
          routePath,
          description: HOME_SEO.description,
        })
      : null;
  const faqJsonLd = locale === "en" ? buildFaqJsonLd([...HOME_FAQ_ENTRIES]) : null;

  return (
    <>
      {cateringServiceJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(cateringServiceJsonLd) }}
        />
      ) : null}
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}
      <HomePageView
        locale={locale}
        initialContent={initialContent}
        initialServices={initialServices}
        initialClientLogos={initialClientLogos}
        initialTestimonials={initialTestimonials}
      />
    </>
  );
}
