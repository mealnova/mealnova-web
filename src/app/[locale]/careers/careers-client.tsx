"use client";

import { useState } from "react";
import {
  ChevronDown,
  GraduationCap,
  Heart,
  IndianRupee,
  Shield,
  UtensilsCrossed,
} from "lucide-react";
import type { CareerOpening } from "@/lib/api";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero, SectionHeader } from "@/components/site/page-primitives";
import { useBrandSettings } from "@/lib/hooks/use-content";
import { type CmsCardItem, type CmsCtaContent, type CmsHeroContent, type CmsSectionHeader, mapCmsActionVariant, useResolvedStructuredPageContent } from "@/lib/page-content";
import { cn } from "@/lib/utils";

const benefitIcons = [Shield, UtensilsCrossed, GraduationCap, Heart] as const;

/** Format enum like FULL_TIME → Full Time */
function formatEnum(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface CareersPageContent {
  hero: CmsHeroContent;
  benefitsHeader: CmsSectionHeader;
  benefits: CmsCardItem[];
  openingsHeader: CmsSectionHeader;
  unavailable: {
    title: string;
    description: string;
  };
  cta: CmsCtaContent;
}

export function CareersClient({
  initialOpenings,
  initialContent,
}: {
  initialOpenings: CareerOpening[];
  initialContent?: CareersPageContent | null;
}) {
  const { data: brand, isPending: brandPending } = useBrandSettings();
  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<CareersPageContent>("careers", {
    brand,
    counts: { items: initialOpenings.length },
  }, {
    initialData: initialContent,
  });
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const openings = initialOpenings;

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

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.benefitsHeader.eyebrow}
            title={content.benefitsHeader.title}
            description={content.benefitsHeader.description}
            align={content.benefitsHeader.align}
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {content.benefits.map((benefit, index) => (
              <InfoCard
                key={benefit.title}
                icon={benefitIcons[index] ?? Shield}
                title={benefit.title}
                description={benefit.description}
                eyebrow={content.benefitsHeader.eyebrow}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.openingsHeader.eyebrow}
            title={content.openingsHeader.title}
            description={content.openingsHeader.description}
          />
          {openings.length > 0 ? (
            <div className="mt-10 grid gap-4">
              {openings.map((opening, index) => {
                const isOpen = openIndex === index;

                return (
                  <div key={opening.id} className="site-panel overflow-hidden p-0">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <div>
                        <div className="muted-label">{opening.department}</div>
                        <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-text-primary">
                          {opening.title}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-text-secondary">
                          <span className="rounded-full border border-black/[0.06] bg-white/70 px-3 py-1">
                            {opening.location}
                          </span>
                          <span className="rounded-full border border-black/[0.06] bg-white/70 px-3 py-1">
                            {formatEnum(opening.employmentType)}
                          </span>
                          {opening.salaryRange ? (
                            <span className="rounded-full border border-black/[0.06] bg-white/70 px-3 py-1">
                              <IndianRupee className="mr-1 inline h-3 w-3" />
                              {opening.salaryRange}
                            </span>
                          ) : null}
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
                      <div className="border-t border-black/[0.06] px-6 py-5">
                        <p className="text-sm leading-7 text-text-secondary">{opening.description}</p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {opening.requirements.map((requirement) => (
                            <div
                              key={requirement}
                              className="rounded-2xl border border-black/[0.06] bg-white/76 px-4 py-3 text-sm font-semibold text-text-primary"
                            >
                              {requirement}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
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
