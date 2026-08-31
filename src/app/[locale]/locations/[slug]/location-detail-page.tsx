"use client";

import { useLocationDetail } from "@/lib/hooks/use-locations";
import type { Location } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentLoading } from "@/components/site/content-loading";
import { ContentUnavailable } from "@/components/site/content-unavailable";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Users,
  Phone,
  Building2,
  ChevronLeft,
  ExternalLink,
  UtensilsCrossed,
} from "lucide-react";
import { type CmsCtaContent, useResolvedStructuredPageContent } from "@/lib/page-content";

type MenuAssignment = NonNullable<Location["menuAssignments"]>[number];

interface LocationDetailContent {
  typeLabels: Record<string, string>;
  loading: {
    eyebrow: string;
  };
  missing: {
    eyebrow: string;
    title: string;
    backLabel: string;
  };
  backLabel: string;
  status: {
    active: string;
    inactive: string;
    servingPrefix: string;
  };
  cards: {
    hoursLabel: string;
    hoursSuffix: string;
    capacityLabel: string;
    capacitySuffix: string;
    contactLabel: string;
    corporateLabel: string;
  };
  actions: {
    directionsLabel: string;
    orderLabel: string;
  };
  menuSection: {
    eyebrow: string;
    title: string;
  };
  cta: {
    eyebrow: string;
    title: string;
    primaryAction: CmsCtaContent["actions"][number];
    secondaryAction: CmsCtaContent["actions"][number];
  };
}

interface LocationDetailPageProps {
  slug: string;
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export function LocationDetailPage({ slug }: LocationDetailPageProps) {
  const { data: location, isLoading, isError } = useLocationDetail(slug);
  const { data: content, isPending: contentPending } = useResolvedStructuredPageContent<LocationDetailContent>("location-detail", {
    location,
  });

  if (contentPending) {
    return <ContentLoading />;
  }

  if (!content) {
    return <ContentUnavailable />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        <div className="page-section">
        <div className="container-max">
            <p className="eyebrow text-[var(--color-text-secondary)] mb-4">{content.loading.eyebrow}</p>
            <div className="skeleton h-14 w-3/4 rounded mb-6" />
            <div className="skeleton h-6 w-1/2 rounded mb-12" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !location) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <div className="container-max text-center py-24">
          <p className="eyebrow text-[var(--color-text-secondary)] mb-4">{content.missing.eyebrow}</p>
          <h1 className="section-title mb-6">{content.missing.title}</h1>
          <Link href="/locations">
            <Button variant="outline">← {content.missing.backLabel}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Group menu items by category
  const menuByCategory = (location.menuAssignments ?? []).reduce<
    Record<string, { category: { id: string; name: string; slug: string }; items: MenuAssignment[] }>
  >((acc, ma) => {
    const cat = ma.menuItem.category.name;
    if (!acc[cat]) acc[cat] = { category: ma.menuItem.category, items: [] };
    acc[cat].items.push(ma);
    return acc;
  }, {});

  const googleMapsUrl =
    location.latitude && location.longitude
      ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
      : `https://maps.google.com/?q=${encodeURIComponent(`${location.address}, ${location.city}`)}`;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface-dark)] py-16 md:py-24">
        <div className="container-max">
          {/* Back link */}
          <Link
            href="/locations"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {content.backLabel}
          </Link>

          {/* Eyebrow */}
          <p className="eyebrow text-white/50 mb-4">
            {content.typeLabels[location.type] ?? location.type}
          </p>

          {/* Title */}
          <h1 className="display-page text-white mb-6" style={{ maxWidth: "36rem" }}>
            {location.name}
          </h1>

          {/* Address */}
          <div className="flex items-start gap-3 text-white/70 mb-8">
            <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-[var(--dp-to)]" />
            <span className="text-lg">
              {location.address}, {location.city} {location.pincode}
            </span>
          </div>

          {/* Status + corporate badge */}
          <div className="flex flex-wrap gap-3">
            {location.isActive ? (
              <Badge variant="success">{content.status.active}</Badge>
            ) : (
              <Badge variant="default">{content.status.inactive}</Badge>
            )}
            {location.corporateAccount && (
              <Badge variant="default">
                {content.status.servingPrefix} {location.corporateAccount.companyName}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* ── Info Cards ────────────────────────────────────── */}
      <section className="page-section-tight">
        <div className="container-max">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Hours */}
            <div className="site-panel rounded-2xl p-6">
              <Clock className="h-7 w-7 text-[var(--color-primary-500)] mb-4" />
              <p className="muted-label mb-1">{content.cards.hoursLabel}</p>
              <p className="font-semibold text-[var(--color-text-primary)]">
                {formatTime(location.openTime)} – {formatTime(location.closeTime)}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{content.cards.hoursSuffix}</p>
            </div>

            {/* Capacity */}
            <div className="site-panel rounded-2xl p-6">
              <Users className="h-7 w-7 text-[var(--color-primary-500)] mb-4" />
              <p className="muted-label mb-1">{content.cards.capacityLabel}</p>
              <p className="font-semibold text-[var(--color-text-primary)]">
                {location.dailyCapacity}+ {content.cards.capacitySuffix}
              </p>
            </div>

            {/* Contact */}
            {location.contactPerson && (
              <div className="site-panel rounded-2xl p-6">
                <Phone className="h-7 w-7 text-[var(--color-primary-500)] mb-4" />
                <p className="muted-label mb-1">{content.cards.contactLabel}</p>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {location.contactPerson}
                </p>
                {location.contactPhone && (
                  <a
                    href={`tel:${location.contactPhone}`}
                    className="text-sm text-[var(--color-primary-500)] hover:underline mt-1 block"
                  >
                    {location.contactPhone}
                  </a>
                )}
              </div>
            )}

            {/* Corporate client */}
            {location.corporateAccount && (
              <div className="site-panel rounded-2xl p-6">
                <Building2 className="h-7 w-7 text-[var(--color-primary-500)] mb-4" />
                <p className="muted-label mb-1">{content.cards.corporateLabel}</p>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {location.corporateAccount.companyName}
                </p>
              </div>
            )}
          </div>

          {/* Google Maps CTA */}
          <div className="mt-6 flex flex-wrap gap-4">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {content.actions.directionsLabel}
              </Button>
            </a>
            <Link href="/corporate">
              <Button variant="primary" className="gap-2">
                {content.actions.orderLabel}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Menu Items ───────────────────────────────────── */}
      {Object.keys(menuByCategory).length > 0 && (
        <section className="page-section bg-[var(--color-surface-card)]">
          <div className="container-max">
            <div className="mb-12 text-center">
              <p className="eyebrow text-[var(--color-text-secondary)] mb-3">{content.menuSection.eyebrow}</p>
              <h2 className="section-title">{content.menuSection.title}</h2>
            </div>

            {Object.entries(menuByCategory).map(([catName, { items }]) => (
              <div key={catName} className="mb-12 last:mb-0">
                <div className="flex items-center gap-3 mb-6">
                  <UtensilsCrossed className="h-5 w-5 text-[var(--color-primary-500)]" />
                  <h3 className="text-h3">{catName}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.slice(0, 9).map((ma) => {
                    const item = ma.menuItem;
                    return (
                      <div key={item.id} className="site-panel rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="font-semibold text-[var(--color-text-primary)] leading-snug">
                            {item.name}
                          </h4>
                          <span className="shrink-0 font-bold text-[var(--color-primary-500)]">
                            ₹{item.price}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {item.isVegan && <Badge variant="vegan">Vegan</Badge>}
                          {item.isJain && <Badge variant="jain">Jain</Badge>}
                          {!item.isVegan && !item.isJain && (
                            <Badge variant="success">Veg</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="page-section bg-[var(--color-surface-dark)]">
        <div className="container-max text-center">
          <p className="eyebrow text-white/50 mb-4">{content.cta.eyebrow}</p>
          <h2 className="section-title text-white mb-8">{content.cta.title}</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={content.cta.primaryAction.href}>
              <Button variant="white">{content.cta.primaryAction.label}</Button>
            </Link>
            <Link href={content.cta.secondaryAction.href}>
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white border border-white/20"
              >
                {content.cta.secondaryAction.label}
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
