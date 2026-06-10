"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Building2, ChefHat, Search, Sparkles, UtensilsCrossed } from "lucide-react";
import {
  buildBlogCategoryOptions,
  formatBlogCategoryLabel,
  normalizeBlogCategoryId,
} from "@mealnova/shared";
import type { BlogPost } from "@/lib/cms-api";
import { Badge } from "@/components/ui/badge";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero, SectionHeader } from "@/components/site/page-primitives";
import { type CmsCtaContent, type CmsHeroContent, type CmsSectionHeader, mapCmsActionVariant, useResolvedStructuredPageContent } from "@/lib/page-content";
import { cn } from "@/lib/utils";

const categoryIcons = {
  all: BookOpen,
  "corporate-wellness": Building2,
  "behind-the-kitchen": ChefHat,
  recipes: UtensilsCrossed,
  "event-stories": Sparkles,
} as const;

export interface BlogPageContent {
  hero: CmsHeroContent;
  searchLabel: string;
  searchPlaceholder: string;
  categoriesLabel: string;
  categories: Array<{ id: string; label: string }>;
  featuredHeader: CmsSectionHeader;
  emptyState: {
    unavailableTitle: string;
    unavailableDescription: string;
    noResultsTitle: string;
    noResultsDescription: string;
  };
  cta: CmsCtaContent;
}

export function BlogClient({
  initialPosts,
  initialContent,
}: {
  initialPosts: BlogPost[];
  initialContent?: BlogPageContent | null;
}) {
  const categoriesCount = new Set(
    initialPosts
      .map((post) => normalizeBlogCategoryId(post.category))
      .filter(Boolean),
  ).size;
  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<BlogPageContent>("blog", {
    counts: {
      posts: initialPosts.length,
      categories: categoriesCount,
    },
  }, {
    initialData: initialContent,
  });
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const posts = useMemo(
    () =>
      initialPosts.map((post) => ({
        ...post,
        category: normalizeBlogCategoryId(post.category) || "general",
      })),
    [initialPosts],
  );

  const categories = useMemo(() => {
    const merged = new Map<string, string>();

    for (const category of buildBlogCategoryOptions(content?.categories ?? [])) {
      merged.set(category.id, category.label);
    }

    for (const category of buildBlogCategoryOptions(posts.map((post) => post.category))) {
      if (!merged.has(category.id)) {
        merged.set(category.id, category.label);
      }
    }

    if (!merged.has("all")) {
      merged.set("all", "All posts");
    }

    const allCategory = merged.get("all");
    const specificCategories = [...merged.entries()]
      .filter(([id]) => id !== "all")
      .map(([id, label]) => ({ id, label }));

    return allCategory
      ? [{ id: "all", label: allCategory }, ...specificCategories]
      : specificCategories;
  }, [content?.categories, posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = activeCategory === "all" || post.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, posts, searchQuery]);

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  if (contentPending) {
    return <ContentLoading />;
  }

  if (!content) {
    return <ContentUnavailable />;
  }

  return (
    <>
      <PageHero
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        description={content.hero.description}
        metrics={content.hero.metrics}
        aside={
          content.hero.aside ? (
            <InfoCard
              tone="dark"
              eyebrow={content.hero.aside.eyebrow}
              title={content.hero.aside.title}
              description={content.hero.aside.description}
            />
          ) : undefined
        }
      />

      <section className="page-section-tight">
        <div className="container-max">
          <div className="site-panel p-6">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <div className="muted-label">{content.searchLabel}</div>
                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    className="input-shell pl-11"
                    placeholder={content.searchPlaceholder}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className="muted-label">{content.categoriesLabel}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const Icon = categoryIcons[category.id as keyof typeof categoryIcons] ?? BookOpen;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          "filter-chip inline-flex items-center gap-2",
                          activeCategory === category.id && "filter-chip-active",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.featuredHeader.eyebrow}
            title={content.featuredHeader.title}
            description={content.featuredHeader.description}
          />

          {featuredPost ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <InfoCard
                tone="dark"
                eyebrow={formatBlogCategoryLabel(featuredPost.category)}
                title={
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="transition-opacity hover:opacity-80"
                  >
                    {featuredPost.title}
                  </Link>
                }
                description={featuredPost.excerpt ?? ""}
              >
                <div className="flex flex-wrap gap-2">
                  {(featuredPost.tags ?? []).slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </InfoCard>

              <div className="grid gap-5">
                {remainingPosts.map((post) => (
                  <InfoCard
                    key={post.id}
                    eyebrow={formatBlogCategoryLabel(post.category)}
                    title={
                      <Link
                        href={`/blog/${post.slug}`}
                        className="transition-opacity hover:opacity-80"
                      >
                        {post.title}
                      </Link>
                    }
                    description={post.excerpt ?? ""}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-10">
              <InfoCard
                title={posts.length === 0 ? content.emptyState.unavailableTitle : content.emptyState.noResultsTitle}
                description={
                  posts.length === 0
                    ? content.emptyState.unavailableDescription
                    : content.emptyState.noResultsDescription
                }
              />
            </div>
          )}
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
