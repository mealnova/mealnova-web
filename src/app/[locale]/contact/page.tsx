import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/api";
import { buildRouteMetadata } from "@/lib/site-metadata";
import { loadStructuredPageContent } from "@/lib/structured-page-server";
import { loadStructuredPageSeo } from "@/lib/structured-page-server";
import { ContactPageClient, type ContactPageContent } from "./contact-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}/contact`;
  const [brand, seo] = await Promise.all([
    getBrandSettings().catch(() => null),
    loadStructuredPageSeo("contact", locale, routePath),
  ]);

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: seo?.metaTitle || seo?.title || "Contact",
    description: seo?.metaDescription || seo?.summary || brand?.tagline,
    modifiedTime: seo?.updatedAt || brand?.updatedAt,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const initialContent = await loadStructuredPageContent<ContactPageContent>("contact", locale, `/${locale}/contact`);
  return <ContactPageClient initialContent={initialContent} />;
}
