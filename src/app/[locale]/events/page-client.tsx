"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  Cake,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Minus,
  PartyPopper,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import type { MenuCategory, MenuItem } from "@/lib/api";
import type { GalleryItem } from "@/lib/cms-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroDevicePlayer } from "@/components/ui/hero-device-assemble";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import { ActionButton, InfoCard, PageCta, SectionHeader } from "@/components/site/page-primitives";
import { getApiErrorMessage, submitEventInquiry } from "@/lib/api";
import { useCuisineOptions, useEventTypes, useGalleryItems, usePricingTiers } from "@/lib/hooks/use-content";
import { useLiveMenuCategories, useLiveMenuItems } from "@/lib/hooks/use-menu";
import {
  type CmsCtaContent,
  type CmsHeroContent,
  type CmsSectionHeader,
  mapCmsActionVariant,
  useResolvedStructuredPageContent,
} from "@/lib/page-content";

const eventIcons: Record<string, typeof Heart> = {
  wedding: Heart,
  corporate: Building2,
  birthday: Cake,
  anniversary: Cake,
  festival: Sparkles,
};

const DEFAULT_EVENT_STEPS = [
  "Event details",
  "Menu preferences",
  "Review",
  "Submitted",
];
const EVENT_SEARCH_FAQS = [
  {
    icon: Sparkles,
    title: "Do you provide event catering services in Pune for weddings and corporate events?",
    description:
      "Yes. We cater pure vegetarian weddings, receptions, corporate events, conferences, launches, society functions, and family celebrations across Pune.",
  },
  {
    icon: CalendarDays,
    title: "Can I share event details online before speaking to the team?",
    description:
      "Yes. Share the guest count, date, venue, and menu preferences so our first call can focus on availability, service style, and the right menu plan.",
  },
  {
    icon: Building2,
    title: "Does the site support vegetarian buffet planning for Pune events?",
    description:
      "Yes. We plan vegetarian buffet service, live counters, Jain-friendly options, staff flow, and timing for Pune events and workplace celebrations.",
  },
] as const;
const EVENT_GST_RATE = 0.18;
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export interface EventsPageContent {
  hero: CmsHeroContent;
  formats: {
    header: CmsSectionHeader;
    emptyState?: {
      title: string;
      description: string;
    };
  };
  cuisines: {
    header: CmsSectionHeader;
    liveCountersEyebrow: string;
    emptyState?: {
      title: string;
      description: string;
    };
  };
  pricing: {
    header: CmsSectionHeader;
    emptyState?: {
      title: string;
      description: string;
    };
  };
  inquiry: {
    eyebrow: string;
    title: string;
    description: string;
    detailsTitle: string;
    detailsDescription: string;
    menuTitle: string;
    menuDescription: string;
    reviewTitle: string;
    reviewDescription: string;
    summaryTitle: string;
    summaryDescription: string;
    successMessage: string;
    steps: string[];
    searchPlaceholder: string;
    allCategoryLabel: string;
    minGuestHint: string;
    emptySelectionTitle: string;
    emptySelectionDescription: string;
    emptyMenuTitle: string;
    emptyMenuDescription: string;
    nextLabel: string;
    backLabel: string;
    submitLabel: string;
    submittingLabel: string;
    fields: {
      name: string;
      email: string;
      phone: string;
      eventType: string;
      guestCount: string;
      eventDate: string;
      venueAddress: string;
      notes: string;
    };
    labels: {
      guestCount: string;
      selectedItems: string;
      quantityPerPlate: string;
      perPlate: string;
      subtotal: string;
      gst: string;
      estimatedTotal: string;
    };
  };
  included: {
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
  };
  cta: CmsCtaContent;
}

interface PricingCardTier {
  id: string | number;
  name: string;
  description?: string;
  price?: string | number;
  features: string[];
  isPopular?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

interface EventFormState {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  venueAddress: string;
  guestCount: string;
  notes: string;
}

interface HeroGalleryImage {
  id: string;
  title: string;
  category: string;
  src: string;
  isFeatured: boolean;
}

function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(Number.isFinite(value) ? value : 0);
}

function getEffectiveMenuItemPrice(item: MenuItem, guestCount: number) {
  let effectivePrice = item.price;

  for (const slab of item.pricingSlabs ?? []) {
    if (guestCount >= slab.fromQty && (slab.toQty === null || guestCount <= slab.toQty)) {
      effectivePrice = slab.price;
      break;
    }
  }

  return effectivePrice;
}

function normalizeHeroGalleryImage(image: string | undefined) {
  const trimmed = image?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return null;
}

function heroGalleryPriority(category: string) {
  const normalized = category.trim().toLowerCase();
  if (normalized === "food") return 0;
  if (normalized === "events") return 1;
  if (normalized === "daily-meals") return 2;
  if (normalized === "facilities") return 3;
  return 4;
}

function selectHeroGalleryImages(items: GalleryItem[]): HeroGalleryImage[] {
  return items
    .map((item) => {
      const src = normalizeHeroGalleryImage(item.image);
      if (!src) return null;
      return {
        id: item.id,
        title: item.title,
        category: item.category,
        src,
        isFeatured: item.isFeatured,
      } satisfies HeroGalleryImage;
    })
    .filter((item): item is HeroGalleryImage => item !== null)
    .sort((left, right) => {
      const featuredDelta = Number(right.isFeatured) - Number(left.isFeatured);
      if (featuredDelta !== 0) return featuredDelta;

      const categoryDelta = heroGalleryPriority(left.category) - heroGalleryPriority(right.category);
      if (categoryDelta !== 0) return categoryDelta;

      return left.title.localeCompare(right.title);
    })
    .slice(0, 2);
}

function FlowSteps({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="mb-10 flex items-center justify-between">
      {steps.map((label, index) => (
        <div key={`${label}-${index}`} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                index < current
                  ? "bg-[var(--color-primary-500)] text-white"
                  : index === current
                    ? "bg-[var(--color-secondary-500)] text-white"
                    : "border border-white/15 bg-white/5 text-white/65"
              }`}
            >
              {index < current ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={`mt-1 hidden text-[10px] font-medium sm:block ${
                index === current ? "text-[var(--color-secondary-500)]" : "text-white/55"
              }`}
            >
              {label}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <div
              className={`mx-1 mb-4 h-0.5 w-8 sm:w-16 ${
                index < current ? "bg-[var(--color-primary-500)]" : "bg-white/12"
              }`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function EventSummaryCard({
  content,
  guestCount,
  selectedItems,
  quantities,
  perPlatePrice,
  subtotal,
  gstAmount,
  estimatedTotal,
}: {
  content: EventsPageContent["inquiry"];
  guestCount: number;
  selectedItems: MenuItem[];
  quantities: Record<string, number>;
  perPlatePrice: number;
  subtotal: number;
  gstAmount: number;
  estimatedTotal: number;
}) {
  return (
    <InfoCard
      eyebrow={content.summaryTitle}
      title={content.labels.estimatedTotal}
      description={content.summaryDescription}
    >
      <div className="grid gap-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white/76 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            {content.labels.guestCount}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-text-primary">
            {guestCount > 0 ? guestCount : "—"}
          </div>
        </div>

        {selectedItems.length > 0 ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white/76 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
              {content.labels.selectedItems}
            </div>
            <div className="mt-3 space-y-3">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <div className="font-semibold text-text-primary">{item.name}</div>
                    <div className="text-text-secondary">
                      {item.category?.name ?? "Menu selection"}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-text-primary">
                    {quantities[item.id] ?? 0}x
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white/60 px-4 py-5 text-sm text-text-secondary">
            <div className="font-semibold text-text-primary">{content.emptySelectionTitle}</div>
            <div className="mt-2">{content.emptySelectionDescription}</div>
          </div>
        )}

        <div className="rounded-2xl border border-black/[0.06] bg-white/76 px-4 py-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 text-text-secondary">
              <span>{content.labels.perPlate}</span>
              <span className="font-semibold text-text-primary">{formatCurrency(perPlatePrice)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-text-secondary">
              <span>{content.labels.subtotal}</span>
              <span className="font-semibold text-text-primary">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-text-secondary">
              <span>{content.labels.gst}</span>
              <span className="font-semibold text-text-primary">{formatCurrency(gstAmount)}</span>
            </div>
            <div className="border-t border-black/[0.06] pt-3 text-base font-semibold text-text-primary">
              <div className="flex items-center justify-between gap-3">
                <span>{content.labels.estimatedTotal}</span>
                <span>{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InfoCard>
  );
}

function eventMetricValueClass(value: string) {
  if (value.length > 18) {
    return "text-[clamp(1rem,1.55vw,1.35rem)] break-words leading-tight";
  }

  if (value.length > 10) {
    return "text-[clamp(1.15rem,1.8vw,1.65rem)] break-words leading-tight";
  }

  return "text-[2rem]";
}

function EventMobilePlannerPreview({
  badges,
  metrics,
  subtitle,
  title,
}: {
  badges: string[];
  metrics?: EventsPageContent["hero"]["metrics"];
  subtitle: string;
  title: string;
}) {
  return (
    <div className="min-h-[22rem] bg-[var(--color-surface-dark)] p-5 text-white">
      <div className="muted-label text-[var(--color-secondary-500)]">{title}</div>
      <p className="mt-4 text-sm leading-7 text-white/62">{subtitle}</p>

      {metrics?.length ? (
        <div className="mt-5 grid gap-3">
          {metrics.slice(0, 3).map((metric) => (
            <div
              key={`${metric.label}-${metric.value}`}
              className="rounded-lg border border-white/10 bg-white/8 px-4 py-3"
            >
              <div className="text-lg font-bold tracking-[-0.04em] text-white">
                {metric.value}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {badges.length ? (
        <div className="mt-5 space-y-2">
          {badges.slice(0, 4).map((badge) => (
            <div
              key={badge}
              className="rounded-lg border border-white/10 bg-white/7 px-4 py-3 text-sm font-semibold text-white/78"
            >
              {badge}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EventsHeroGalleryPreview({
  badges,
  eyebrow,
  images,
  metrics,
  subtitle,
  title,
}: {
  badges: string[];
  eyebrow: string;
  images: HeroGalleryImage[];
  metrics?: EventsPageContent["hero"]["metrics"];
  subtitle: string;
  title: string;
}) {
  const primaryImage = images[0];
  const secondaryImage = images[1];
  const previewMetrics = metrics?.slice(0, 2) ?? [];

  if (!primaryImage) {
    return (
      <EventMobilePlannerPreview
        badges={badges}
        metrics={metrics}
        subtitle={subtitle}
        title={title}
      />
    );
  }

  return (
    <div className="grid min-h-[24rem] gap-4 bg-[var(--color-surface-dark)] p-4 text-white sm:min-h-[30rem] sm:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.8fr)] sm:p-6">
      <div className="relative min-h-[18rem] overflow-hidden rounded-lg border border-white/10">
        <Image
          src={primaryImage.src}
          alt={primaryImage.title || title}
          fill
          sizes="(max-width: 640px) 100vw, 62vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            {primaryImage.category}
          </div>
          <div className="mt-2 max-w-xl text-[clamp(1.4rem,2.8vw,2.4rem)] font-semibold leading-tight tracking-[-0.04em] text-white">
            {primaryImage.title || title}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {secondaryImage ? (
          <div className="relative min-h-[10rem] overflow-hidden rounded-lg border border-white/10">
            <Image
              src={secondaryImage.src}
              alt={secondaryImage.title || title}
              fill
              sizes="(max-width: 640px) 100vw, 28vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                {secondaryImage.category}
              </div>
              <div className="mt-2 text-base font-semibold leading-tight tracking-[-0.03em] text-white">
                {secondaryImage.title || title}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/48">
            {eyebrow}
          </div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">{title}</div>
          <p className="mt-3 text-sm leading-6 text-white/68">{subtitle}</p>

          {previewMetrics.length ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {previewMetrics.map((metric) => (
                <div
                  key={`${metric.label}-${metric.value}`}
                  className="rounded-lg border border-white/10 bg-white/6 px-3 py-3"
                >
                  <div className="text-base font-semibold tracking-[-0.03em] text-white">
                    {metric.value}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {badges.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.slice(0, 3).map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-white/10 bg-white/7 px-3 py-2 text-xs font-semibold text-white/78"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EventsExperienceHero({
  content,
  heroGalleryImages,
}: {
  content: EventsPageContent;
  heroGalleryImages: HeroGalleryImage[];
}) {
  const actions = (content.hero.actions ?? []).map((action) => ({
    href: action.href,
    icon: <ArrowRight className="h-4 w-4" />,
    label: action.label,
    variant: mapCmsActionVariant(action.variant),
  }));
  const planningItems =
    content.hero.aside?.badges?.length
      ? content.hero.aside.badges
      : content.included.items;
  const deviceBadges =
    planningItems.length > 0
      ? planningItems
      : [
          content.formats.header.title,
          content.cuisines.header.title,
          content.inquiry.menuTitle,
          content.inquiry.reviewTitle,
        ];

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-warm)] px-4 py-[clamp(5rem,8vw,7rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[10%] top-28 h-64 w-64 rounded-full bg-[var(--color-secondary-500)]/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 right-[8%] h-80 w-80 rounded-full bg-[var(--color-primary-500)]/5 blur-3xl"
      />

      <div className="container-max relative z-10">
        <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center text-center">
          <span className="eyebrow justify-center">
            <Sparkles className="h-4 w-4" />
            {content.hero.eyebrow}
          </span>
          <h1 className="mt-4 max-w-[20rem] break-words font-display text-[clamp(1.85rem,9vw,5rem)] font-normal leading-none tracking-[-0.02em] text-[var(--color-text-primary)] sm:max-w-full">
            {content.hero.title}
          </h1>
          <div className="mt-6 h-[3px] w-24 rounded-full bg-[var(--color-secondary-500)]" />
          <p className="body-large mt-8 max-w-[20rem] text-pretty text-center sm:max-w-2xl">
            {content.hero.description}
          </p>

          {actions.length ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              {actions.map((action) => (
                <ActionButton key={action.href + action.label} action={action} />
              ))}
            </div>
          ) : null}
        </div>

        {content.hero.metrics?.length ? (
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {content.hero.metrics.map((metric) => (
              <div
                key={`${metric.label}-${metric.value}`}
                className="rounded-lg border border-[rgba(15,23,42,0.08)] bg-white/55 px-4 py-4 text-center shadow-sm backdrop-blur"
              >
                <div
                  className={`${eventMetricValueClass(metric.value)} mx-auto max-w-full font-bold tracking-[-0.04em] text-[var(--color-text-primary)]`}
                >
                  {metric.value}
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mx-auto mt-12 w-full max-w-6xl">
          <div className="relative">
            <div className="absolute -left-8 top-1/3 h-36 w-36 rounded-full bg-[var(--color-secondary-500)]/10 blur-sm" />
            <div className="absolute -right-8 top-16 h-40 w-40 rounded-full bg-[var(--color-primary-500)]/10 blur-sm" />
            <div className="relative overflow-hidden rounded-lg border-[10px] border-[var(--color-primary-100)] bg-[var(--color-surface-dark)] shadow-[0_34px_90px_-50px_rgba(16,24,25,0.85)]">
              {heroGalleryImages.length > 0 ? (
                <EventsHeroGalleryPreview
                  badges={deviceBadges}
                  eyebrow={content.hero.eyebrow}
                  images={heroGalleryImages}
                  metrics={content.hero.metrics}
                  subtitle={content.inquiry.reviewDescription}
                  title={content.hero.aside?.title ?? content.inquiry.title}
                />
              ) : (
                <>
                  <div className="relative hidden aspect-[16/9] sm:block">
                    <HeroDevicePlayer
                      accentColor="var(--color-secondary-500)"
                      badges={deviceBadges}
                      brandLabel={content.hero.eyebrow}
                      metrics={content.hero.metrics?.slice(0, 3)}
                      subtitle={content.inquiry.reviewDescription}
                      title={content.hero.aside?.title ?? content.inquiry.title}
                    />
                  </div>
                  <div className="sm:hidden">
                    <EventMobilePlannerPreview
                      badges={deviceBadges}
                      metrics={content.hero.metrics}
                      subtitle={content.inquiry.reviewDescription}
                      title={content.hero.aside?.title ?? content.inquiry.title}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function EventsPage({
  locale = "en",
  initialContent,
  initialHeroGalleryItems = [],
}: {
  locale?: string;
  initialContent?: EventsPageContent | null;
  initialHeroGalleryItems?: GalleryItem[];
}) {
  const { data: eventTypesData } = useEventTypes();
  const { data: cuisinesData } = useCuisineOptions();
  const { data: galleryItemsData } = useGalleryItems(undefined, initialHeroGalleryItems);
  const { data: pricingData } = usePricingTiers("event");
  const { data: liveMenuCategories } = useLiveMenuCategories();
  const { data: liveMenuItemsData, isLoading: menuLoading } = useLiveMenuItems({ pageSize: 200 });
  const { data: content, isPending: contentPending } =
    useResolvedStructuredPageContent<EventsPageContent>("events", undefined, {
      initialData: initialContent ?? undefined,
    });

  const [formData, setFormData] = useState<EventFormState>({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    venueAddress: "",
    guestCount: "",
    notes: "",
  });
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const eventTypes = eventTypesData ?? [];
  const cuisines = cuisinesData ?? [];
  const heroGalleryImages = useMemo(
    () => selectHeroGalleryImages(galleryItemsData ?? []),
    [galleryItemsData],
  );
  const pricing = pricingData ?? [];
  const liveCounters = useMemo(
    () => cuisines.filter((item) => item.isLiveCounter),
    [cuisines],
  );
  const menuItems = useMemo(() => liveMenuItemsData?.data ?? [], [liveMenuItemsData]);

  const categories = useMemo(() => {
    if ((liveMenuCategories ?? []).length > 0) {
      return [...(liveMenuCategories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    }

    const derived = new Map<string, MenuCategory>();
    for (const item of menuItems) {
      if (item.category?.id && !derived.has(item.category.id)) {
        derived.set(item.category.id, item.category);
      }
    }

    return Array.from(derived.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [liveMenuCategories, menuItems]);

  const filteredMenuItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return menuItems.filter((item) => {
      if (!item.isAvailable) return false;
      if (categoryFilter !== "all" && item.category?.id !== categoryFilter) return false;
      if (!normalizedSearch) return true;

      const haystack = [item.name, item.description, item.category?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [categoryFilter, menuItems, searchQuery]);

  const selectedItems = useMemo(
    () =>
      menuItems
        .filter((item) => (selectedQuantities[item.id] ?? 0) > 0)
        .sort((left, right) => left.name.localeCompare(right.name)),
    [menuItems, selectedQuantities],
  );

  const guestCount = Number(formData.guestCount) || 0;
  const perPlatePrice = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const quantity = selectedQuantities[item.id] ?? 0;
        return sum + getEffectiveMenuItemPrice(item, guestCount) * quantity;
      }, 0),
    [guestCount, selectedItems, selectedQuantities],
  );
  const subtotal = guestCount * perPlatePrice;
  const gstAmount = Math.round(subtotal * EVENT_GST_RATE * 100) / 100;
  const estimatedTotal = subtotal + gstAmount;
  const flowSteps = content?.inquiry.steps?.length
    ? content.inquiry.steps
    : DEFAULT_EVENT_STEPS;

  function updateField<Key extends keyof EventFormState>(key: Key, value: EventFormState[Key]) {
    setSubmitError(null);
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function updateQuantity(menuItemId: string, delta: number) {
    setSubmitError(null);
    setSelectedQuantities((current) => {
      const nextQuantity = Math.max(0, (current[menuItemId] ?? 0) + delta);
      const next = { ...current };

      if (nextQuantity === 0) {
        delete next[menuItemId];
      } else {
        next[menuItemId] = nextQuantity;
      }

      return next;
    });
  }

  function validateDetails() {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.eventType.trim() ||
      !formData.eventDate.trim() ||
      !formData.venueAddress.trim()
    ) {
      setSubmitError("Complete the event basics before choosing menu preferences.");
      return false;
    }

    if (guestCount < 25) {
      setSubmitError(content?.inquiry.minGuestHint ?? "Event requests start at 25 guests.");
      return false;
    }

    return true;
  }

  function nextStep() {
    if (!content) return;

    if (step === 0 && !validateDetails()) {
      return;
    }

    if (step === 1 && selectedItems.length === 0) {
      setSubmitError(content.inquiry.emptySelectionDescription);
      return;
    }

    setSubmitError(null);
    setStep((current) => Math.min(current + 1, flowSteps.length - 1));
  }

  function previousStep() {
    setSubmitError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleEventSubmit() {
    if (!content) return;
    if (!validateDetails()) return;
    if (selectedItems.length === 0) {
      setSubmitError(content.inquiry.emptySelectionDescription);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const quoteSnapshot = [
        formData.notes.trim(),
        `Event estimate: ${guestCount} guests, ${selectedItems.length} menu preferences, ${formatCurrency(perPlatePrice)} per plate, estimated ${formatCurrency(estimatedTotal)} including GST.`,
      ]
        .filter(Boolean)
        .join("\n\n");

      await submitEventInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        eventType: formData.eventType.trim(),
        eventDate: formData.eventDate,
        venueAddress: formData.venueAddress.trim(),
        guestCount,
        message: quoteSnapshot,
        items: selectedItems.map((item) => ({
          menuItemId: item.id,
          quantityPerPlate: selectedQuantities[item.id] ?? 1,
        })),
      });

      setSubmitted(true);
      setStep(flowSteps.length - 1);
      setFormData({
        name: "",
        email: "",
        phone: "",
        eventType: "",
        eventDate: "",
        venueAddress: "",
        guestCount: "",
        notes: "",
      });
      setSelectedQuantities({});
      setSearchQuery("");
      setCategoryFilter("all");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Failed to submit the event inquiry."));
    } finally {
      setSubmitting(false);
    }
  }

  if (contentPending) {
    return <ContentLoading />;
  }

  if (!content) {
    return <ContentUnavailable />;
  }

  return (
    <>
      <EventsExperienceHero content={content} heroGalleryImages={heroGalleryImages} />

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.formats.header.eyebrow}
            title={content.formats.header.title}
            description={content.formats.header.description}
            align={content.formats.header.align}
          />
          {eventTypes.length > 0 ? (
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {eventTypes.map((event) => {
                const key = event.name.toLowerCase();
                const Icon =
                  Object.entries(eventIcons).find(([needle]) => key.includes(needle))?.[1] ??
                  PartyPopper;

                return (
                  <InfoCard
                    key={event.id}
                    icon={Icon}
                    title={event.name}
                    description={event.description}
                    eyebrow={event.priceRange ?? content.formats.header.eyebrow}
                  >
                    <div className="mt-2 text-sm font-semibold text-text-primary">
                      {event.minGuests ?? 25} to {event.maxGuests ?? 5000}+ guests
                    </div>
                  </InfoCard>
                );
              })}
            </div>
          ) : content.formats.emptyState ? (
            <div className="mt-12">
              <InfoCard
                title={content.formats.emptyState.title}
                description={content.formats.emptyState.description}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="page-section">
        <div className="container-max">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <SectionHeader
                eyebrow={content.cuisines.header.eyebrow}
                title={content.cuisines.header.title}
                description={content.cuisines.header.description}
              />
              {liveCounters.length > 0 ? (
                <div className="site-panel mt-8 p-6">
                  <div className="muted-label">{content.cuisines.liveCountersEyebrow}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {liveCounters.map((counter) => (
                      <Badge key={counter.id} variant="secondary" className="px-4 py-2">
                        {counter.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {cuisines.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {cuisines.map((cuisine) => (
                  <InfoCard
                    key={cuisine.id}
                    icon={cuisine.isLiveCounter ? Sparkles : ChefHat}
                    title={cuisine.name}
                    description={cuisine.description ?? "Vegetarian event menu option."}
                    eyebrow={
                      cuisine.isLiveCounter
                        ? content.cuisines.liveCountersEyebrow
                        : content.cuisines.header.eyebrow
                    }
                  />
                ))}
              </div>
            ) : content.cuisines.emptyState ? (
              <div className="mt-8 lg:mt-0">
                <InfoCard
                  title={content.cuisines.emptyState.title}
                  description={content.cuisines.emptyState.description}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container-max">
          <SectionHeader
            eyebrow={content.pricing.header.eyebrow}
            title={content.pricing.header.title}
            description={content.pricing.header.description}
            align={content.pricing.header.align}
          />
          {pricing.length > 0 ? (
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {pricing.map((tier) => (
                <InfoCard
                  key={tier.id}
                  tone={tier.isPopular ? "dark" : "light"}
                  title={tier.name}
                  description={tier.description ?? "Custom event proposal."}
                  eyebrow={tier.isPopular ? "Recommended" : "Package"}
                >
                  <div
                    className={
                      tier.isPopular
                        ? "text-3xl font-bold tracking-[-0.05em] text-white"
                        : "text-3xl font-bold tracking-[-0.05em] text-text-primary"
                    }
                  >
                    {tier.price}
                  </div>
                  <div className="mt-5 space-y-3">
                    {tier.features.map((feature) => (
                      <div
                        key={feature}
                        className={
                          tier.isPopular
                            ? "text-sm leading-7 text-white/72"
                            : "text-sm leading-7 text-text-secondary"
                        }
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant={tier.isPopular ? "white" : "outline"}
                    className="mt-6 w-full"
                    asChild
                  >
                    <a href={tier.ctaLink ?? "#inquiry"}>
                      {tier.ctaText ?? "Plan an event"}
                    </a>
                  </Button>
                </InfoCard>
              ))}
            </div>
          ) : content.pricing.emptyState ? (
            <div className="mt-12">
              <InfoCard
                title={content.pricing.emptyState.title}
                description={content.pricing.emptyState.description}
              />
            </div>
          ) : null}
        </div>
      </section>

      {locale === "en" ? (
        <section className="page-section bg-[var(--color-surface-warm)]">
          <div className="container-max">
            <SectionHeader
              eyebrow="Event catering FAQ"
              title="What planners usually ask before choosing event catering in Pune"
              description="Get answers to common questions about vegetarian menus, pricing, guest capacity, and how to plan your next celebration."
              align="center"
            />
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {EVENT_SEARCH_FAQS.map((item) => (
                <InfoCard
                  key={item.title}
                  icon={item.icon}
                  eyebrow="Planner questions"
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="inquiry" className="page-section">
        <div className="container-max">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <InfoCard
              tone="dark"
              eyebrow={content.inquiry.eyebrow}
              title={content.inquiry.title}
              description={content.inquiry.description}
            >
              {!submitted ? (
                <>
                  <FlowSteps current={step} steps={flowSteps} />

                  {step === 0 ? (
                    <div className="space-y-6">
                      <div>
                        <div className="text-xl font-semibold tracking-[-0.03em] text-white">
                          {content.inquiry.detailsTitle}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/65">
                          {content.inquiry.detailsDescription}
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.inquiry.fields.name}
                          <input
                            className="input-shell"
                            placeholder={content.inquiry.fields.name}
                            required
                            value={formData.name}
                            onChange={(event) => updateField("name", event.target.value)}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.inquiry.fields.eventType}
                          <select
                            className="select-shell"
                            required
                            value={formData.eventType}
                            onChange={(event) => updateField("eventType", event.target.value)}
                          >
                            <option value="">{content.inquiry.fields.eventType}</option>
                            {eventTypes.map((event) => (
                              <option key={event.id} value={event.name}>
                                {event.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.inquiry.fields.email}
                          <input
                            className="input-shell"
                            placeholder={content.inquiry.fields.email}
                            type="email"
                            required
                            value={formData.email}
                            onChange={(event) => updateField("email", event.target.value)}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.inquiry.fields.phone}
                          <input
                            className="input-shell"
                            placeholder={content.inquiry.fields.phone}
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(event) => updateField("phone", event.target.value)}
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.inquiry.fields.guestCount}
                          <input
                            className="input-shell"
                            placeholder={content.inquiry.fields.guestCount}
                            type="number"
                            min="25"
                            required
                            value={formData.guestCount}
                            onChange={(event) => updateField("guestCount", event.target.value)}
                          />
                          <span className="text-xs font-normal text-white/45">
                            {content.inquiry.minGuestHint}
                          </span>
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-white">
                          {content.inquiry.fields.eventDate}
                          <input
                            className="input-shell"
                            type="date"
                            required
                            value={formData.eventDate}
                            onChange={(event) => updateField("eventDate", event.target.value)}
                          />
                        </label>
                      </div>

                      <label className="grid gap-2 text-sm font-medium text-white">
                        {content.inquiry.fields.venueAddress}
                        <input
                          className="input-shell"
                          placeholder={content.inquiry.fields.venueAddress}
                          required
                          value={formData.venueAddress}
                          onChange={(event) => updateField("venueAddress", event.target.value)}
                        />
                      </label>

                      <label className="grid gap-2 text-sm font-medium text-white">
                        {content.inquiry.fields.notes}
                        <textarea
                          className="textarea-shell"
                          placeholder={content.inquiry.fields.notes}
                          value={formData.notes}
                          onChange={(event) => updateField("notes", event.target.value)}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="space-y-6">
                      <div>
                        <div className="text-xl font-semibold tracking-[-0.03em] text-white">
                          {content.inquiry.menuTitle}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/65">
                          {content.inquiry.menuDescription}
                        </p>
                      </div>

                      <div className="grid gap-4">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                          <input
                            className="input-shell pl-11"
                            placeholder={content.inquiry.searchPlaceholder}
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={categoryFilter === "all" ? "white" : "ghost"}
                            onClick={() => setCategoryFilter("all")}
                          >
                            {content.inquiry.allCategoryLabel}
                          </Button>
                          {categories.map((category) => (
                            <Button
                              key={category.id}
                              type="button"
                              size="sm"
                              variant={categoryFilter === category.id ? "white" : "ghost"}
                              onClick={() => setCategoryFilter(category.id)}
                            >
                              {category.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {menuLoading ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-white/65">
                          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                          Loading live menu options...
                        </div>
                      ) : menuItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-5 py-10 text-center">
                          <div className="text-lg font-semibold text-white">
                            {content.inquiry.emptyMenuTitle}
                          </div>
                          <p className="mt-2 text-sm text-white/65">
                            {content.inquiry.emptyMenuDescription}
                          </p>
                        </div>
                      ) : filteredMenuItems.length > 0 ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                          {filteredMenuItems.map((item) => {
                            const quantity = selectedQuantities[item.id] ?? 0;
                            const effectivePrice = getEffectiveMenuItemPrice(item, guestCount);

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-white/10 bg-white/5 p-5"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                                      {item.category?.name ?? "Menu selection"}
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-white">
                                      {item.name}
                                    </div>
                                    <p className="mt-2 text-sm leading-7 text-white/65">
                                      {item.description ?? "Selected from the live daily catalog."}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                                      {content.inquiry.labels.perPlate}
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-white">
                                      {formatCurrency(effectivePrice)}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {item.isJain ? <Badge variant="jain">Jain</Badge> : null}
                                  {item.isVegan ? <Badge variant="vegan">Vegan</Badge> : null}
                                  {item.pricingSlabs?.length ? (
                                    <Badge variant="outline">Tiered pricing</Badge>
                                  ) : null}
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                                  <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                                      {content.inquiry.labels.quantityPerPlate}
                                    </div>
                                    <div className="mt-1 text-sm text-white/65">
                                      {quantity > 0
                                        ? `${quantity}x per guest`
                                        : "Not yet selected"}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => updateQuantity(item.id, -1)}
                                      disabled={quantity === 0}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <div className="min-w-10 text-center text-lg font-semibold text-white">
                                      {quantity}
                                    </div>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="white"
                                      onClick={() => updateQuantity(item.id, 1)}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-5 py-10 text-center">
                          <div className="text-lg font-semibold text-white">
                            {content.inquiry.emptySelectionTitle}
                          </div>
                          <p className="mt-2 text-sm text-white/65">
                            {content.inquiry.emptySelectionDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-6">
                      <div>
                        <div className="text-xl font-semibold tracking-[-0.03em] text-white">
                          {content.inquiry.reviewTitle}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/65">
                          {content.inquiry.reviewDescription}
                        </p>
                      </div>

                      <div className="grid gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                            Event brief
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="text-sm text-white/72">
                              <div className="font-semibold text-white">{formData.name}</div>
                              <div>{formData.email}</div>
                              <div>{formData.phone}</div>
                            </div>
                            <div className="text-sm text-white/72">
                              <div className="font-semibold text-white">{formData.eventType}</div>
                              <div>{guestCount} guests</div>
                              <div>{formData.eventDate}</div>
                            </div>
                          </div>
                          <div className="mt-4 text-sm text-white/72">
                            <span className="font-semibold text-white">Venue:</span>{" "}
                            {formData.venueAddress}
                          </div>
                          {formData.notes.trim() ? (
                            <div className="mt-4 text-sm leading-7 text-white/72">
                              <span className="font-semibold text-white">Notes:</span>{" "}
                              {formData.notes.trim()}
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                            {content.inquiry.labels.selectedItems}
                          </div>
                          <div className="mt-4 space-y-3">
                            {selectedItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start justify-between gap-3 text-sm text-white/72"
                              >
                                <div>
                                  <div className="font-semibold text-white">{item.name}</div>
                                  <div>{item.category?.name ?? "Menu selection"}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-white">
                                    {selectedQuantities[item.id] ?? 0}x
                                  </div>
                                  <div>{formatCurrency(getEffectiveMenuItemPrice(item, guestCount))}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {submitError ? <p className="text-sm text-red-300">{submitError}</p> : null}

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={previousStep}
                      disabled={step === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {content.inquiry.backLabel}
                    </Button>

                    {step < 2 ? (
                      <Button type="button" variant="white" onClick={nextStep}>
                        {content.inquiry.nextLabel}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="button" variant="white" disabled={submitting} onClick={handleEventSubmit}>
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {content.inquiry.submittingLabel}
                          </>
                        ) : (
                          <>
                            {content.inquiry.submitLabel}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <FlowSteps current={flowSteps.length - 1} steps={flowSteps} />
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-medium text-white">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{content.inquiry.successMessage}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 text-sm leading-7 text-white/72">
                    Your event details and menu preferences are saved. Our catering team can now
                    check availability, refine the menu, and follow up with the next steps.
                  </div>
                </div>
              )}
            </InfoCard>

            <div className="grid gap-6">
              <EventSummaryCard
                content={content.inquiry}
                guestCount={guestCount}
                selectedItems={selectedItems}
                quantities={selectedQuantities}
                perPlatePrice={perPlatePrice}
                subtotal={subtotal}
                gstAmount={gstAmount}
                estimatedTotal={estimatedTotal}
              />

              <InfoCard
                eyebrow={content.included.eyebrow}
                icon={CalendarDays}
                title={content.included.title}
                description={content.included.description}
              >
                <div className="space-y-3">
                  {content.included.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-black/[0.06] bg-white/76 px-4 py-3 text-sm font-semibold text-text-primary"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </InfoCard>
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
