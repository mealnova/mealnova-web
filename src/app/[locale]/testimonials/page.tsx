import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/api";
import { cmsTestimonials } from "@/lib/cms-api";
import { buildRouteMetadata } from "@/lib/site-metadata";
import { safeCmsLoad } from "@/lib/cms-runtime";
import { loadStructuredPageContent, loadStructuredPageSeo } from "@/lib/structured-page-server";
import { TestimonialsClient, type TestimonialsPageContent } from "./testimonials-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}/testimonials`;
  const [brand, seo] = await Promise.all([
    getBrandSettings().catch(() => null),
    loadStructuredPageSeo("testimonials", locale, routePath),
  ]);

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: seo?.metaTitle || seo?.title || "Testimonials",
    description: seo?.metaDescription || seo?.summary || brand?.tagline,
    modifiedTime: seo?.updatedAt || brand?.updatedAt,
  });
}

export default async function TestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const routePath = `/${locale}/testimonials`;
  const testimonials = await safeCmsLoad("testimonials:collection", () => cmsTestimonials(routePath), []);
  const initialContent = await loadStructuredPageContent<TestimonialsPageContent>("testimonials", locale, routePath);
  return <TestimonialsClient initialTestimonials={testimonials} initialContent={initialContent} />;
}
