"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChefHat, Star, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { PageHero, SectionHeader, PageCta } from "@/components/site/page-primitives";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";
import { type CmsCtaContent, type CmsHeroContent, type CmsSectionHeader, mapCmsActionVariant, useResolvedStructuredPageContent } from "@/lib/page-content";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types — matches the NestJS MealPackage response
// ---------------------------------------------------------------------------

interface PackageItem {
  id: string;
  menuItemId: string;
  quantity: number;
  sortOrder: number;
  menuItem: {
    id: string;
    name: string;
    price: number;
    categoryId: string;
    imageUrl?: string | null;
    isJain?: boolean;
    isVegan?: boolean;
  };
}

interface MealPackage {
  id: string;
  name: string;
  nameHi?: string | null;
  nameMr?: string | null;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  mealSlot?: string | null;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  items: PackageItem[];
  calculatedPrice: number;
}

interface MealPackagesPageContent {
  hero: CmsHeroContent;
  packagesHeader: CmsSectionHeader;
  emptyState: {
    title: string;
    description: string;
    action: { href: string; label: string };
  };
  howItWorksHeader: CmsSectionHeader;
  howItWorks: Array<{ step: string; title: string; description: string }>;
  cta: CmsCtaContent;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function mealSlotLabel(slot?: string | null): string {
  if (!slot) return "Any meal";
  const labels: Record<string, string> = {
    BREAKFAST: "Breakfast",
    LUNCH: "Lunch",
    SNACKS: "High Tea",
    DINNER: "Dinner",
  };
  return labels[slot] ?? slot;
}

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

function useMealPackages() {
  return useQuery<MealPackage[]>({
    queryKey: ["menu", "packages"],
    queryFn: async () => {
      try {
        const res = await apiFetch<ApiResponse<MealPackage[]> | MealPackage[]>("/menu/packages");
        const data = (res as ApiResponse<MealPackage[]>).data ?? (res as MealPackage[]);
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MealPackagesPage() {
  const { data: packages, isLoading } = useMealPackages();
  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<MealPackagesPageContent>("menu-packages");

  const hasPackages = packages && packages.length > 0;

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
        actions={(content.hero.actions ?? []).map((action) => ({
          href: action.href,
          label: action.label,
          variant: mapCmsActionVariant(action.variant),
          icon: <ArrowRight className="h-4 w-4" />,
        }))}
        metrics={content.hero.metrics}
      />

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.packagesHeader.eyebrow}
            title={content.packagesHeader.title}
            description={content.packagesHeader.description}
            align={content.packagesHeader.align}
          />

          {isLoading ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="site-panel animate-pulse p-6">
                  <div className="h-4 w-24 rounded bg-black/[0.06]" />
                  <div className="mt-4 h-6 w-48 rounded bg-black/[0.06]" />
                  <div className="mt-3 h-4 w-full rounded bg-black/[0.06]" />
                  <div className="mt-8 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 w-full rounded bg-black/[0.06]" />
                    ))}
                  </div>
                  <div className="mt-8 h-12 w-full rounded-full bg-black/[0.06]" />
                </div>
              ))}
            </div>
          ) : !hasPackages ? (
            <div className="site-panel mx-auto mt-12 flex max-w-lg flex-col items-center p-12 text-center">
              <Utensils className="h-12 w-12 text-text-muted" />
              <h3 className="text-h3 mt-4 text-text-primary">{content.emptyState.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">
                {content.emptyState.description}
              </p>
              <Button className="mt-6" asChild>
                <Link href={content.emptyState.action.href}>
                  {content.emptyState.action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="page-section bg-[var(--color-surface-card)]">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.howItWorksHeader.eyebrow}
            title={content.howItWorksHeader.title}
            align={content.howItWorksHeader.align}
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {content.howItWorks.map((item) => (
              <div key={item.step} className="site-panel p-6">
                <div className="text-3xl font-bold tracking-[-0.05em] text-text-primary">
                  {item.step}
                </div>
                <h3 className="text-h3 mt-3 text-text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{item.description}</p>
              </div>
            ))}
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

// ---------------------------------------------------------------------------
// Package Card
// ---------------------------------------------------------------------------

function PackageCard({ pkg }: { pkg: MealPackage }) {
  const itemCount = pkg.items.length;
  const hasJain = pkg.items.some((i) => i.menuItem.isJain);
  const hasVegan = pkg.items.some((i) => i.menuItem.isVegan);

  return (
    <div
      className={cn(
        "site-panel flex h-full flex-col overflow-hidden",
        pkg.isPopular && "ring-2 ring-[var(--color-primary-500)]/20",
      )}
    >
      {/* Header */}
      <div className={cn("px-6 pt-6", pkg.isPopular && "pb-0")}>
        <div className="flex items-center gap-2">
          <Badge variant={pkg.isPopular ? "default" : "outline"}>
            {pkg.isPopular ? (
              <>
                <Star className="mr-1 h-3 w-3" />
                Popular
              </>
            ) : (
              mealSlotLabel(pkg.mealSlot)
            )}
          </Badge>
          {hasJain && <Badge variant="jain">Jain options</Badge>}
          {hasVegan && <Badge variant="vegan">Vegan</Badge>}
        </div>

        <h3 className="text-h3 mt-4 text-text-primary">{pkg.name}</h3>

        {pkg.description && (
          <p className="mt-2 text-sm leading-7 text-text-secondary">{pkg.description}</p>
        )}

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-text-primary">
            {formatCurrency(pkg.calculatedPrice)}
          </span>
          <span className="text-sm text-text-muted">/ plate</span>
        </div>
      </div>

      {/* Items list */}
      <div className="mt-4 flex-1 border-t border-black/[0.04] px-6 py-4">
        <div className="muted-label mb-3">
          Includes {itemCount} item{itemCount !== 1 ? "s" : ""}
        </div>
        <div className="space-y-2.5">
          {pkg.items.map((pi) => (
            <div key={pi.id} className="flex items-center gap-2">
              <ChefHat className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
              <span className="text-sm text-text-primary">{pi.menuItem.name}</span>
              {pi.quantity > 1 && (
                <span className="text-xs text-text-muted">x{pi.quantity}</span>
              )}
              {pi.menuItem.isJain && (
                <Badge variant="jain" className="px-1.5 py-0 text-[9px]">
                  J
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-black/[0.04] px-6 py-4">
        <Button className="w-full" variant={pkg.isPopular ? "primary" : "outline"} asChild>
          <Link href="/corporate">
            Request this package
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
