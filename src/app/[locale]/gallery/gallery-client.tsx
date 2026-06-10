"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, Sparkles, Users, UtensilsCrossed, X } from "lucide-react";
import type { GalleryItem } from "@/lib/cms-api";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero, SectionHeader } from "@/components/site/page-primitives";
import { type CmsCtaContent, type CmsHeroContent, type CmsSectionHeader, mapCmsActionVariant, useResolvedStructuredPageContent } from "@/lib/page-content";
import { cn } from "@/lib/utils";

const categoryIcons = {
  all: Camera,
  daily: UtensilsCrossed,
  events: Sparkles,
  team: Users,
} as const;

export interface GalleryPageContent {
  hero: CmsHeroContent;
  filterLabel: string;
  categories: Array<{ id: string; label: string }>;
  sectionHeader: CmsSectionHeader;
  unavailable: {
    title: string;
    description: string;
  };
  cta: CmsCtaContent;
}

export function GalleryClient({
  initialItems,
  initialContent,
}: {
  initialItems: GalleryItem[];
  initialContent?: GalleryPageContent | null;
}) {
  const categoriesCount = new Set(initialItems.map((item) => item.category).filter(Boolean)).size;
  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<GalleryPageContent>("gallery", {
    counts: {
      items: initialItems.length,
      categories: categoriesCount,
    },
  }, {
    initialData: initialContent,
  });
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const items = initialItems;

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  const activeItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

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
            <div className="muted-label">{content.filterLabel}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.categories.map((category) => {
                const Icon = categoryIcons[category.id as keyof typeof categoryIcons] ?? Camera;
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
      </section>

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.sectionHeader.eyebrow}
            title={content.sectionHeader.title}
            description={content.sectionHeader.description}
          />
          {filteredItems.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="site-panel overflow-hidden p-0 text-left"
                >
                  {item.image ? (
                    <div className="relative aspect-[4/3]">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-[linear-gradient(135deg,rgba(36,89,69,0.18),rgba(173,111,62,0.18))]">
                      <Camera className="h-12 w-12 text-text-secondary" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="muted-label">{item.category}</div>
                    <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-text-primary">
                      {item.title}
                    </div>
                  </div>
                </button>
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

      {activeItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4">
          <button
            type="button"
            className="absolute right-5 top-5 text-white/72"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-7 w-7" />
          </button>
          <button
            type="button"
            className="absolute left-5 top-1/2 -translate-y-1/2 text-white/72"
            onClick={() =>
              setLightboxIndex((current) =>
                current === null ? null : (current - 1 + filteredItems.length) % filteredItems.length,
              )
            }
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            type="button"
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/72"
            onClick={() =>
              setLightboxIndex((current) =>
                current === null ? null : (current + 1) % filteredItems.length,
              )
            }
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-[var(--color-surface-card)] shadow-[var(--shadow-modal)]">
            {activeItem.image ? (
              <div className="relative aspect-[16/10]">
                <Image src={activeItem.image} alt={activeItem.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-[linear-gradient(135deg,rgba(36,89,69,0.22),rgba(173,111,62,0.24))]">
                <Camera className="h-16 w-16 text-text-secondary" />
              </div>
            )}
            <div className="p-6">
              <div className="muted-label">{activeItem.category}</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-text-primary">
                {activeItem.title}
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
