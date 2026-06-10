"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero } from "@/components/site/page-primitives";
import {
  type CmsCtaContent,
  type CmsHeroContent,
  type CmsMetric,
  mapCmsActionVariant,
  useResolvedStructuredPageContent,
} from "@/lib/page-content";
import { getTodaysMenu, type MenuItem, type TodaysMenuResponse, type ApiResponse } from "@/lib/api";
import { useLocations } from "@/lib/hooks/use-locations";

interface DailyMenuPageContent {
  hero: CmsHeroContent;
  mealSlotNames?: Record<string, string>;
  cta: CmsCtaContent;
}

const MEAL_SLOT_ORDER = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"] as const;

const MEAL_SLOT_DEFAULTS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  SNACKS: "High Tea",
  DINNER: "Dinner",
};

const ACCESS_HIGHLIGHTS = [
  {
    icon: LockKeyhole,
    title: "Approved-client access",
    description:
      "Daily ordering opens only after the onboarding review is approved and an access link is issued.",
  },
  {
    icon: MapPin,
    title: "Location-specific menus",
    description:
      "Clients see the menu tied to their supported service locations instead of one public catch-all schedule.",
  },
  {
    icon: ShieldCheck,
    title: "Operational control",
    description:
      "Publishing, billing rules, and service restrictions stay aligned with the approved account setup.",
  },
];

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-[var(--color-primary-100)] bg-[var(--color-surface-card)] p-4">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-16 w-16 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
          <UtensilsCrossed className="h-6 w-6 text-[var(--color-primary-500)]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-[var(--color-text-primary)]">{item.name}</h4>
          {item.isJain && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Jain
            </span>
          )}
          {item.isVegan && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Vegan
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {item.description}
          </p>
        )}
        {item.price > 0 && (
          <p className="mt-1 text-sm font-semibold text-[var(--color-primary-600)]">
            ₹{item.price}
          </p>
        )}
      </div>
    </div>
  );
}

function MealSlotSection({
  slotName,
  items,
}: {
  slotName: string;
  items: MenuItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
        {slotName}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function DailyMenuPage() {
  const { data: locations, isPending: locPending } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const activeLocation = useMemo(() => {
    if (!locations?.length) return null;
    if (selectedLocationId) return locations.find((l) => l.id === selectedLocationId) ?? locations[0];
    return locations[0];
  }, [locations, selectedLocationId]);

  const locationId = activeLocation?.id ?? "";

  const { data: todaysMenuRes, isPending: menuPending } = useQuery<ApiResponse<TodaysMenuResponse | null>>({
    queryKey: ["menu", "today", locationId],
    queryFn: () => getTodaysMenu(locationId),
    enabled: !!locationId,
    staleTime: 2 * 60 * 1000,
  });

  const todaysMenu = todaysMenuRes?.data ?? null;
  const todayStr = formatDateLong(new Date());

  const templateContext = useMemo(
    () => ({
      location: { name: activeLocation?.name ?? "Select a location" },
      date: { long: todayStr },
    }),
    [activeLocation?.name, todayStr],
  );

  const { data: content, isPending: contentPending } =
    useResolvedStructuredPageContent<DailyMenuPageContent>("menu-daily", templateContext);

  const slotNames = content?.mealSlotNames ?? MEAL_SLOT_DEFAULTS;

  const groupedItems = useMemo(() => {
    if (!todaysMenu?.items?.length) return null;
    const groups: Record<string, MenuItem[]> = {};
    for (const entry of todaysMenu.items) {
      const slot = entry.mealSlot;
      if (!groups[slot]) groups[slot] = [];
      groups[slot].push(entry.menuItem);
    }
    return groups;
  }, [todaysMenu]);

  if (contentPending || locPending) {
    return <ContentLoading />;
  }

  if (!content) {
    return <ContentUnavailable />;
  }

  const hasMenu = groupedItems && Object.keys(groupedItems).length > 0;

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

      {/* Location selector + menu */}
      <section className="page-section-tight">
        <div className="container-max space-y-8">
          {/* Location picker */}
          {locations && locations.length > 1 && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[var(--color-primary-500)]" />
              <div className="relative">
                <select
                  value={locationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="appearance-none rounded-lg border border-[var(--color-primary-100)] bg-[var(--color-surface-card)] py-2 pl-3 pr-8 text-sm font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              </div>
            </div>
          )}

          {/* Menu items by slot */}
          {menuPending && locationId ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-500)]" />
            </div>
          ) : hasMenu ? (
            <div className="space-y-10">
              {MEAL_SLOT_ORDER.map((slot) => {
                const items = groupedItems[slot];
                if (!items?.length) return null;
                return (
                  <MealSlotSection
                    key={slot}
                    slotName={slotNames[slot] ?? MEAL_SLOT_DEFAULTS[slot] ?? slot}
                    items={items}
                  />
                );
              })}
            </div>
          ) : (
            /* No menu published yet — show gate content */
            <InfoCard
              eyebrow="Ordering gate"
              title="Daily menus unlock after client approval"
              description="Public visitors can browse the signature menu and start corporate onboarding. Approved clients receive a managed ordering link after review instead of a public daily-menu feed."
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/corporate">
                    Start onboarding
                    <CheckCircle2 className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/menu">Browse menu</Link>
                </Button>
              </div>
            </InfoCard>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {ACCESS_HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <InfoCard
                key={title}
                icon={Icon}
                title={title}
                description={description}
              />
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
