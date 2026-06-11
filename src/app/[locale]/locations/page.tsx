"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Clock3,
  MapPin,
  Navigation,
  PhoneCall,
  UtensilsCrossed,
} from "lucide-react";
import type { LocationType } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { InfoCard, PageCta, PageHero, SectionHeader } from "@/components/site/page-primitives";
import { useLocations } from "@/lib/hooks/use-locations";
import { type CmsCardItem, type CmsCtaContent, type CmsHeroContent, type CmsSectionHeader, useResolvedStructuredPageContent } from "@/lib/page-content";
import { cn } from "@/lib/utils";

interface LocationsPageContent {
  hero: CmsHeroContent;
  typeLabels: Record<string, string>;
  statusLabels: {
    active: string;
    inactive: string;
  };
  cardActions: {
    call: string;
    directions: string;
  };
  capacitySuffix: string;
  networkHeader: CmsSectionHeader;
  filterLabel: string;
  filters: Array<{ label: string; value: "all" | LocationType }>;
  advantageHeader: CmsSectionHeader;
  advantages: CmsCardItem[];
  emptyState: {
    title: string;
    description: string;
  };
  cta: CmsCtaContent;
}

function formatHours(openTime: string, closeTime: string) {
  const toDisplay = (value: string) => {
    const [hours, minutes] = value.split(":");
    const hourNumber = Number(hours);
    const suffix = hourNumber >= 12 ? "PM" : "AM";
    const displayHour = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
    return `${displayHour}:${minutes} ${suffix}`;
  };

  return `${toDisplay(openTime)} to ${toDisplay(closeTime)}`;
}

export default function LocationsPage() {
  const { data: locationsData } = useLocations();
  const locations = locationsData ?? [];
  const typeCount = new Set(locations.map((location) => location.type)).size;
  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<LocationsPageContent>("locations", {
    counts: { items: locations.length, types: typeCount },
  });
  const [activeFilter, setActiveFilter] = useState<"all" | LocationType>("all");

  const filteredLocations = useMemo(() => {
    if (activeFilter === "all") return locations;
    return locations.filter((location) => location.type === activeFilter);
  }, [activeFilter, locations]);

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
          variant: action.variant === "outline" ? "outline" : undefined,
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

      <section className="page-section">
        <div className="container-max">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <SectionHeader
                eyebrow={content.networkHeader.eyebrow}
                title={content.networkHeader.title}
                description={content.networkHeader.description}
              />
              <div className="site-panel mt-8 p-6">
                <div className="muted-label">{content.filterLabel}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {content.filters.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setActiveFilter(filter.value)}
                      className={cn(
                        "filter-chip",
                        activeFilter === filter.value && "filter-chip-active",
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredLocations.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredLocations.map((location) => (
                  <InfoCard
                    key={location.id}
                    icon={location.type === "CORPORATE_CAFETERIA" ? Building2 : UtensilsCrossed}
                    title={location.name}
                    description={`${location.address}, ${location.city} ${location.pincode}`}
                    eyebrow={content.typeLabels[location.type] ?? location.type}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-text-secondary">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-[var(--color-text-primary)]" />
                          {formatHours(location.openTime, location.closeTime)}
                        </span>
                        <Badge variant={location.isActive ? "success" : "outline"}>
                          {location.isActive ? content.statusLabels.active : content.statusLabels.inactive}
                        </Badge>
                      </div>
                      <div className="text-sm font-semibold text-text-primary">
                        {location.dailyCapacity}+ {content.capacitySuffix}
                      </div>
                      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                        {location.contactPhone ? (
                          <Button variant="outline" className="flex-1" asChild>
                            <a href={`tel:${location.contactPhone}`}>
                              <PhoneCall className="h-4 w-4" />
                              {content.cardActions.call}
                            </a>
                          </Button>
                        ) : null}
                        {location.latitude && location.longitude ? (
                          <Button className="flex-1" asChild>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Navigation className="h-4 w-4" />
                              {content.cardActions.directions}
                            </a>
                          </Button>
                        ) : location.address ? (
                          <Button className="flex-1" asChild>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.address}, ${location.city}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Navigation className="h-4 w-4" />
                              {content.cardActions.directions}
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </InfoCard>
                ))}
              </div>
            ) : (
              <div className="mt-8 lg:mt-0">
                <InfoCard
                  title={content.emptyState.title}
                  description={content.emptyState.description}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.advantageHeader.eyebrow}
            title={content.advantageHeader.title}
            description={content.advantageHeader.description}
            align={content.advantageHeader.align}
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {content.advantages.map((item, index) => (
              <InfoCard
                key={item.title}
                icon={[MapPin, Clock3, Building2][index] ?? Building2}
                title={item.title}
                description={item.description}
                eyebrow={content.advantageHeader.eyebrow}
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
          variant: action.variant === "outline" ? "outline" : undefined,
        }))}
      />
    </>
  );
}
