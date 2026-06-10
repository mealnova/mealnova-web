import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero } from "@/components/site/page-primitives";
import { getBrandSettings } from "@/lib/api";
import {
  getStructuredPageContent,
  type CmsCardItem,
  type CmsCtaContent,
  mapCmsActionVariant,
} from "@/lib/page-content";
import { cmsBlogPost } from "@/lib/cms-api";
import { safeCmsLoad } from "@/lib/cms-runtime";
import { buildRouteMetadata, buildOrganizationJsonLd, getSiteUrl, toAbsoluteUrl } from "@/lib/site-metadata";

interface BlogDetailPageContent {
  heroEyebrow: string;
  backLabel: string;
  authorLabel: string;
  publishedLabel: string;
  unpublishedValue: string;
  aboutArticle: CmsCardItem;
  emptyArticle: {
    title: string;
    description: string;
  };
  cta: CmsCtaContent;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const routePath = `/${locale}/blog/${slug}`;
  const [brand, post] = await Promise.all([
    getBrandSettings().catch(() => null),
    safeCmsLoad(`blog-detail:metadata:${slug}`, () => cmsBlogPost(slug, routePath), null),
  ]);

  if (!post) return {};

  return buildRouteMetadata({
    locale,
    routePath,
    siteName: brand?.siteName,
    title: post.title,
    description: post.excerpt || brand?.tagline,
    image: post.featuredImage || undefined,
    type: "article",
    publishedTime: post.publishedAt || undefined,
    modifiedTime: post.publishedAt || brand?.updatedAt,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const routePath = `/${locale}/blog/${slug}`;
  const [content, post] = await Promise.all([
    getStructuredPageContent<BlogDetailPageContent>("blog-detail", locale, routePath),
    safeCmsLoad(`blog-detail:${slug}`, () => cmsBlogPost(slug, routePath), null),
  ]);

  if (!content) {
    return <ContentUnavailable />;
  }

  if (!post) {
    notFound();
  }

  const title = post.title ?? content.emptyArticle.title;
  const excerpt = post.excerpt ?? content.emptyArticle.description;
  const brand = await getBrandSettings().catch(() => null);
  const publishedValue = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : content.unpublishedValue;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt,
    datePublished: post.publishedAt || undefined,
    dateModified: post.publishedAt || brand?.updatedAt || undefined,
    mainEntityOfPage: getSiteUrl(routePath),
    image: post.featuredImage ? [toAbsoluteUrl(post.featuredImage)] : undefined,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author,
        }
      : undefined,
    publisher: buildOrganizationJsonLd(brand ?? null),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <PageHero
        eyebrow={content.heroEyebrow}
        title={title}
        description={excerpt}
        actions={[{ href: "/blog", label: content.backLabel }]}
        metrics={[
          { value: post.author ?? "", label: content.authorLabel },
          { value: publishedValue, label: content.publishedLabel },
        ]}
      />

      <section className="page-section">
        <div className="container-max">
          <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
            <InfoCard
              eyebrow={content.aboutArticle.eyebrow}
              title={content.aboutArticle.title}
              description={content.aboutArticle.description}
            >
              <div className="flex flex-wrap gap-2">
                {(post.tags ?? []).slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </InfoCard>

            <div className="site-panel p-6 lg:p-8">
              {post.content ? (
                <div className="space-y-5 text-sm leading-8 text-text-secondary">
                  {post.content
                    .split("\n")
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={`${slug}-${index}`}>{paragraph}</p>
                    ))}
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-8 text-text-secondary">
                  <p>{content.emptyArticle.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <PageCta
        eyebrow={content.cta.eyebrow}
        title={content.cta.title}
        description={content.cta.description}
        actions={content.cta.actions.map((action) => ({
          href: action.href,
          label: action.label,
          variant: mapCmsActionVariant(action.variant),
        }))}
      />
    </>
  );
}
