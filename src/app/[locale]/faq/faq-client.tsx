"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { FAQ } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero, SectionHeader } from "@/components/site/page-primitives";
import { useBrandSettings } from "@/lib/hooks/use-content";
import { type CmsCtaContent, type CmsHeroContent, type CmsSectionHeader, type CmsUnavailableContent, mapCmsActionVariant, useResolvedStructuredPageContent } from "@/lib/page-content";
import { cn } from "@/lib/utils";

export interface FaqPageContent {
  hero: CmsHeroContent;
  searchLabel: string;
  searchPlaceholder: string;
  categoriesLabel: string;
  allCategoryLabel: string;
  answersHeader: CmsSectionHeader;
  unavailable: CmsUnavailableContent;
  emptyResults: CmsUnavailableContent;
  resetFiltersLabel: string;
  cta: CmsCtaContent;
}

/** Capitalize first letter of each word */
function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FAQClient({
  initialFaqs,
  initialContent,
}: {
  initialFaqs: FAQ[];
  initialContent?: FaqPageContent | null;
}) {
  const { data: brand, isPending: brandPending } = useBrandSettings();
  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<FaqPageContent>("faq", {
    brand,
    counts: { items: initialFaqs.length },
  }, {
    initialData: initialContent,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = useMemo(() => {
    return initialFaqs.map((faq) => ({
      question: faq.questionEn,
      answer: faq.answerEn,
      category: faq.category ?? "",
    }));
  }, [initialFaqs]);

  const allCategory = content?.allCategoryLabel ?? "";
  const categories = useMemo(() => {
    if (!allCategory) return [];
    const dynamic = Array.from(new Set(faqs.map((faq) => faq.category).filter(Boolean)));
    return [allCategory, ...dynamic];
  }, [allCategory, faqs]);

  const normalizedActiveCategory = activeCategory || allCategory;

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = normalizedActiveCategory === allCategory || faq.category === normalizedActiveCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allCategory, faqs, normalizedActiveCategory, searchQuery]);

  const contentUnavailable = initialFaqs.length === 0;

  if (brandPending || contentPending) {
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
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category);
                        setOpenIndex(0);
                      }}
                      className={cn(
                        "filter-chip",
                        normalizedActiveCategory === category && "filter-chip-active",
                      )}
                    >
                      {titleCase(category)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.answersHeader.eyebrow}
            title={content.answersHeader.title}
            description={content.answersHeader.description}
          />

          <div className="mt-10 grid gap-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div key={faq.question} className="site-panel overflow-hidden p-0">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <div>
                        <div className="muted-label">{faq.category || content.allCategoryLabel}</div>
                        <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-text-primary">
                          {faq.question}
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-text-muted transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen ? (
                      <div className="border-t border-black/[0.06] px-6 py-5 text-sm leading-7 text-text-secondary">
                        {faq.answer}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <InfoCard
                eyebrow={contentUnavailable ? content.unavailable.eyebrow : content.emptyResults.eyebrow}
                title={contentUnavailable ? content.unavailable.title : content.emptyResults.title}
                description={
                  contentUnavailable ? content.unavailable.description : content.emptyResults.description
                }
              >
                {contentUnavailable ? (
                  content.unavailable.primaryAction ? (
                    <Button variant={mapCmsActionVariant(content.unavailable.primaryAction.variant) ?? "outline"} asChild>
                      <Link href={content.unavailable.primaryAction.href}>
                        {content.unavailable.primaryAction.label}
                      </Link>
                    </Button>
                  ) : null
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory(allCategory);
                      setOpenIndex(0);
                    }}
                  >
                    {content.resetFiltersLabel}
                  </Button>
                )}
              </InfoCard>
            )}
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
