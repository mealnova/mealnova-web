import type { Metadata } from "next";
import { getBrandSettings } from "@/lib/api";
import { cmsBlogPosts } from "@/lib/cms-api";
import { buildRouteMetadata } from "@/lib/site-metadata";
import { safeCmsLoad } from "@/lib/cms-runtime";
import { loadStructuredPageContent, loadStructuredPageSeo } from "@/lib/structured-page-server";
import { BlogClient, type BlogPageContent } from "./blog-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const routePath = `/${locale}/blog`;
  const [brand, seo] = await Promise.all([
    getBrandSettings().catch(() => null),
    loadStructuredPageSeo("blog", locale, routePath),
  ]);

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: seo?.metaTitle || seo?.title || "Blog",
    description: seo?.metaDescription || seo?.summary || brand?.tagline,
    modifiedTime: seo?.updatedAt || brand?.updatedAt,
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const routePath = `/${locale}/blog`;
  const posts = await safeCmsLoad("blog:collection", () => cmsBlogPosts(routePath), []);
  const initialContent = await loadStructuredPageContent<BlogPageContent>("blog", locale, routePath);
  return <BlogClient initialPosts={posts} initialContent={initialContent} />;
}
