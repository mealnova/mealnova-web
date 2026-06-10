"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Leaf,
  Search,
  ShieldOff,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import type { MenuItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero, SectionHeader } from "@/components/site/page-primitives";
import { useMenuCategories, useMenuItems } from "@/lib/hooks/use-menu";
import { type CmsCtaContent, type CmsHeroContent, type CmsSectionHeader, type CmsUnavailableContent, mapCmsActionVariant, useResolvedStructuredPageContent } from "@/lib/page-content";
import { cn } from "@/lib/utils";

const ALLERGEN_COLORS: Record<string, string> = {
  Gluten: "bg-amber-100 text-amber-700",
  Milk: "bg-blue-100 text-blue-700",
  Egg: "bg-yellow-100 text-yellow-700",
  Peanuts: "bg-orange-100 text-orange-700",
  "Tree Nuts": "bg-orange-100 text-orange-700",
  Soybeans: "bg-green-100 text-green-700",
  Fish: "bg-cyan-100 text-cyan-700",
  Crustacean: "bg-red-100 text-red-700",
  Sulphites: "bg-purple-100 text-purple-700",
};

interface MenuPageContent {
  hero: CmsHeroContent;
  searchLabel: string;
  searchPlaceholder: string;
  dietaryLabel: string;
  dietaryFilters: string[];
  allergenLabel: string;
  allCategoryLabel: string;
  allergenFilters: Array<{ label: string; excludes: string[] }>;
  sectionHeader: CmsSectionHeader;
  emptyResults: CmsUnavailableContent;
  resetFiltersLabel: string;
  itemDescriptionFallback: string;
  itemEyebrowFallback: string;
  availableBadge: string;
  unavailable: CmsUnavailableContent;
  cta: CmsCtaContent;
}

function AllergenBadge({ allergen }: { allergen: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-tight",
        ALLERGEN_COLORS[allergen] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {allergen}
    </span>
  );
}

function NutritionToggle({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const hasNutrition = item.calories != null && item.calories > 0;

  if (!hasNutrition) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        Nutrition
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open ? (
        <div className="mt-2 rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
          <div className="font-semibold text-[var(--color-text-primary)]">
            {item.calories} kcal
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {item.protein != null ? <span>Protein: {item.protein}g</span> : null}
            {item.carbohydrates != null ? <span>Carbs: {item.carbohydrates}g</span> : null}
            {item.fat != null ? <span>Fat: {item.fat}g</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MenuPage() {
  const [activeCategorySlug, setActiveCategorySlug] = useState("all");
  const [activeDietary, setActiveDietary] = useState<string[]>([]);
  const [activeAllergenFilters, setActiveAllergenFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<MenuPageContent>("menu");
  const { data: categoriesData } = useMenuCategories();
  const { data: itemsData } = useMenuItems({
    pageSize: 200,
    search: searchQuery.trim() || undefined,
    isJain: activeDietary.includes("Jain") ? true : undefined,
    isVegan: activeDietary.includes("Vegan") ? true : undefined,
  });

  const categories = categoriesData ?? [];
  const menuItems = itemsData?.data ?? [];

  const filteredItems = useMemo(() => {
    const excludedAllergens: string[] = [];
    for (const filterLabel of activeAllergenFilters) {
      const opt = content?.allergenFilters.find((option) => option.label === filterLabel);
      if (opt) {
        excludedAllergens.push(...opt.excludes);
      }
    }

    return menuItems.filter((item) => {
      const matchesCategory =
        activeCategorySlug === "all" || item.category?.slug === activeCategorySlug;
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const passesAllergenFilter =
        excludedAllergens.length === 0 ||
        !item.allergens?.some((allergen) => excludedAllergens.includes(allergen));

      return matchesCategory && matchesSearch && passesAllergenFilter;
    });
  }, [activeAllergenFilters, activeCategorySlug, content?.allergenFilters, menuItems, searchQuery]);

  const toggleDietary = (tag: string) => {
    setActiveDietary((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  };

  const toggleAllergenFilter = (label: string) => {
    setActiveAllergenFilters((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

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
        }))}
        metrics={content.hero.metrics?.map((metric) => ({
          ...metric,
          value: metric.value.replace("{{counts.items}}", String(menuItems.length)),
        }))}
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
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
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
                <div className="muted-label">{content.dietaryLabel}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {content.dietaryFilters.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietary(tag)}
                      className={cn(
                        "filter-chip inline-flex items-center gap-2",
                        activeDietary.includes(tag) && "filter-chip-active",
                      )}
                    >
                      <Leaf className="h-3.5 w-3.5" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-black/[0.06] pt-6">
              <div className="muted-label">{content.allergenLabel}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.allergenFilters.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => toggleAllergenFilter(option.label)}
                    className={cn(
                      "filter-chip inline-flex items-center gap-2",
                      activeAllergenFilters.includes(option.label) && "filter-chip-active",
                    )}
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-black/[0.06] pt-6">
              <div className="muted-label">Categories</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategorySlug("all")}
                  className={cn(
                    "filter-chip",
                    activeCategorySlug === "all" && "filter-chip-active",
                  )}
                >
                  {content.allCategoryLabel}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategorySlug(category.slug)}
                    className={cn(
                      "filter-chip",
                      activeCategorySlug === category.slug && "filter-chip-active",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
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

          {menuItems.length === 0 ? (
            <div className="mt-10">
              <InfoCard
                eyebrow={content.unavailable.eyebrow}
                title={content.unavailable.title}
                description={content.unavailable.description}
              />
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} content={content} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <InfoCard
                icon={Search}
                eyebrow={content.emptyResults.eyebrow}
                title={content.emptyResults.title}
                description={content.emptyResults.description}
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveCategorySlug("all");
                    setActiveDietary([]);
                    setActiveAllergenFilters([]);
                    setSearchQuery("");
                  }}
                >
                  {content.resetFiltersLabel}
                </Button>
              </InfoCard>
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

function MenuItemCard({
  item,
  content,
}: {
  item: MenuItem;
  content: MenuPageContent;
}) {
  const allergens = item.allergens?.filter(Boolean) ?? [];

  return (
    <InfoCard
      icon={item.spiceLevel > 1 ? Sparkles : UtensilsCrossed}
      title={item.name}
      description={item.description ?? content.itemDescriptionFallback}
      eyebrow={item.category?.name ?? content.itemEyebrowFallback}
    >
      <div className="flex flex-wrap gap-2">
        {item.isJain ? <Badge variant="jain">Jain</Badge> : null}
        {item.isVegan ? <Badge variant="vegan">Vegan</Badge> : null}
        {item.spiceLevel > 0 ? (
          <Badge variant="warning" className="inline-flex items-center gap-1">
            <Flame className="h-3 w-3" />
            Spice {item.spiceLevel}
          </Badge>
        ) : null}
      </div>

      {allergens.length > 0 ? (
        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Allergens
          </div>
          <div className="flex flex-wrap gap-1">
            {allergens.map((allergen) => (
              <AllergenBadge key={allergen} allergen={allergen} />
            ))}
          </div>
        </div>
      ) : null}

      <NutritionToggle item={item} />

      <div className="mt-6 border-t border-black/[0.06] pt-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-500)]/[0.08] px-3 py-1 text-xs font-semibold text-[var(--color-primary-600)]">
          <UtensilsCrossed className="h-3 w-3" />
          {content.availableBadge}
        </span>
      </div>
    </InfoCard>
  );
}
