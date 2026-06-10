import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/api";
import { cmsFaqs } from "@/lib/cms-api";
import { buildRouteMetadata } from "@/lib/site-metadata";
import { safeCmsLoad } from "@/lib/cms-runtime";
import { loadStructuredPageContent, loadStructuredPageSeo } from "@/lib/structured-page-server";
import { FAQClient, type FaqPageContent } from "./faq-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}/faq`;
  const [brand, seo] = await Promise.all([
    getBrandSettings().catch(() => null),
    loadStructuredPageSeo("faq", locale, routePath),
  ]);

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: seo?.metaTitle || seo?.title || "Frequently asked questions",
    description: seo?.metaDescription || seo?.summary || brand?.tagline,
    modifiedTime: seo?.updatedAt || brand?.updatedAt,
  });
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const routePath = `/${locale}/faq`;
  const faqs = await safeCmsLoad("faq:collection", () => cmsFaqs(undefined, routePath), []);
  const initialContent = await loadStructuredPageContent<FaqPageContent>("faq", locale, routePath);
  const faqJsonLd = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: locale === "hi" && faq.questionHi ? faq.questionHi : faq.questionEn,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answerEn,
          },
        })),
      }
    : null;

  return (
    <>
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      <FAQClient initialFaqs={faqs} initialContent={initialContent} />
    </>
  );
}
