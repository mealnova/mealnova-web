"use client";

import { useMemo, useState } from "react";
import { Building2, MessageSquare, PartyPopper, UtensilsCrossed, Users } from "lucide-react";
import type { Testimonial } from "@/lib/api";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero, SectionHeader } from "@/components/site/page-primitives";
import { type CmsCtaContent, type CmsHeroContent, type CmsSectionHeader, mapCmsActionVariant, useResolvedStructuredPageContent } from "@/lib/page-content";
import { cn } from "@/lib/utils";

const filterIcons = {
  all: MessageSquare,
  corporate: Building2,
  events: PartyPopper,
  daily: UtensilsCrossed,
  individual: Users,
} as const;

export interface TestimonialsPageContent {
  hero: CmsHeroContent;
  filterLabel: string;
  filters: Array<{ id: string; label: string }>;
  sectionHeader: CmsSectionHeader;
  unavailable: {
    title: string;
    description: string;
  };
  cta: CmsCtaContent;
}

export function TestimonialsClient({
  initialTestimonials,
  initialContent,
}: {
  initialTestimonials: Testimonial[];
  initialContent?: TestimonialsPageContent | null;
}) {
  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<TestimonialsPageContent>("testimonials", {
    counts: { items: initialTestimonials.length },
  }, {
    initialData: initialContent,
  });
  const [activeCategory, setActiveCategory] = useState("all");

  const testimonials = useMemo(() => {
    return initialTestimonials.map((testimonial) => ({
      ...testimonial,
      category: (testimonial as { category?: string }).category ?? "all",
    }));
  }, [initialTestimonials]);

  /** Only show filters when at least one testimonial has a real category */
  const hasCategories = testimonials.some((t) => t.category !== "all");

  const filteredTestimonials = useMemo(() => {
    if (!hasCategories || activeCategory === "all") return testimonials;
    return testimonials.filter((testimonial) => testimonial.category === activeCategory);
  }, [activeCategory, hasCategories, testimonials]);

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

      {hasCategories ? (
        <section className="page-section-tight">
          <div className="container-max">
            <div className="site-panel p-6">
              <div className="muted-label">{content.filterLabel}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.filters.map((filter) => {
                  const Icon = filterIcons[filter.id as keyof typeof filterIcons] ?? MessageSquare;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveCategory(filter.id)}
                      className={cn(
                        "filter-chip inline-flex items-center gap-2",
                        activeCategory === filter.id && "filter-chip-active",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.sectionHeader.eyebrow}
            title={content.sectionHeader.title}
            description={content.sectionHeader.description}
          />

          {filteredTestimonials.length > 0 ? (
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {filteredTestimonials.map((testimonial) => (
                <InfoCard
                  key={testimonial.id}
                  eyebrow={`${testimonial.name} · ${testimonial.role}`}
                  title={testimonial.company}
                  description={testimonial.text}
                >
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, index) => (
                      <span
                        key={`${testimonial.id}-${index}`}
                        className="inline-flex h-2.5 w-2.5 rounded-full bg-primary-500"
                      />
                    ))}
                  </div>
                </InfoCard>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <InfoCard
                title={content.unavailable.title}
                description={content.unavailable.description}
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
